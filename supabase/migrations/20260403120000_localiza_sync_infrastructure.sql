-- ============================================
-- LocalizAI <-> VIlaFood Sync Infrastructure
-- ============================================

-- Enum: sync types
CREATE TYPE localiza_sync_type AS ENUM (
  'establishments',
  'products',
  'reviews',
  'promotions'
);

-- Enum: sync direction
CREATE TYPE localiza_sync_direction AS ENUM (
  'to_localiza',
  'from_localiza',
  'bidirectional'
);

-- Enum: sync status
CREATE TYPE localiza_sync_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed'
);

-- Enum: mapping status
CREATE TYPE localiza_mapping_status AS ENUM (
  'active',
  'paused',
  'error'
);

-- ============================================
-- Table: localiza_sync_log
-- Tracks every sync operation between systems
-- ============================================
CREATE TABLE IF NOT EXISTS localiza_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type localiza_sync_type NOT NULL,
  direction localiza_sync_direction NOT NULL,
  status localiza_sync_status NOT NULL DEFAULT 'pending',
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying recent sync operations
CREATE INDEX idx_localiza_sync_log_created ON localiza_sync_log (created_at DESC);
CREATE INDEX idx_localiza_sync_log_type_status ON localiza_sync_log (sync_type, status);

-- ============================================
-- Table: localiza_place_mapping
-- Maps LocalizAI place_id <-> VIlaFood establishment_id
-- ============================================
CREATE TABLE IF NOT EXISTS localiza_place_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  localiza_place_id TEXT NOT NULL,
  google_place_id TEXT,
  sync_status localiza_mapping_status NOT NULL DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  sync_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(establishment_id),
  UNIQUE(localiza_place_id)
);

-- Indexes for mapping lookups
CREATE INDEX idx_localiza_mapping_establishment ON localiza_place_mapping (establishment_id);
CREATE INDEX idx_localiza_mapping_place ON localiza_place_mapping (localiza_place_id);
CREATE INDEX idx_localiza_mapping_status ON localiza_place_mapping (sync_status);

-- ============================================
-- Add sync columns to establishments table
-- ============================================
ALTER TABLE establishments
  ADD COLUMN IF NOT EXISTS localiza_place_id TEXT,
  ADD COLUMN IF NOT EXISTS localiza_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS localiza_sync_enabled BOOLEAN DEFAULT false;

-- Index for quick sync-enabled lookups
CREATE INDEX idx_establishments_localiza_sync ON establishments (localiza_sync_enabled) WHERE localiza_sync_enabled = true;

-- ============================================
-- RLS Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE localiza_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE localiza_place_mapping ENABLE ROW LEVEL SECURITY;

-- Sync log: readable by authenticated users
CREATE POLICY "localiza_sync_log_select" ON localiza_sync_log
  FOR SELECT TO authenticated USING (true);

-- Sync log: writable only by service_role (edge functions)
-- No INSERT/UPDATE/DELETE policy for authenticated = only service_role can write

-- Place mapping: readable by authenticated users
CREATE POLICY "localiza_place_mapping_select" ON localiza_place_mapping
  FOR SELECT TO authenticated USING (true);

-- Place mapping: establishment owners can view their own mapping
CREATE POLICY "localiza_place_mapping_owner_select" ON localiza_place_mapping
  FOR SELECT TO authenticated
  USING (
    establishment_id IN (
      SELECT id FROM establishments WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- RPC: get_localiza_sync_status
-- Returns sync dashboard data
-- ============================================
CREATE OR REPLACE FUNCTION get_localiza_sync_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_mapped', (SELECT COUNT(*) FROM localiza_place_mapping),
    'active_mappings', (SELECT COUNT(*) FROM localiza_place_mapping WHERE sync_status = 'active'),
    'sync_enabled_establishments', (SELECT COUNT(*) FROM establishments WHERE localiza_sync_enabled = true),
    'recent_syncs', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
      FROM (
        SELECT id, sync_type, direction, status, records_processed, records_failed,
               error_message, started_at, completed_at, created_at
        FROM localiza_sync_log
        ORDER BY created_at DESC
        LIMIT 10
      ) s
    ),
    'last_successful_sync', (
      SELECT completed_at FROM localiza_sync_log
      WHERE status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_localiza_sync_status() TO authenticated;

-- ============================================
-- Trigger: auto-update updated_at on mapping
-- ============================================
CREATE OR REPLACE FUNCTION update_localiza_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_localiza_mapping_updated_at
  BEFORE UPDATE ON localiza_place_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_localiza_mapping_updated_at();
