-- Function to search products by name, description or category
CREATE OR REPLACE FUNCTION public.search_products(
  p_establishment_id UUID,
  p_search_term TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC,
  promotional_price NUMERIC,
  image_url TEXT,
  category_name TEXT,
  is_available BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.promotional_price,
    p.image_url,
    COALESCE(c.name, 'Outros')::TEXT as category_name,
    p.is_active as is_available
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE 
    p.establishment_id = p_establishment_id
    AND p.is_active = true
    AND (
      p.name ILIKE '%' || p_search_term || '%'
      OR p.description ILIKE '%' || p_search_term || '%'
      OR c.name ILIKE '%' || p_search_term || '%'
    )
  ORDER BY 
    CASE WHEN p.name ILIKE p_search_term || '%' THEN 0 ELSE 1 END,
    p.name
  LIMIT 10;
END;
$$;