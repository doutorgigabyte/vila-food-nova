-- Add product type expansion columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_category text DEFAULT 'physical',
ADD COLUMN IF NOT EXISTS service_duration integer,
ADD COLUMN IF NOT EXISTS service_location text,
ADD COLUMN IF NOT EXISTS requires_booking boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS booking_advance_days integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS digital_delivery_url text,
ADD COLUMN IF NOT EXISTS digital_instructions text,
ADD COLUMN IF NOT EXISTS expiration_days integer,
ADD COLUMN IF NOT EXISTS requires_refrigeration boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS storage_temperature text;

-- Add comment for documentation
COMMENT ON COLUMN public.products.product_category IS 'physical, digital, perishable, service';
COMMENT ON COLUMN public.products.service_duration IS 'Duration in minutes for service type products';
COMMENT ON COLUMN public.products.service_location IS 'customer_location, store, remote, hybrid';
COMMENT ON COLUMN public.products.requires_booking IS 'Whether service requires advance booking';
COMMENT ON COLUMN public.products.booking_advance_days IS 'Minimum days in advance for booking';
COMMENT ON COLUMN public.products.digital_delivery_url IS 'URL for digital product delivery';
COMMENT ON COLUMN public.products.digital_instructions IS 'Instructions for accessing digital product';
COMMENT ON COLUMN public.products.expiration_days IS 'Shelf life in days for perishable products';
COMMENT ON COLUMN public.products.requires_refrigeration IS 'Whether product needs refrigeration';
COMMENT ON COLUMN public.products.storage_temperature IS 'Recommended storage temperature';