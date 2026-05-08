-- =============================================================================
-- Establishment outbox + dispatcher (item 4.5 — direção reversa)
-- Date: 2026-06-15
-- =============================================================================
--
-- Direção reversa do webhook bidirecional. Quando algo muda em
-- public.establishments (Vila Food), o trigger grava em
-- public.establishment_outbox e o dispatcher envia pra Smart Guide via
-- edge function.
--
-- Smart Guide recebe via /functions/v1/establishment-sync-from-vila-food
-- (a criar em tamandare-smart-guide/supabase/functions/).
--
-- Mesma arquitetura do 4.5 direção 1 (Smart Guide → Vila Food):
--   - Trigger AFTER INSERT/UPDATE/DELETE
--   - HMAC-SHA256 com PARTNER_SYNC_SECRET (mesmo secret cross-DB)
--   - Idempotência via event_id
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- Tabela outbox
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.establishment_outbox (
  id              BIGSERIAL PRIMARY KEY,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type      TEXT NOT NULL CHECK (event_type IN ('establishment.created', 'establishment.updated', 'establishment.deleted')),
  establishment_id UUID NOT NULL,
  payload         JSONB NOT NULL,
  smart_guide_delivered_at  TIMESTAMPTZ,
  smart_guide_attempts      INT NOT NULL DEFAULT 0,
  smart_guide_last_error    TEXT,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_establishment_outbox_pending
  ON public.establishment_outbox(occurred_at)
  WHERE smart_guide_delivered_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_establishment_outbox_estab
  ON public.establishment_outbox(establishment_id, occurred_at DESC);

COMMENT ON TABLE public.establishment_outbox IS
  'Outbox para webhook bidirecional establishment.* (4.5 reverso). Worker dispara pra Smart Guide via edge function.';

-- =============================================================================
-- Trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.tg_establishment_outbox()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_event_type TEXT;
  v_estab_id UUID;
  v_payload JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'establishment.created';
    v_estab_id := NEW.id;
    v_payload := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(OLD) - 'updated_at') = (to_jsonb(NEW) - 'updated_at') THEN
      RETURN NEW;
    END IF;
    v_event_type := 'establishment.updated';
    v_estab_id := NEW.id;
    v_payload := jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_event_type := 'establishment.deleted';
    v_estab_id := OLD.id;
    v_payload := to_jsonb(OLD);
  END IF;

  INSERT INTO public.establishment_outbox (event_type, establishment_id, payload)
  VALUES (v_event_type, v_estab_id, v_payload);

  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_establishment_outbox ON public.establishments;
CREATE TRIGGER trg_establishment_outbox
  AFTER INSERT OR UPDATE OR DELETE ON public.establishments
  FOR EACH ROW EXECUTE FUNCTION public.tg_establishment_outbox();

-- =============================================================================
-- Dispatcher
-- =============================================================================

CREATE OR REPLACE FUNCTION public.establishment_outbox_dispatch(
  p_batch_size INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, net AS $$
DECLARE
  v_secret TEXT;
  v_url TEXT;
  v_signature TEXT;
  v_dispatched INT := 0;
  v_failed INT := 0;
  v_request_id BIGINT;
  v_body TEXT;
  evt RECORD;
BEGIN
  SELECT decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets WHERE name = 'partner_sync_secret';

  IF v_secret IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', 'partner_sync_secret_not_in_vault'
    );
  END IF;

  v_url := current_setting('app.settings.smart_guide_url', true);
  IF v_url IS NULL OR v_url = '' THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'error', 'smart_guide_url_not_set',
      'hint', 'ALTER DATABASE postgres SET app.settings.smart_guide_url = ''https://supabasekong.../...'''
    );
  END IF;
  v_url := v_url || '/functions/v1/establishment-sync-from-vila-food';

  FOR evt IN
    SELECT id, event_type, establishment_id, payload, occurred_at
      FROM public.establishment_outbox
      WHERE smart_guide_delivered_at IS NULL
      ORDER BY occurred_at
      LIMIT p_batch_size
      FOR UPDATE SKIP LOCKED
  LOOP
    v_body := jsonb_build_object(
      'event_id', evt.id,
      'event_type', evt.event_type,
      'establishment_id', evt.establishment_id,
      'occurred_at', to_char(evt.occurred_at, 'YYYY-MM-DD"T"HH24:MI:SS.MSOF'),
      'payload', evt.payload
    )::TEXT;

    v_signature := encode(hmac(v_body::bytea, v_secret::bytea, 'sha256'), 'hex');

    BEGIN
      SELECT net.http_post(
        url := v_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-vila-food-signature', v_signature
        ),
        body := v_body::jsonb,
        timeout_milliseconds := 10000
      ) INTO v_request_id;

      UPDATE public.establishment_outbox SET
        smart_guide_delivered_at = now(),
        smart_guide_attempts = smart_guide_attempts + 1,
        smart_guide_last_error = NULL,
        delivered_at = now()
      WHERE id = evt.id;

      v_dispatched := v_dispatched + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.establishment_outbox SET
        smart_guide_attempts = smart_guide_attempts + 1,
        smart_guide_last_error = SQLERRM
      WHERE id = evt.id;
      v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'ok',
    'dispatched', v_dispatched,
    'failed', v_failed
  );
END $$;

-- =============================================================================
-- Cron: 1x/min
-- =============================================================================

SELECT cron.unschedule(jobid)
  FROM cron.job WHERE jobname = 'establishment-outbox-dispatch';

SELECT cron.schedule(
  'establishment-outbox-dispatch',
  '* * * * *',
  $$ SELECT public.establishment_outbox_dispatch(20); $$
);

-- =============================================================================
-- View health
-- =============================================================================

CREATE OR REPLACE VIEW public.establishment_outbox_health AS
SELECT
  COUNT(*) FILTER (WHERE smart_guide_delivered_at IS NULL) AS pending_smart_guide,
  COUNT(*) FILTER (WHERE smart_guide_delivered_at IS NULL AND occurred_at < now() - INTERVAL '1 hour') AS stuck_smart_guide,
  MAX(smart_guide_attempts) AS max_attempts,
  COUNT(*) FILTER (WHERE smart_guide_last_error IS NOT NULL) AS error_count,
  COUNT(*) AS total_events
FROM public.establishment_outbox;

GRANT SELECT ON public.establishment_outbox_health TO authenticated;
