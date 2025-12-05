-- Create a secure view for public establishment access that excludes payment credentials
CREATE OR REPLACE VIEW public.public_establishments AS
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

-- Grant access to the view for anon and authenticated users
GRANT SELECT ON public.public_establishments TO anon;
GRANT SELECT ON public.public_establishments TO authenticated;

-- Drop the overly permissive RLS policies that expose payment credentials
DROP POLICY IF EXISTS "Anon users can view active establishments" ON public.establishments;
DROP POLICY IF EXISTS "Authenticated users can view active establishments" ON public.establishments;

-- Create new restrictive policies - owners and admins can see full data including credentials
-- Anon/authenticated users should use the public_establishments view instead
CREATE POLICY "Owners can view and manage own establishment"
ON public.establishments
FOR ALL
USING (auth.uid() = owner_id);

CREATE POLICY "Super admins can manage all establishments"
ON public.establishments
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow service role (Edge Functions) to read establishments
-- This is needed for Edge Functions that use service_role_key
CREATE POLICY "Service role full access"
ON public.establishments
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');