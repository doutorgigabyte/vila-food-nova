-- Create a secure view for public establishment data that excludes payment credentials
CREATE OR REPLACE VIEW public.public_establishments AS
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
  -- Excluded: mercado_pago_token, mp_refresh_token, mp_public_key, mp_user_id, mp_token_expires_at, pagseguro_token, pix_key, owner_id
FROM establishments
WHERE status = 'active';

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_establishments TO anon;
GRANT SELECT ON public.public_establishments TO authenticated;

-- Update RLS policy to be more restrictive on the establishments table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view active establishments" ON establishments;

-- Create a new policy that allows public read only of non-sensitive columns via RPC or specific columns
-- For direct table access, require authentication or use the view
CREATE POLICY "Authenticated users can view active establishments"
ON establishments FOR SELECT
TO authenticated
USING (status = 'active');

-- Create policy for anon users that only allows viewing specific columns
-- This is handled through the view, so we don't need a direct policy for anon

-- Update orders table RLS policy to be more restrictive
DROP POLICY IF EXISTS "Anyone can create order" ON orders;

-- Require either authenticated user or valid establishment
CREATE POLICY "Authenticated users can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow service role to create orders (for WhatsApp checkout)
CREATE POLICY "Service role can create orders"
ON orders FOR INSERT
TO service_role
WITH CHECK (true);

-- Update customers table RLS policy
DROP POLICY IF EXISTS "Anyone can create customer" ON customers;

-- Require authentication for customer creation
CREATE POLICY "Authenticated users can create customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow service role to create customers (for WhatsApp checkout)
CREATE POLICY "Service role can create customers"
ON customers FOR INSERT
TO service_role
WITH CHECK (true);