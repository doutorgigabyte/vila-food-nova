-- Fix function search path warnings - recreate functions with proper search_path

CREATE OR REPLACE FUNCTION public.generate_menu_json(est_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_establishment_menu_json()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.establishments 
  SET 
    menu_json = public.generate_menu_json(COALESCE(NEW.establishment_id, OLD.establishment_id)),
    menu_json_updated_at = now()
  WHERE id = COALESCE(NEW.establishment_id, OLD.establishment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_establishment_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  UPDATE public.establishments
  SET 
    rating_average = (
      SELECT COALESCE(ROUND(AVG(overall_rating)::numeric, 1), 0)
      FROM public.reviews
      WHERE establishment_id = COALESCE(NEW.establishment_id, OLD.establishment_id)
      AND is_visible = true
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE establishment_id = COALESCE(NEW.establishment_id, OLD.establishment_id)
      AND is_visible = true
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.establishment_id, OLD.establishment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_register_system_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.phone IS NOT NULL THEN
    INSERT INTO public.system_contacts (
      establishment_id,
      name,
      phone,
      email,
      role,
      tags
    ) VALUES (
      NEW.id,
      NEW.name,
      NEW.phone,
      NEW.email,
      'owner',
      ARRAY['lojista', 'novo']
    )
    ON CONFLICT (phone, establishment_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;