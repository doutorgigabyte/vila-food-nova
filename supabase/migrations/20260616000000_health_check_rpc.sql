-- =============================================================================
-- public.health_check — endpoint publico de uptime monitoring (item 7.5)
-- Date: 2026-06-16
-- =============================================================================
--
-- Espelho do health_check do Smart Guide (tamandare-smart-guide migration
-- 20260613000000). Mesma API, schema-aware pra Vila Food.
--
-- Pra ser chamada por UptimeRobot/BetterStack via:
--   POST /rest/v1/rpc/health_check  (apikey: anon)
--
-- Checks:
--   1. Conexao com DB (implicito)
--   2. Tabelas core operacionais (establishments, orders)
--   3. Counts baseline (establishments ativos, orders 24h)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_catalog AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_status TEXT := 'ok';
  v_checks JSONB := '{}'::JSONB;
  v_estab_count INT;
  v_orders_24h INT;
  v_establishments_exists BOOLEAN;
  v_orders_exists BOOLEAN;
  v_latency_ms INT;
BEGIN
  v_establishments_exists := EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'establishments'
  );
  v_orders_exists := EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  );

  IF v_establishments_exists THEN
    SELECT COUNT(*) INTO v_estab_count FROM public.establishments
      WHERE COALESCE(active, true) = true;
  ELSE
    v_estab_count := 0;
  END IF;

  IF v_orders_exists THEN
    SELECT COUNT(*) INTO v_orders_24h FROM public.orders
      WHERE created_at > now() - INTERVAL '24 hours';
  ELSE
    v_orders_24h := 0;
  END IF;

  v_checks := jsonb_build_object(
    'establishments_table', v_establishments_exists,
    'orders_table', v_orders_exists,
    'establishments_active', v_estab_count,
    'orders_24h', v_orders_24h
  );

  IF NOT v_establishments_exists OR NOT v_orders_exists THEN
    v_status := 'degraded';
  END IF;

  v_latency_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_start))::INT;

  RETURN jsonb_build_object(
    'status', v_status,
    'ts', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'service', 'vila-food-nova',
    'latency_ms', v_latency_ms,
    'db_version', substring(version(), 1, 60),
    'checks', v_checks
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'ts', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'service', 'vila-food-nova',
    'error', SQLERRM
  );
END $$;

GRANT EXECUTE ON FUNCTION public.health_check() TO anon, authenticated;

COMMENT ON FUNCTION public.health_check() IS
  'Health check publico para UptimeRobot/BetterStack. Espelha o do Smart Guide (item 7.5). Anon-allowed (no PII).';
