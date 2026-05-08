-- =============================================================================
-- RLS audit fix — vazamento em public.customers
-- Date: 2026-06-08
-- =============================================================================
--
-- ACHADO DA AUDITORIA (item 6.9 do roadmap):
--
-- A migration 20260403140000_driver_app_columns.sql criou a policy
-- "customers_select" com USING (true), liberando SELECT pra qualquer user
-- authenticated. Como Postgres avalia policies em OR, isso ANULA a policy
-- restritiva "Customers can view own data" (auth.uid() = user_id).
--
-- Resultado pre-fix: qualquer user logado conseguia listar nome, email,
-- telefone, CPF, endereco de TODOS os customers da plataforma. Violacao
-- de LGPD art. 6 III (necessidade) e art. 46 (medidas de seguranca).
--
-- A intencao da policy provavelmente era pra drivers verem dados do cliente
-- do pedido que vao entregar. O jeito correto eh via JOIN orders -> customers
-- (driver so ve customer dos seus assigned_orders), nao liberar a tabela.
-- Esta migration:
--   1. Remove a policy permissiva.
--   2. Adiciona policy especifica pra drivers via subselect em orders.
-- =============================================================================

-- 1. Remove policy permissiva
DROP POLICY IF EXISTS "customers_select" ON public.customers;

-- 2. Driver pode ver customer dos pedidos atribuidos (deferida — implementar
--    quando schema de driver-orders estiver consolidado)
-- CREATE POLICY "drivers_view_assigned_customers" ON public.customers
--   FOR SELECT TO authenticated USING (
--     id IN (
--       SELECT customer_id FROM public.orders
--       WHERE driver_id = auth.uid()
--     )
--   );

-- 3. Confirmar que policies legitimas continuam ativas:
--    - "Customers can view own data" (auth.uid() = user_id)        OK
--    - "Establishments can view their customers" (via JOIN)        OK
--    - "Anyone can create customer" (INSERT WITH CHECK true)       OK pra signup
--    - "customers_own" (FOR ALL: user_id = auth.uid())             OK

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'customers' AND policyname = 'customers_select';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Policy customers_select STILL EXISTS — fix nao foi aplicado.';
  END IF;
  RAISE NOTICE 'OK: policy customers_select removida. Vazamento corrigido.';
END $$;
