-- =============================================================================
-- Retention cleanup pras tabelas append-only/log do Vila Food (hygiene)
-- Date: 2026-06-17
-- =============================================================================
--
-- Tabelas que crescem indefinidamente:
--   - public.establishment_outbox (1 row por mudanca em establishments)
--   - public.partner_sync_log     (1 row por evento Smart Guide -> Vila Food)
--   - public.account_deletion_request (auto-purga ao processar — manter rastreio)
--
-- Politica:
--   - establishment_outbox: 90d apos delivered
--   - partner_sync_log:     90d
--   - account_deletion_request: 1 ano apos status final (purged/cancelled)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.cleanup_establishment_outbox(p_retention_days INT DEFAULT 90)
RETURNS JSONB
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deleted INT;
  v_threshold TIMESTAMPTZ := now() - (p_retention_days || ' days')::INTERVAL;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'establishment_outbox'
  ) THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'table_not_exists');
  END IF;

  DELETE FROM public.establishment_outbox
    WHERE delivered_at IS NOT NULL
      AND delivered_at < v_threshold;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'status', 'ok',
    'deleted', v_deleted,
    'threshold_days', p_retention_days
  );
END $$;

GRANT EXECUTE ON FUNCTION public.cleanup_establishment_outbox(INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_partner_sync_log(p_retention_days INT DEFAULT 90)
RETURNS JSONB
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deleted INT;
  v_threshold TIMESTAMPTZ := now() - (p_retention_days || ' days')::INTERVAL;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'partner_sync_log'
  ) THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'table_not_exists');
  END IF;

  DELETE FROM public.partner_sync_log
    WHERE received_at < v_threshold;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'status', 'ok',
    'deleted', v_deleted,
    'threshold_days', p_retention_days
  );
END $$;

GRANT EXECUTE ON FUNCTION public.cleanup_partner_sync_log(INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_account_deletion_requests(p_retention_days INT DEFAULT 365)
RETURNS JSONB
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_deleted INT;
  v_threshold TIMESTAMPTZ := now() - (p_retention_days || ' days')::INTERVAL;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'account_deletion_request'
  ) THEN
    RETURN jsonb_build_object('status', 'skipped', 'reason', 'table_not_exists');
  END IF;

  -- Apaga apenas requests em estado final (cancelled/purged) com mais de 1 ano
  -- — preserva pending pra cooldown e rastreabilidade de pedidos recentes
  DELETE FROM public.account_deletion_request
    WHERE status IN ('cancelled', 'purged')
      AND COALESCE(cancelled_at, purged_at) < v_threshold;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'status', 'ok',
    'deleted', v_deleted,
    'threshold_days', p_retention_days
  );
END $$;

GRANT EXECUTE ON FUNCTION public.cleanup_account_deletion_requests(INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_retention_all()
RETURNS JSONB
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_results JSONB := '{}'::JSONB;
BEGIN
  v_results := v_results || jsonb_build_object(
    'establishment_outbox', public.cleanup_establishment_outbox(90)
  );
  v_results := v_results || jsonb_build_object(
    'partner_sync_log', public.cleanup_partner_sync_log(90)
  );
  v_results := v_results || jsonb_build_object(
    'account_deletion_request', public.cleanup_account_deletion_requests(365)
  );

  RETURN jsonb_build_object(
    'status', 'ok',
    'ts', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'results', v_results
  );
END $$;

GRANT EXECUTE ON FUNCTION public.cleanup_retention_all() TO authenticated;

-- Cron 1x/dia as 04:00 UTC (01:00 BRT)
SELECT cron.unschedule(jobid)
  FROM cron.job WHERE jobname = 'retention-cleanup-daily';

SELECT cron.schedule(
  'retention-cleanup-daily',
  '0 4 * * *',
  $$ SELECT public.cleanup_retention_all(); $$
);

CREATE OR REPLACE VIEW public.cleanup_history AS
SELECT
  jrh.runid,
  jrh.start_time,
  jrh.end_time,
  jrh.status,
  jrh.return_message,
  EXTRACT(EPOCH FROM (jrh.end_time - jrh.start_time)) AS duration_sec
FROM cron.job_run_details jrh
JOIN cron.job j ON j.jobid = jrh.jobid
WHERE j.jobname = 'retention-cleanup-daily'
ORDER BY jrh.start_time DESC
LIMIT 30;

GRANT SELECT ON public.cleanup_history TO authenticated;
