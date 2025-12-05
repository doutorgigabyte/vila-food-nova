-- Drop the view approach and use a secure function instead
DROP VIEW IF EXISTS public.public_establishments;

-- Create a secure function to get public establishment data
-- This function is SECURITY DEFINER but only exposes safe columns
CREATE OR REPLACE FUNCTION public.get_public_establishments()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  logo_url text,
  banner_url text,
  phone text,
  whatsapp text,
  email text,
  address text,
  address_number text,
  neighborhood text,
  zip_code text,
  city_id uuid,
  latitude numeric,
  longitude numeric,
  segment_id uuid,
  plan_id uuid,
  status establishment_status,
  is_open boolean,
  avg_delivery_time integer,
  accepts_delivery boolean,
  accepts_pickup boolean,
  accepts_table boolean,
  operating_hours jsonb,
  min_order_value numeric,
  delivery_base_fee numeric,
  delivery_fee_per_km numeric,
  max_delivery_radius_km numeric,
  service_area jsonb,
  primary_color text,
  secondary_color text,
  vila_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id, e.name, e.slug, e.description, e.logo_url, e.banner_url,
    e.phone, e.whatsapp, e.email, e.address, e.address_number,
    e.neighborhood, e.zip_code, e.city_id, e.latitude, e.longitude,
    e.segment_id, e.plan_id, e.status, e.is_open, e.avg_delivery_time,
    e.accepts_delivery, e.accepts_pickup, e.accepts_table, e.operating_hours,
    e.min_order_value, e.delivery_base_fee, e.delivery_fee_per_km,
    e.max_delivery_radius_km, e.service_area, e.primary_color, e.secondary_color,
    e.vila_id, e.created_at, e.updated_at
  FROM public.establishments e
  WHERE e.status = 'active'
$$;

-- Create function to get single establishment by slug (for store pages)
CREATE OR REPLACE FUNCTION public.get_public_establishment_by_slug(p_slug text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  logo_url text,
  banner_url text,
  phone text,
  whatsapp text,
  email text,
  address text,
  address_number text,
  neighborhood text,
  zip_code text,
  city_id uuid,
  latitude numeric,
  longitude numeric,
  segment_id uuid,
  plan_id uuid,
  status establishment_status,
  is_open boolean,
  avg_delivery_time integer,
  accepts_delivery boolean,
  accepts_pickup boolean,
  accepts_table boolean,
  operating_hours jsonb,
  min_order_value numeric,
  delivery_base_fee numeric,
  delivery_fee_per_km numeric,
  max_delivery_radius_km numeric,
  service_area jsonb,
  primary_color text,
  secondary_color text,
  vila_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id, e.name, e.slug, e.description, e.logo_url, e.banner_url,
    e.phone, e.whatsapp, e.email, e.address, e.address_number,
    e.neighborhood, e.zip_code, e.city_id, e.latitude, e.longitude,
    e.segment_id, e.plan_id, e.status, e.is_open, e.avg_delivery_time,
    e.accepts_delivery, e.accepts_pickup, e.accepts_table, e.operating_hours,
    e.min_order_value, e.delivery_base_fee, e.delivery_fee_per_km,
    e.max_delivery_radius_km, e.service_area, e.primary_color, e.secondary_color,
    e.vila_id, e.created_at, e.updated_at
  FROM public.establishments e
  WHERE e.slug = p_slug AND e.status = 'active'
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_public_establishments() TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_establishments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_establishment_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_establishment_by_slug(text) TO authenticated;