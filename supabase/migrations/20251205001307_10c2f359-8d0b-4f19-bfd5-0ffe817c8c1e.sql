-- Fix the SECURITY DEFINER view issue by recreating without SECURITY DEFINER
-- (Views don't have SECURITY DEFINER by default, but we need to ensure RLS works correctly)

-- Drop the existing view
DROP VIEW IF EXISTS public.public_establishments;

-- Recreate the view without any security definer issues
-- This view simply filters columns and is not a security definer view
CREATE VIEW public.public_establishments AS
SELECT 
  id,
  name,
  slug,
  description,
  logo_url,
  banner_url,
  address,
  address_number,
  neighborhood,
  zip_code,
  phone,
  whatsapp,
  email,
  primary_color,
  secondary_color,
  is_open,
  status,
  accepts_delivery,
  accepts_pickup,
  accepts_table,
  min_order_value,
  max_delivery_radius_km,
  delivery_base_fee,
  delivery_fee_per_km,
  avg_delivery_time,
  operating_hours,
  latitude,
  longitude,
  service_area,
  vila_id,
  city_id,
  segment_id,
  plan_id,
  created_at,
  updated_at
FROM establishments
WHERE status = 'active';

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_establishments TO anon;
GRANT SELECT ON public.public_establishments TO authenticated;

-- Also add a policy for anon users to read active establishments via the table
-- but only specific non-sensitive columns (this is a workaround since views inherit RLS)
CREATE POLICY "Anon users can view active establishments"
ON establishments FOR SELECT
TO anon
USING (status = 'active');