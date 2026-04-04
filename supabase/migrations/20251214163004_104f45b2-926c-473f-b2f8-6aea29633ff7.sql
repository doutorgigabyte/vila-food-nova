-- Adicionar campos de serviço às cidades
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS is_service_area boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS center_lat numeric,
ADD COLUMN IF NOT EXISTS center_lng numeric,
ADD COLUMN IF NOT EXISTS radius_km numeric DEFAULT 30;

-- Marcar Tamandaré como área de serviço ativa
UPDATE public.cities 
SET 
  is_service_area = true,
  center_lat = -8.7576,
  center_lng = -35.1031,
  radius_km = 30
WHERE LOWER(name) = 'tamandaré' OR LOWER(name) = 'tamandare';

-- Inserir configuração da região ativa
INSERT INTO public.platform_settings (setting_key, setting_value, description)
VALUES (
  'active_region',
  '{
    "city_name": "Tamandaré",
    "state": "PE",
    "center_lat": -8.7576,
    "center_lng": -35.1031,
    "radius_km": 30,
    "bias_radius_meters": 30000
  }'::jsonb,
  'Região ativa para operação da plataforma'
) ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value;

-- Criar função get_active_region
CREATE OR REPLACE FUNCTION public.get_active_region()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT setting_value FROM platform_settings WHERE setting_key = 'active_region';
$$;

-- Criar função get_service_cities
CREATE OR REPLACE FUNCTION public.get_service_cities()
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  state_name text,
  center_lat numeric,
  center_lng numeric,
  radius_km numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    c.id,
    c.name,
    c.slug,
    s.name as state_name,
    c.center_lat,
    c.center_lng,
    c.radius_km
  FROM cities c
  LEFT JOIN states s ON s.id = c.state_id
  WHERE c.is_service_area = true AND c.is_active = true
  ORDER BY c.name;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_active_region() TO public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_service_cities() TO public, authenticated, anon;