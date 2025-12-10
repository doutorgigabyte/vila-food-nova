
-- Função RPC segura para buscar establishments com filtros (para marketplace)
CREATE OR REPLACE FUNCTION public.get_public_establishments_filtered(
  p_segment_ids uuid[] DEFAULT NULL,
  p_limit integer DEFAULT 100
)
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
  rating_average numeric,
  rating_count integer,
  vila_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  segment_name text,
  segment_icon text
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
    e.rating_average, e.rating_count,
    e.vila_id, e.created_at, e.updated_at,
    s.name as segment_name,
    s.icon as segment_icon
  FROM public.establishments e
  LEFT JOIN public.segments s ON s.id = e.segment_id
  WHERE e.status = 'active'
    AND (p_segment_ids IS NULL OR e.segment_id = ANY(p_segment_ids))
  LIMIT p_limit
$$;

-- Função RPC para buscar establishments por segment_id único
CREATE OR REPLACE FUNCTION public.get_public_establishments_by_segment(
  p_segment_id uuid,
  p_limit integer DEFAULT 100
)
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
  rating_average numeric,
  rating_count integer,
  vila_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  segment_name text,
  segment_icon text
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
    e.rating_average, e.rating_count,
    e.vila_id, e.created_at, e.updated_at,
    s.name as segment_name,
    s.icon as segment_icon
  FROM public.establishments e
  LEFT JOIN public.segments s ON s.id = e.segment_id
  WHERE e.status = 'active'
    AND e.segment_id = p_segment_id
  LIMIT p_limit
$$;

-- Função RPC para contar establishments ativos por vila
CREATE OR REPLACE FUNCTION public.count_public_establishments_by_vila(p_vila_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.establishments
  WHERE status = 'active' AND vila_id = p_vila_id
$$;
