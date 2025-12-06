-- Add Point terminal fields to establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS point_terminal_id TEXT,
ADD COLUMN IF NOT EXISTS point_device_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.establishments.point_terminal_id IS 'Mercado Pago Point terminal device ID';
COMMENT ON COLUMN public.establishments.point_device_name IS 'Mercado Pago Point terminal device name';