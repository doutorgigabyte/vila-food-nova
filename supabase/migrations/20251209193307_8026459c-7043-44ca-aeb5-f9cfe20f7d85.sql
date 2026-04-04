
-- Table for driver-establishment links (multi-establishment support)
CREATE TABLE IF NOT EXISTS public.driver_establishment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.delivery_drivers(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'blocked')),
  linked_via TEXT DEFAULT 'qr_code' CHECK (linked_via IN ('qr_code', 'manual', 'invitation')),
  commission_type TEXT DEFAULT 'external' CHECK (commission_type IN ('external', 'split_pix', 'fixed', 'percentage')),
  fixed_fee NUMERIC(10,2),
  percentage_fee NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  UNIQUE(driver_id, establishment_id)
);

-- Table for delivery requests (Uber-style offers)
CREATE TABLE IF NOT EXISTS public.delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'expired', 'cancelled')),
  delivery_type TEXT DEFAULT 'standard' CHECK (delivery_type IN ('standard', 'turbo')),
  calculated_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  driver_earnings NUMERIC(10,2) NOT NULL DEFAULT 0,
  estimated_distance_km NUMERIC(8,2),
  estimated_duration_minutes INTEGER,
  stops_count INTEGER DEFAULT 1,
  pickup_address TEXT,
  delivery_address TEXT,
  customer_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_by UUID REFERENCES public.delivery_drivers(id),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add columns to establishments for driver payment config
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS driver_payment_mode TEXT DEFAULT 'external' CHECK (driver_payment_mode IN ('split', 'external')),
ADD COLUMN IF NOT EXISTS driver_default_commission_type TEXT DEFAULT 'percentage' CHECK (driver_default_commission_type IN ('fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS driver_default_fee NUMERIC(10,2) DEFAULT 0;

-- Add PIX key to delivery_drivers
ALTER TABLE public.delivery_drivers
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'phone', 'email', 'random'));

-- Function to accept delivery request with race condition protection
CREATE OR REPLACE FUNCTION public.accept_delivery_request(
  p_request_id UUID,
  p_driver_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request delivery_requests%ROWTYPE;
  v_is_linked BOOLEAN;
BEGIN
  -- Lock row for update to prevent race conditions
  SELECT * INTO v_request
  FROM delivery_requests
  WHERE id = p_request_id
  FOR UPDATE;
  
  -- Check if request exists
  IF v_request.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'request_not_found');
  END IF;
  
  -- Check if still pending
  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_accepted');
  END IF;
  
  -- Check if expired
  IF v_request.expires_at < now() THEN
    UPDATE delivery_requests SET status = 'expired' WHERE id = p_request_id;
    RETURN jsonb_build_object('success', false, 'error', 'expired');
  END IF;
  
  -- Check if driver is linked to this establishment
  SELECT EXISTS(
    SELECT 1 FROM driver_establishment_links
    WHERE driver_id = p_driver_id 
    AND establishment_id = v_request.establishment_id
    AND status = 'approved'
  ) INTO v_is_linked;
  
  IF NOT v_is_linked THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_linked');
  END IF;
  
  -- Accept the delivery
  UPDATE delivery_requests
  SET status = 'assigned',
      accepted_by = p_driver_id,
      accepted_at = now()
  WHERE id = p_request_id;
  
  -- Create delivery tracking record
  INSERT INTO delivery_tracking (
    order_id, driver_id, establishment_id, status
  ) VALUES (
    v_request.order_id, p_driver_id, v_request.establishment_id, 'assigned'
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'order_id', v_request.order_id,
    'driver_earnings', v_request.driver_earnings
  );
END;
$$;

-- Enable RLS
ALTER TABLE public.driver_establishment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_requests ENABLE ROW LEVEL SECURITY;

-- RLS for driver_establishment_links
CREATE POLICY "Drivers can view their own links"
ON public.driver_establishment_links FOR SELECT
USING (driver_id IN (SELECT id FROM delivery_drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can create link requests"
ON public.driver_establishment_links FOR INSERT
WITH CHECK (driver_id IN (SELECT id FROM delivery_drivers WHERE user_id = auth.uid()));

CREATE POLICY "Establishments can manage links"
ON public.driver_establishment_links FOR ALL
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE id = driver_establishment_links.establishment_id 
  AND owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all links"
ON public.driver_establishment_links FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- RLS for delivery_requests
CREATE POLICY "Linked drivers can view pending requests"
ON public.delivery_requests FOR SELECT
USING (
  status = 'pending' AND
  EXISTS (
    SELECT 1 FROM driver_establishment_links del
    JOIN delivery_drivers dd ON dd.id = del.driver_id
    WHERE del.establishment_id = delivery_requests.establishment_id
    AND del.status = 'approved'
    AND dd.user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can view their accepted requests"
ON public.delivery_requests FOR SELECT
USING (accepted_by IN (SELECT id FROM delivery_drivers WHERE user_id = auth.uid()));

CREATE POLICY "Establishments can manage their requests"
ON public.delivery_requests FOR ALL
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE id = delivery_requests.establishment_id 
  AND owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all requests"
ON public.delivery_requests FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Enable realtime for delivery_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_requests;
