-- Create RPC function to get customer by phone and establishment
-- This bypasses RLS using SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_customer_by_phone_and_establishment(
  p_phone text,
  p_establishment_id uuid
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  establishment_id uuid,
  name text,
  phone text,
  email text,
  addresses jsonb,
  default_address jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.id, c.user_id, c.establishment_id, c.name, c.phone, 
    c.email, c.addresses, c.default_address, c.created_at, c.updated_at
  FROM public.customers c
  WHERE c.phone = p_phone 
    AND c.establishment_id = p_establishment_id
  LIMIT 1;
$$;