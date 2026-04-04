-- Corrigir search_path nas funções criadas
CREATE OR REPLACE FUNCTION public.generate_menu_json(est_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'description', COALESCE(p.description, ''),
      'price', COALESCE(p.promotional_price, p.price),
      'original_price', p.price,
      'image_url', p.image_url,
      'category', COALESCE(c.name, 'Outros'),
      'is_available', p.is_active
    )
  )
  INTO result
  FROM public.products p
  LEFT JOIN public.categories c ON c.id = p.category_id
  WHERE p.establishment_id = est_id AND p.is_active = true
  ORDER BY c.sort_order, p.name;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_establishment_menu_json()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.establishments 
  SET 
    menu_json = public.generate_menu_json(COALESCE(NEW.establishment_id, OLD.establishment_id)),
    menu_json_updated_at = now()
  WHERE id = COALESCE(NEW.establishment_id, OLD.establishment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;