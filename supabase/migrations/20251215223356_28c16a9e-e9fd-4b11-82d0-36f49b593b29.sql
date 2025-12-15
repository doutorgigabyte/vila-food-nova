-- Fix generate_menu_json function - ORDER BY must be inside subquery
CREATE OR REPLACE FUNCTION public.generate_menu_json(est_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', subq.id,
      'name', subq.name,
      'description', subq.description,
      'price', subq.price,
      'original_price', subq.original_price,
      'image_url', subq.image_url,
      'category', subq.category,
      'is_available', subq.is_available
    )
  )
  INTO result
  FROM (
    SELECT 
      p.id,
      p.name,
      COALESCE(p.description, '') as description,
      COALESCE(p.promotional_price, p.price) as price,
      p.price as original_price,
      p.image_url,
      COALESCE(c.name, 'Outros') as category,
      p.is_active as is_available,
      COALESCE(c.sort_order, 999) as cat_sort_order
    FROM public.products p
    LEFT JOIN public.categories c ON c.id = p.category_id
    WHERE p.establishment_id = est_id AND p.is_active = true
    ORDER BY cat_sort_order, p.name
  ) subq;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$;