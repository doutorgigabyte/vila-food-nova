
-- Create a security definer function to insert orders
-- This bypasses RLS issues completely
CREATE OR REPLACE FUNCTION public.create_order(
  p_establishment_id uuid,
  p_customer_id uuid DEFAULT NULL,
  p_delivery_type text DEFAULT 'delivery',
  p_payment_method text DEFAULT 'pix',
  p_items jsonb DEFAULT '[]'::jsonb,
  p_subtotal numeric DEFAULT 0,
  p_delivery_fee numeric DEFAULT 0,
  p_discount numeric DEFAULT 0,
  p_platform_fee numeric DEFAULT 0,
  p_order_source text DEFAULT 'web',
  p_total numeric DEFAULT 0,
  p_delivery_address jsonb DEFAULT NULL,
  p_change_for numeric DEFAULT NULL,
  p_observations text DEFAULT NULL,
  p_table_number text DEFAULT NULL,
  p_scheduled_for timestamptz DEFAULT NULL,
  p_whatsapp_tracking_enabled boolean DEFAULT false,
  p_customer_phone text DEFAULT NULL,
  p_cpf text DEFAULT NULL,
  p_out_of_stock_action text DEFAULT 'contact_me'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
BEGIN
  INSERT INTO public.orders (
    establishment_id,
    customer_id,
    delivery_type,
    payment_method,
    items,
    subtotal,
    delivery_fee,
    discount,
    platform_fee,
    order_source,
    total,
    delivery_address,
    change_for,
    observations,
    table_number,
    scheduled_for,
    whatsapp_tracking_enabled,
    customer_phone,
    cpf,
    out_of_stock_action,
    status
  ) VALUES (
    p_establishment_id,
    p_customer_id,
    p_delivery_type,
    p_payment_method,
    p_items,
    p_subtotal,
    p_delivery_fee,
    p_discount,
    p_platform_fee,
    p_order_source,
    p_total,
    p_delivery_address,
    p_change_for,
    p_observations,
    p_table_number,
    p_scheduled_for,
    p_whatsapp_tracking_enabled,
    p_customer_phone,
    p_cpf,
    p_out_of_stock_action,
    'pending'
  )
  RETURNING * INTO v_order;
  
  RETURN jsonb_build_object(
    'success', true,
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.create_order TO anon;
GRANT EXECUTE ON FUNCTION public.create_order TO authenticated;
