-- Function to get establishment config by WhatsApp instance name
-- Used by N8N to fetch establishment data when receiving messages
CREATE OR REPLACE FUNCTION public.get_establishment_by_instance(p_instance_name text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  description text,
  logo_url text,
  banner_url text,
  phone text,
  whatsapp text,
  address text,
  neighborhood text,
  city_id uuid,
  latitude numeric,
  longitude numeric,
  is_open boolean,
  accepts_delivery boolean,
  accepts_pickup boolean,
  min_order_value numeric,
  delivery_base_fee numeric,
  system_prompt text,
  menu_json jsonb,
  instance_name text,
  instance_ai_prompt text,
  ai_enabled boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    e.id,
    e.name,
    e.slug,
    e.description,
    e.logo_url,
    e.banner_url,
    e.phone,
    e.whatsapp,
    e.address,
    e.neighborhood,
    e.city_id,
    e.latitude,
    e.longitude,
    e.is_open,
    e.accepts_delivery,
    e.accepts_pickup,
    e.min_order_value,
    e.delivery_base_fee,
    e.system_prompt,
    e.menu_json,
    wi.instance_name,
    wi.ai_prompt as instance_ai_prompt,
    wi.ai_enabled
  FROM establishments e
  INNER JOIN whatsapp_instances wi ON wi.establishment_id = e.id
  WHERE wi.instance_name = p_instance_name
  AND wi.status = 'connected'
  LIMIT 1;
$$;