-- Add customer_name column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Add waiter_tab_id column to link orders to waiter tabs
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS waiter_tab_id UUID REFERENCES public.waiter_tabs(id);

-- Create index for faster waiter tab lookups
CREATE INDEX IF NOT EXISTS idx_orders_waiter_tab_id ON public.orders(waiter_tab_id);

-- Add comment for documentation
COMMENT ON COLUMN public.orders.customer_name IS 'Customer name for display purposes';
COMMENT ON COLUMN public.orders.waiter_tab_id IS 'Link to waiter tab for table orders';