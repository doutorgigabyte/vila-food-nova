-- Drop and recreate the view with SECURITY INVOKER to use the querying user's permissions
DROP VIEW IF EXISTS public.public_establishments;

CREATE VIEW public.public_establishments
WITH (security_invoker = true)
AS
SELECT 
  id,
  name,
  slug,
  description,
  logo_url,
  banner_url,
  phone,
  whatsapp,
  email,
  address,
  address_number,
  neighborhood,
  zip_code,
  city_id,
  latitude,
  longitude,
  segment_id,
  plan_id,
  status,
  is_open,
  avg_delivery_time,
  accepts_delivery,
  accepts_pickup,
  accepts_table,
  operating_hours,
  min_order_value,
  delivery_base_fee,
  delivery_fee_per_km,
  max_delivery_radius_km,
  service_area,
  primary_color,
  secondary_color,
  vila_id,
  created_at,
  updated_at
FROM public.establishments
WHERE status = 'active';

-- Grant access to the view
GRANT SELECT ON public.public_establishments TO anon;
GRANT SELECT ON public.public_establishments TO authenticated;