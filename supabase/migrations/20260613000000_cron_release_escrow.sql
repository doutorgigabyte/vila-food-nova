-- =============================================================================
-- pg_cron: agendar release-escrow-payouts diario (item 2.19 do roadmap)
-- Date: 2026-06-13
-- =============================================================================
--
-- Agenda invocacao da edge function release-escrow-payouts 1x/dia em horario
-- de baixa atividade (06:00 UTC = 03:00 BRT).
--
-- Pre-requisitos:
--   1. Extension pg_cron habilitada (Supabase: Database > Extensions > pg_cron)
--   2. Extension pg_net habilitada (pra invocar HTTP da edge function)
--   3. Variavel de ambiente SUPABASE_URL e service_role key acessivel via Vault
--
-- A funcao release-escrow-payouts ja eh idempotente — re-execucao no mesmo dia
-- nao duplica transferencias (cada split_item checa escrow_state='held' antes).
-- =============================================================================

-- Habilitar extensions (no-op se ja habilitadas)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- =============================================================================
-- Helper: invoca edge function com service_role auth
-- =============================================================================
-- IMPORTANTE: a service_role key NAO eh hardcoded aqui — vem do Vault.
-- Configurar em Database > Vault > Secrets:
--   nome: service_role_key
--   valor: <eyJ...> (copiar de Project Settings > API)

CREATE OR REPLACE FUNCTION public.cron_release_escrow_payouts()
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_supabase_url TEXT;
  v_service_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- Ler do Vault (Supabase managed)
  SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_service_key IS NULL THEN
    RAISE EXCEPTION 'service_role_key not found in vault';
  END IF;

  -- URL da instancia (vem de current_setting injetado pelo Supabase)
  v_supabase_url := current_setting('app.settings.supabase_url', true);
  IF v_supabase_url IS NULL OR v_supabase_url = '' THEN
    -- Fallback: construir do hostname do banco
    v_supabase_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co';
  END IF;

  -- Invoca via pg_net (assincrono — nao bloqueia o cron)
  SELECT net.http_post(
    url := v_supabase_url || '/functions/v1/release-escrow-payouts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  ) INTO v_request_id;

  RAISE NOTICE 'release-escrow-payouts invoked, pg_net request_id=%', v_request_id;
  RETURN v_request_id;
END;
$$;

COMMENT ON FUNCTION public.cron_release_escrow_payouts IS
  'Helper invocado pelo pg_cron pra disparar release-escrow-payouts edge function diariamente. Ler service_role_key do Vault. Idempotente.';

-- =============================================================================
-- Schedule: diario as 06:00 UTC (03:00 BRT — fora do pico)
-- =============================================================================

-- Limpa job antigo se existir (permite re-execucao da migration)
SELECT cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'release-escrow-payouts-daily';

-- Agenda novo
SELECT cron.schedule(
  'release-escrow-payouts-daily',
  '0 6 * * *',  -- diario 06:00 UTC
  $$ SELECT public.cron_release_escrow_payouts(); $$
);

-- =============================================================================
-- Observabilidade: view pra acompanhar execucoes recentes
-- =============================================================================

CREATE OR REPLACE VIEW public.cron_release_escrow_history AS
SELECT
  j.jobname,
  jrh.runid,
  jrh.start_time,
  jrh.end_time,
  jrh.status,
  jrh.return_message,
  EXTRACT(EPOCH FROM (jrh.end_time - jrh.start_time)) AS duration_sec
FROM cron.job_run_details jrh
JOIN cron.job j ON j.jobid = jrh.jobid
WHERE j.jobname = 'release-escrow-payouts-daily'
ORDER BY jrh.start_time DESC
LIMIT 30;

GRANT SELECT ON public.cron_release_escrow_history TO authenticated;

COMMENT ON VIEW public.cron_release_escrow_history IS
  '30 ultimas execucoes do cron de release-escrow. Util pra debug.';

-- =============================================================================
-- Validation: confirma que job ficou registrado
-- =============================================================================

DO $$
DECLARE
  v_job_count INT;
BEGIN
  SELECT COUNT(*) INTO v_job_count
    FROM cron.job WHERE jobname = 'release-escrow-payouts-daily';

  IF v_job_count = 0 THEN
    RAISE EXCEPTION 'Cron job release-escrow-payouts-daily nao foi registrado!';
  END IF;

  RAISE NOTICE 'Cron job ativo: release-escrow-payouts-daily as 06:00 UTC';
END $$;
