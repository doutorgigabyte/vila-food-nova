
-- 1. RPC para delivery_drivers com PIX mascarado (para uso do estabelecimento)
CREATE OR REPLACE FUNCTION public.get_establishment_drivers(p_establishment_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  email text,
  vehicle_type text,
  license_plate text,
  is_available boolean,
  is_active boolean,
  rating_average numeric,
  total_deliveries integer,
  complaint_count integer,
  masked_pix_key text,
  pix_key_type text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify user has access to this establishment
  IF NOT (
    EXISTS (SELECT 1 FROM establishments WHERE id = p_establishment_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM establishment_users WHERE establishment_id = p_establishment_id AND user_id = auth.uid() AND is_active = true)
    OR public.has_role(auth.uid(), 'super_admin')
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    dd.id,
    dd.name,
    dd.phone,
    dd.email,
    dd.vehicle_type,
    dd.license_plate,
    dd.is_available,
    dd.is_active,
    dd.rating_average,
    dd.total_deliveries,
    dd.complaint_count,
    -- Mask PIX key: show only last 4 characters
    CASE 
      WHEN dd.pix_key IS NOT NULL AND LENGTH(dd.pix_key) > 4 
      THEN '***' || RIGHT(dd.pix_key, 4)
      WHEN dd.pix_key IS NOT NULL 
      THEN '****'
      ELSE NULL
    END as masked_pix_key,
    dd.pix_key_type,
    dd.created_at,
    dd.updated_at
  FROM delivery_drivers dd
  JOIN driver_establishment_links del ON del.driver_id = dd.id
  WHERE del.establishment_id = p_establishment_id
    AND del.status = 'approved';
END;
$$;

-- 2. RPC para customers com PII mascarado (para uso do estabelecimento)
CREATE OR REPLACE FUNCTION public.get_establishment_customers(p_establishment_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  masked_phone text,
  masked_email text,
  birth_month integer,
  order_count bigint,
  total_spent numeric,
  last_order_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify user has access to this establishment
  IF NOT (
    EXISTS (SELECT 1 FROM establishments WHERE id = p_establishment_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM establishment_users WHERE establishment_id = p_establishment_id AND user_id = auth.uid() AND is_active = true)
    OR public.has_role(auth.uid(), 'super_admin')
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    -- Mask phone: show only last 4 digits
    CASE 
      WHEN c.phone IS NOT NULL AND LENGTH(c.phone) > 4 
      THEN '***' || RIGHT(c.phone, 4)
      WHEN c.phone IS NOT NULL 
      THEN '****'
      ELSE NULL
    END as masked_phone,
    -- Mask email: show first 2 chars + *** + domain
    CASE 
      WHEN c.email IS NOT NULL AND POSITION('@' IN c.email) > 2
      THEN LEFT(c.email, 2) || '***@' || SPLIT_PART(c.email, '@', 2)
      WHEN c.email IS NOT NULL 
      THEN '***@***'
      ELSE NULL
    END as masked_email,
    -- Only show birth month (for birthday promotions), not full date
    EXTRACT(MONTH FROM c.birth_date)::integer as birth_month,
    -- Aggregate order stats
    COALESCE(stats.order_count, 0) as order_count,
    COALESCE(stats.total_spent, 0) as total_spent,
    stats.last_order_at,
    c.created_at
  FROM customers c
  LEFT JOIN LATERAL (
    SELECT 
      COUNT(*)::bigint as order_count,
      SUM(o.total) as total_spent,
      MAX(o.created_at) as last_order_at
    FROM orders o
    WHERE o.customer_id = c.id 
      AND o.establishment_id = p_establishment_id
      AND o.status NOT IN ('cancelled')
  ) stats ON true
  WHERE c.establishment_id = p_establishment_id
    OR EXISTS (
      SELECT 1 FROM orders o 
      WHERE o.customer_id = c.id 
        AND o.establishment_id = p_establishment_id
    );
END;
$$;

-- 3. RPC para abandoned_carts com dados mascarados
CREATE OR REPLACE FUNCTION public.get_establishment_abandoned_carts(p_establishment_id uuid)
RETURNS TABLE (
  id uuid,
  customer_name text,
  masked_phone text,
  items jsonb,
  total numeric,
  recovered boolean,
  recovery_attempts integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  last_recovery_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify user has access to this establishment
  IF NOT (
    EXISTS (SELECT 1 FROM establishments WHERE id = p_establishment_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM establishment_users WHERE establishment_id = p_establishment_id AND user_id = auth.uid() AND is_active = true)
    OR public.has_role(auth.uid(), 'super_admin')
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    ac.id,
    ac.customer_name,
    -- Mask phone for display, but keep full for recovery actions
    CASE 
      WHEN ac.customer_phone IS NOT NULL AND LENGTH(ac.customer_phone) > 4 
      THEN LEFT(ac.customer_phone, 4) || '****' || RIGHT(ac.customer_phone, 2)
      ELSE '****'
    END as masked_phone,
    ac.items,
    ac.total,
    ac.recovered,
    ac.recovery_attempts,
    ac.created_at,
    ac.updated_at,
    ac.last_recovery_at
  FROM abandoned_carts ac
  WHERE ac.establishment_id = p_establishment_id
    AND ac.recovered = false
  ORDER BY ac.created_at DESC;
END;
$$;

-- 4. Fortalecer RLS de abandoned_carts - permitir membros do estabelecimento
DROP POLICY IF EXISTS "Establishment owners can view their abandoned carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Establishment members can view abandoned carts" ON abandoned_carts;

CREATE POLICY "Establishment members can view abandoned carts"
ON abandoned_carts FOR SELECT
USING (
  EXISTS (SELECT 1 FROM establishments WHERE id = establishment_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM establishment_users WHERE establishment_id = abandoned_carts.establishment_id AND user_id = auth.uid() AND is_active = true)
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Establishment members can update abandoned carts"
ON abandoned_carts FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM establishments WHERE id = establishment_id AND owner_id = auth.uid())
  OR EXISTS (SELECT 1 FROM establishment_users WHERE establishment_id = abandoned_carts.establishment_id AND user_id = auth.uid() AND is_active = true)
  OR public.has_role(auth.uid(), 'super_admin')
);
