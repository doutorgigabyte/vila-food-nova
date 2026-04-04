-- ============================================
-- Driver-Store multi-linking system
-- Allows drivers to link to multiple stores
-- with request/approval flow
-- ============================================

-- Junction table: driver <-> establishment (many-to-many)
CREATE TABLE IF NOT EXISTS driver_store_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),
  commission_type TEXT DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
  commission_value NUMERIC(10,2) DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(driver_id, establishment_id)
);

CREATE INDEX idx_driver_store_links_driver ON driver_store_links (driver_id, status);
CREATE INDEX idx_driver_store_links_est ON driver_store_links (establishment_id, status);

-- RLS
ALTER TABLE driver_store_links ENABLE ROW LEVEL SECURITY;

-- Drivers can see their own links
CREATE POLICY "driver_store_links_driver_select" ON driver_store_links
  FOR SELECT TO authenticated
  USING (
    driver_id IN (SELECT id FROM delivery_drivers WHERE user_id = auth.uid())
  );

-- Drivers can create link requests
CREATE POLICY "driver_store_links_driver_insert" ON driver_store_links
  FOR INSERT TO authenticated
  WITH CHECK (
    driver_id IN (SELECT id FROM delivery_drivers WHERE user_id = auth.uid())
    AND status = 'pending'
  );

-- Establishment owners can see links for their stores
CREATE POLICY "driver_store_links_owner_select" ON driver_store_links
  FOR SELECT TO authenticated
  USING (
    establishment_id IN (SELECT id FROM establishments WHERE owner_id = auth.uid())
  );

-- Establishment owners can approve/reject links
CREATE POLICY "driver_store_links_owner_update" ON driver_store_links
  FOR UPDATE TO authenticated
  USING (
    establishment_id IN (SELECT id FROM establishments WHERE owner_id = auth.uid())
  );

-- RPC: Get linked stores for a driver
CREATE OR REPLACE FUNCTION get_driver_linked_stores(p_driver_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(json_build_object(
      'link_id', dsl.id,
      'establishment_id', e.id,
      'name', e.name,
      'slug', e.slug,
      'logo_url', e.logo_url,
      'address', e.address,
      'status', dsl.status,
      'commission_type', dsl.commission_type,
      'commission_value', dsl.commission_value,
      'is_active', dsl.is_active
    )), '[]'::json)
    FROM driver_store_links dsl
    JOIN establishments e ON e.id = dsl.establishment_id
    WHERE dsl.driver_id = p_driver_id AND dsl.status = 'approved'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_driver_linked_stores(UUID) TO authenticated;

-- RPC: Get pending driver requests for an establishment
CREATE OR REPLACE FUNCTION get_pending_driver_requests(p_establishment_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(json_build_object(
      'link_id', dsl.id,
      'driver_id', dd.id,
      'driver_name', dd.name,
      'driver_phone', dd.phone,
      'vehicle_type', dd.vehicle_type,
      'rating', dd.rating,
      'total_deliveries', dd.total_deliveries,
      'requested_at', dsl.requested_at
    )), '[]'::json)
    FROM driver_store_links dsl
    JOIN delivery_drivers dd ON dd.id = dsl.driver_id
    WHERE dsl.establishment_id = p_establishment_id AND dsl.status = 'pending'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_pending_driver_requests(UUID) TO authenticated;
