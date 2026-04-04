-- Add delivery batch configuration columns to establishments table
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS max_batch_orders INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS turbo_delivery_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS turbo_delivery_fee NUMERIC(10,2) DEFAULT 12.49;