-- Add payment confirmation columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_confirmed_by UUID REFERENCES auth.users(id);

-- Create index for faster queries on payment confirmation
CREATE INDEX IF NOT EXISTS idx_orders_payment_confirmed ON public.orders(payment_confirmed_at) WHERE payment_confirmed_at IS NOT NULL;