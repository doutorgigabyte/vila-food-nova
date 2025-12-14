-- Fix function search_path issue - recreate get_public_reviews with correct columns
CREATE OR REPLACE FUNCTION public.get_public_reviews(p_establishment_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  customer_id uuid,
  overall_rating integer,
  food_rating integer,
  service_rating integer,
  delivery_rating integer,
  comment text,
  selected_tags jsonb,
  photos jsonb,
  created_at timestamp with time zone,
  owner_response text,
  owner_response_at timestamp with time zone,
  is_verified_purchase boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    r.id,
    r.customer_id,
    r.overall_rating,
    r.food_rating,
    r.service_rating,
    r.delivery_rating,
    r.comment,
    r.selected_tags,
    r.photos,
    r.created_at,
    r.owner_response,
    r.owner_response_at,
    r.is_verified_purchase
  FROM public.reviews r
  WHERE r.establishment_id = p_establishment_id
    AND r.is_visible = true
  ORDER BY r.created_at DESC
  LIMIT p_limit;
$$;

-- Grant execute to public roles
GRANT EXECUTE ON FUNCTION public.get_public_reviews(uuid, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_reviews(uuid, integer) TO authenticated;