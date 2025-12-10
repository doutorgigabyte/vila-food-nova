
-- 1. Add new order status values to the enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'customer_absent';

-- 2. Add tracking_enabled field to establishments (for conditional tracking)
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS tracking_enabled boolean DEFAULT true;

-- 3. Create delivery_queue table for queue position tracking
CREATE TABLE IF NOT EXISTS public.delivery_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.delivery_drivers(id) ON DELETE SET NULL,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE CASCADE NOT NULL,
  queue_position integer NOT NULL DEFAULT 1,
  estimated_pickup_at timestamp with time zone,
  estimated_delivery_at timestamp with time zone,
  actual_pickup_at timestamp with time zone,
  actual_delivery_at timestamp with time zone,
  estimated_duration_minutes integer,
  distance_km numeric,
  is_delayed boolean DEFAULT false,
  delay_notified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(order_id)
);

-- 4. Enable RLS on delivery_queue
ALTER TABLE public.delivery_queue ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for delivery_queue
CREATE POLICY "Establishments can manage their delivery queue"
ON public.delivery_queue FOR ALL
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = delivery_queue.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Drivers can view their assigned queue"
ON public.delivery_queue FOR SELECT
USING (driver_id IN (
  SELECT id FROM delivery_drivers WHERE user_id = auth.uid()
));

CREATE POLICY "Anyone can view their order queue position"
ON public.delivery_queue FOR SELECT
USING (order_id IN (
  SELECT id FROM orders WHERE customer_phone IS NOT NULL
));

CREATE POLICY "Super admins can manage all delivery queues"
ON public.delivery_queue FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 6. Create function to calculate queue positions
CREATE OR REPLACE FUNCTION public.calculate_delivery_queue_position(p_establishment_id uuid, p_driver_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  pos INTEGER := 1;
BEGIN
  FOR rec IN 
    SELECT id FROM delivery_queue 
    WHERE establishment_id = p_establishment_id 
    AND driver_id = p_driver_id 
    AND actual_delivery_at IS NULL
    ORDER BY created_at ASC
  LOOP
    UPDATE delivery_queue SET queue_position = pos, updated_at = now() WHERE id = rec.id;
    pos := pos + 1;
  END LOOP;
END;
$$;

-- 7. Create function to check and notify delays
CREATE OR REPLACE FUNCTION public.check_delivery_delays()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE delivery_queue 
  SET is_delayed = true, updated_at = now()
  WHERE actual_delivery_at IS NULL 
  AND estimated_delivery_at < now()
  AND is_delayed = false;
END;
$$;

-- 8. Add index for performance
CREATE INDEX IF NOT EXISTS idx_delivery_queue_establishment_driver 
ON public.delivery_queue(establishment_id, driver_id, actual_delivery_at);

CREATE INDEX IF NOT EXISTS idx_delivery_queue_order 
ON public.delivery_queue(order_id);

-- 9. Enable realtime for delivery_queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_queue;

-- 10. Add comment for documentation
COMMENT ON TABLE public.delivery_queue IS 'Tracks delivery order positions in queue with estimated times for multi-order deliveries';
