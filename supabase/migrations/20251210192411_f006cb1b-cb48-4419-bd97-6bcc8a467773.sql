
-- FASE 1: SEGURANÇA FINANCEIRA - Corrigir exposição de tokens na tabela establishments

-- Criar função RPC segura que retorna apenas colunas públicas dos establishments
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

-- Criar função RPC segura para buscar establishment por slug (sem tokens)
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

-- Remover política pública que expõe todos os dados
DROP POLICY IF EXISTS "Anyone can view active establishments" ON public.establishments;

-- Criar nova política restritiva - apenas donos e admins veem dados completos
CREATE POLICY "Owners can view their establishments"
ON public.establishments
FOR SELECT
USING (
  owner_id = auth.uid() 
  OR has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM establishment_users eu 
    WHERE eu.establishment_id = establishments.id 
    AND eu.user_id = auth.uid() 
    AND eu.is_active = true
  )
);

-- Política para permitir visualização pública APENAS via RPC functions
-- Isso impede acesso direto à tabela mas permite as funções RPC
COMMENT ON FUNCTION public.get_public_establishments() IS 'Safe public access to establishments without exposing sensitive tokens';
COMMENT ON FUNCTION public.get_public_establishment_by_slug(text) IS 'Safe public access to single establishment by slug without exposing sensitive tokens';
