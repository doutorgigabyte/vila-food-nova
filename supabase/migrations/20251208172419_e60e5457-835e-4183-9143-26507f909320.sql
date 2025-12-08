-- Add scheduled_for column to orders table for scheduled orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for better query performance on scheduled orders
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for ON public.orders(scheduled_for) WHERE scheduled_for IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.orders.scheduled_for IS 'When the order should be prepared/delivered. NULL means immediate order.';