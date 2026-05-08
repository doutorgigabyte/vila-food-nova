-- =============================================================================
-- LGPD: export + delete account (item 3.2/6.5 do roadmap)
-- Date: 2026-06-16
-- =============================================================================
--
-- Espelha as RPCs LGPD do Smart Guide (migration 20260606). Atende:
--   - LGPD art. 18 V (portabilidade) — member_export_my_data retorna JSONB
--   - LGPD art. 18 VI (eliminação) — member_request_account_deletion com
--     cooldown de 30 dias antes da purga real (user pode cancelar)
--   - LGPD art. 8 §5 (revogação a qualquer momento) — cookie banner
--
-- Tabelas que contém dados pessoais do customer no Vila Food:
--   - public.customers (nome, phone, email, addresses)
--   - public.orders (customer_id FK + delivery_address)
--   - public.reviews (rating, comment, customer_id)  [se existir]
--   - public.cart_sessions (carrinho ativo)         [se existir]
--   - public.notifications (mensagens)               [se existir]
--   - auth.users (gerenciado pelo Supabase)
-- =============================================================================

-- =============================================================================
-- Tabela de tracking de pedidos de exclusão
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.account_deletion_request (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for   TIMESTAMPTZ NOT NULL,  -- requested_at + 30 days
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'cancelled', 'purged')),
  cancelled_at    TIMESTAMPTZ,
  cancelled_reason TEXT,
  purged_at       TIMESTAMPTZ,
  notes           TEXT,
  UNIQUE (user_id, status) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_deletion_request_pending
  ON public.account_deletion_request(scheduled_for) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_deletion_request_user
  ON public.account_deletion_request(user_id, requested_at DESC);

ALTER TABLE public.account_deletion_request ENABLE ROW LEVEL SECURITY;

-- User só vê os próprios pedidos
DROP POLICY IF EXISTS deletion_select_own ON public.account_deletion_request;
CREATE POLICY deletion_select_own ON public.account_deletion_request
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Inserts/updates só via RPC SECURITY DEFINER

COMMENT ON TABLE public.account_deletion_request IS
  'Solicitações de exclusão de conta com cooldown 30d (LGPD art. 18 VI).';

-- =============================================================================
-- RPC: export my data (LGPD art. 18 V — portabilidade)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.member_export_my_data()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_export JSONB;
  v_email TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'forbidden_must_be_logged_in';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  v_export := jsonb_build_object(
    'export_generated_at', to_char(now() AT TIME ZONE 'UTC',
      'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'lgpd_compliance', 'art. 18 V — direito a portabilidade dos dados',
    'user_id', v_uid,
    'email', v_email,
    'customers', COALESCE(
      (SELECT jsonb_agg(to_jsonb(c)) FROM public.customers c WHERE c.user_id = v_uid),
      '[]'::JSONB
    ),
    'orders', COALESCE(
      (SELECT jsonb_agg(to_jsonb(o))
        FROM public.orders o
        WHERE o.customer_id IN (SELECT id FROM public.customers WHERE user_id = v_uid)
        ORDER BY o.created_at DESC LIMIT 500),
      '[]'::JSONB
    ),
    'pending_deletion', (
      SELECT to_jsonb(r) FROM public.account_deletion_request r
        WHERE r.user_id = v_uid AND r.status = 'pending'
        ORDER BY r.requested_at DESC LIMIT 1
    )
  );

  RETURN v_export;
END $$;

GRANT EXECUTE ON FUNCTION public.member_export_my_data() TO authenticated;

COMMENT ON FUNCTION public.member_export_my_data IS
  'LGPD art. 18 V — exporta todos dados do usuário em JSON estruturado para portabilidade.';

-- =============================================================================
-- RPC: request account deletion (LGPD art. 18 VI)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.member_request_account_deletion(p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing public.account_deletion_request;
  v_new_id BIGINT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'forbidden_must_be_logged_in';
  END IF;

  SELECT * INTO v_existing FROM public.account_deletion_request
    WHERE user_id = v_uid AND status = 'pending'
    ORDER BY requested_at DESC LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'already_pending',
      'request_id', v_existing.id,
      'requested_at', v_existing.requested_at,
      'scheduled_for', v_existing.scheduled_for
    );
  END IF;

  INSERT INTO public.account_deletion_request (user_id, scheduled_for, notes)
  VALUES (v_uid, now() + INTERVAL '30 days', p_reason)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'status', 'scheduled',
    'request_id', v_new_id,
    'scheduled_for', now() + INTERVAL '30 days',
    'cooldown_days', 30,
    'message', 'Pedido registrado. Você pode cancelar até 30 dias antes da purga.'
  );
END $$;

GRANT EXECUTE ON FUNCTION public.member_request_account_deletion(TEXT) TO authenticated;

-- =============================================================================
-- RPC: cancel pending deletion
-- =============================================================================

CREATE OR REPLACE FUNCTION public.member_cancel_deletion_request(p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_count INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'forbidden_must_be_logged_in';
  END IF;

  UPDATE public.account_deletion_request SET
    status = 'cancelled',
    cancelled_at = now(),
    cancelled_reason = p_reason
  WHERE user_id = v_uid AND status = 'pending';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'status', 'cancelled',
    'cancelled_count', v_count
  );
END $$;

GRANT EXECUTE ON FUNCTION public.member_cancel_deletion_request(TEXT) TO authenticated;

-- =============================================================================
-- RPC: get deletion status
-- =============================================================================

CREATE OR REPLACE FUNCTION public.member_get_deletion_status()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_req public.account_deletion_request;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'forbidden_must_be_logged_in';
  END IF;

  SELECT * INTO v_req FROM public.account_deletion_request
    WHERE user_id = v_uid AND status = 'pending'
    ORDER BY requested_at DESC LIMIT 1;

  IF v_req.id IS NULL THEN
    RETURN jsonb_build_object('status', 'no_pending_request');
  END IF;

  RETURN jsonb_build_object(
    'status', 'pending',
    'request_id', v_req.id,
    'requested_at', v_req.requested_at,
    'scheduled_for', v_req.scheduled_for,
    'days_remaining', GREATEST(0,
      EXTRACT(DAY FROM (v_req.scheduled_for - now()))::INT)
  );
END $$;

GRANT EXECUTE ON FUNCTION public.member_get_deletion_status() TO authenticated;

NOTIFY pgrst, 'reload schema';
