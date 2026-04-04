-- Drop the existing function first since we're changing return type
DROP FUNCTION IF EXISTS public.get_user_orders();

-- Recreate with new return type including has_review and review_token
CREATE OR REPLACE FUNCTION public.get_user_orders()
RETURNS TABLE (
  id uuid,
  order_number integer,
  establishment_id uuid,
  customer_id uuid,
  status text,
  delivery_type text,
  payment_method text,
  items jsonb,
  subtotal numeric,
  delivery_fee numeric,
  discount numeric,
  total numeric,
  delivery_address jsonb,
  table_number text,
  observations text,
  created_at timestamp with time zone,
  estimated_time integer,
  establishment_name text,
  establishment_slug text,
  establishment_logo_url text,
  has_review boolean,
  review_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_id_found uuid;
BEGIN
  -- Get customer id for authenticated user
  SELECT c.id INTO customer_id_found
  FROM public.customers c
  WHERE c.user_id = auth.uid()
  LIMIT 1;
  
  IF customer_id_found IS NULL THEN
    RETURN;
  END IF;
  
  -- Return all orders for this customer with establishment info and review status
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.establishment_id,
    o.customer_id,
    o.status::text,
    o.delivery_type::text,
    o.payment_method::text,
    o.items,
    o.subtotal,
    o.delivery_fee,
    o.discount,
    o.total,
    o.delivery_address,
    o.table_number,
    o.observations,
    o.created_at,
    o.estimated_time,
    e.name as establishment_name,
    e.slug as establishment_slug,
    e.logo_url as establishment_logo_url,
    EXISTS(SELECT 1 FROM public.reviews r WHERE r.order_id = o.id) as has_review,
    o.review_token
  FROM public.orders o
  LEFT JOIN public.establishments e ON e.id = o.establishment_id
  WHERE o.customer_id = customer_id_found
  ORDER BY o.created_at DESC;
END;
$$;