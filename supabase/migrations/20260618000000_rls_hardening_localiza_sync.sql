-- ============================================================================
-- RLS Hardening — LocalizAI sync infrastructure
-- ============================================================================
-- Originated from a pre-go-live audit. Two leaks were found in migrations
-- 20260403120000 / 20260403130000:
--
-- 1. `localiza_sync_log_select` had USING (true) for the authenticated role,
--    meaning any logged-in user (customer, merchant, driver) could read the
--    full sync history of every establishment on the platform — including
--    payload hashes and error messages that may reveal merchant counts and
--    activity patterns to competitors.
--
-- 2. `localiza_place_mapping_select` had the same USING (true), exposing the
--    mapping between internal establishment IDs and the external LocalizAI
--    place IDs. Combined with #1 this is enough to enumerate the entire
--    merchant base.
--
-- 3. Three SECURITY DEFINER functions defined in those same migrations were
--    missing `SET search_path`, which is the standard hardening (CVE-2018-1058
--    pattern — a malicious search_path entry can override builtin functions
--    when SECURITY DEFINER runs as the function owner).
--
-- This migration is idempotent: dropping a policy that no longer exists is
-- silenced by IF EXISTS, and `ALTER FUNCTION ... SET search_path` is safe to
-- re-run.
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. localiza_sync_log: tighten SELECT to admins only.
-- --------------------------------------------------------------------------
-- Sync state is operational data — only admins need to see it from the UI.
-- Edge functions go through service_role and bypass RLS, so the cron / sync
-- workers keep working.

DROP POLICY IF EXISTS "localiza_sync_log_select" ON public.localiza_sync_log;

CREATE POLICY "localiza_sync_log_admin_select" ON public.localiza_sync_log
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- --------------------------------------------------------------------------
-- 2. localiza_place_mapping: drop the open SELECT.
-- --------------------------------------------------------------------------
-- The existing `localiza_place_mapping_owner_select` policy already lets the
-- establishment owner see their own mapping, which is the only legitimate
-- merchant-side use case. We just remove the global one.

DROP POLICY IF EXISTS "localiza_place_mapping_select" ON public.localiza_place_mapping;

CREATE POLICY "localiza_place_mapping_admin_select" ON public.localiza_place_mapping
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- --------------------------------------------------------------------------
-- 3. Lock down SECURITY DEFINER search_path for the LocalizAI RPCs.
-- --------------------------------------------------------------------------
-- These already exist; we just attach the missing SET. If any of these
-- functions don't exist on this database (e.g. partial rollout), the ALTER
-- is wrapped in DO/EXCEPTION so it doesn't break the migration.

DO $$
BEGIN
  ALTER FUNCTION public.get_localiza_sync_status() SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'get_localiza_sync_status() not found, skipping search_path lock';
END
$$;

DO $$
BEGIN
  ALTER FUNCTION public.get_localiza_products(TEXT) SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'get_localiza_products(TEXT) not found, skipping search_path lock';
END
$$;

DO $$
BEGIN
  ALTER FUNCTION public.get_localiza_reviews(TEXT) SET search_path = public;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'get_localiza_reviews(TEXT) not found, skipping search_path lock';
END
$$;

-- --------------------------------------------------------------------------
-- 4. Sanity assertion: refuse to land if the open policies somehow survived.
-- --------------------------------------------------------------------------
DO $$
DECLARE
  open_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO open_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND policyname IN ('localiza_sync_log_select', 'localiza_place_mapping_select');

  IF open_policy_count > 0 THEN
    RAISE EXCEPTION
      'RLS hardening failed: open policies still present (count=%). Aborting deploy to prevent silent rollback.',
      open_policy_count;
  END IF;
END
$$;
