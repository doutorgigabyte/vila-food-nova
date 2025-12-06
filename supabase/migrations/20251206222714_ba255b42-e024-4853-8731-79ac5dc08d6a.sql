-- First add user_id to delivery_drivers
ALTER TABLE public.delivery_drivers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create delivery tracking table for real-time driver location and status
CREATE TABLE public.delivery_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.delivery_drivers(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'problem')),
  current_lat NUMERIC,
  current_lng NUMERIC,
  pickup_lat NUMERIC,
  pickup_lng NUMERIC,
  delivery_lat NUMERIC,
  delivery_lng NUMERIC,
  accepted_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  distance_km NUMERIC,
  estimated_minutes INTEGER,
  route_polyline TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add driver role to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'driver' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'driver';
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_tracking
CREATE POLICY "Drivers can view their own deliveries"
ON public.delivery_tracking
FOR SELECT
USING (
  driver_id IN (
    SELECT id FROM public.delivery_drivers 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Drivers can update their own deliveries"
ON public.delivery_tracking
FOR UPDATE
USING (
  driver_id IN (
    SELECT id FROM public.delivery_drivers 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Establishments can view their deliveries"
ON public.delivery_tracking
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.establishments
    WHERE id = delivery_tracking.establishment_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Establishments can manage their deliveries"
ON public.delivery_tracking
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.establishments
    WHERE id = delivery_tracking.establishment_id
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all deliveries"
ON public.delivery_tracking
FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- Enable realtime for delivery_tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tracking;

-- Create trigger for updated_at
CREATE TRIGGER update_delivery_tracking_updated_at
BEFORE UPDATE ON public.delivery_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_delivery_tracking_driver_id ON public.delivery_tracking(driver_id);
CREATE INDEX idx_delivery_tracking_order_id ON public.delivery_tracking(order_id);
CREATE INDEX idx_delivery_tracking_status ON public.delivery_tracking(status);