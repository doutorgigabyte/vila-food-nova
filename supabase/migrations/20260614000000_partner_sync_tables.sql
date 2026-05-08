-- =============================================================================
-- partner_sync_state + partner_sync_log — receptor do webhook do Rota T (4.5)
-- Date: 2026-06-14
-- =============================================================================
--
-- Tabelas que armazenam o estado sincronizado de partners vindos do Smart Guide
-- (banco compartilhado entre Rota T + Localiza). Vila Food tem banco separado,
-- entao replica via webhook + idempotencia por event_id.
--
-- Pre-requisito: edge function partner-sync-from-rota deployed.
-- =============================================================================

-- =============================================================================
-- partner_sync_state — last event aplicado per partner (idempotencia)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.partner_sync_state (
  partner_id          UUID PRIMARY KEY,
  last_event_id       BIGINT NOT NULL,
  last_event_type     TEXT NOT NULL,
  last_received_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_sync_state_received
  ON public.partner_sync_state(last_received_at DESC);

COMMENT ON TABLE public.partner_sync_state IS
  'Cursor de sincronizacao com Rota T por partner. last_event_id usado pra deduplicar webhooks (item 4.5).';

-- =============================================================================
-- partner_sync_log — historico append-only de eventos recebidos
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.partner_sync_log (
  id              BIGSERIAL PRIMARY KEY,
  event_id        BIGINT NOT NULL,
  event_type      TEXT NOT NULL,
  partner_id      UUID NOT NULL,
  occurred_at     TIMESTAMPTZ NOT NULL,
  payload         JSONB NOT NULL,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Garantir uniqueness por (partner_id, event_id) — extra layer de idempotencia
  UNIQUE (partner_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_sync_log_partner
  ON public.partner_sync_log(partner_id, event_id DESC);

CREATE INDEX IF NOT EXISTS idx_partner_sync_log_received
  ON public.partner_sync_log(received_at DESC);

COMMENT ON TABLE public.partner_sync_log IS
  'Log append-only de eventos partner.* recebidos do Rota T (item 4.5). Util pra rebuild de state.';

-- Append-only: revogar UPDATE/DELETE pra authenticated/anon
REVOKE UPDATE, DELETE ON public.partner_sync_log FROM authenticated, anon;

-- =============================================================================
-- RLS: apenas service_role (edge function) escreve; admin le
-- =============================================================================

ALTER TABLE public.partner_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sync_log ENABLE ROW LEVEL SECURITY;

-- service_role bypassa RLS automaticamente
-- authenticated nao tem acesso (default deny)

-- =============================================================================
-- View pra admin: status de sync
-- =============================================================================

CREATE OR REPLACE VIEW public.partner_sync_health AS
SELECT
  COUNT(*) AS partners_synced,
  MAX(last_received_at) AS last_event_at,
  EXTRACT(EPOCH FROM (now() - MAX(last_received_at)))::INT AS seconds_since_last,
  (SELECT COUNT(*) FROM public.partner_sync_log WHERE received_at > now() - INTERVAL '24 hours') AS events_24h
FROM public.partner_sync_state;

GRANT SELECT ON public.partner_sync_health TO authenticated;

COMMENT ON VIEW public.partner_sync_health IS
  'Saude do sync: seconds_since_last alto (>3600) sugere worker travado.';
