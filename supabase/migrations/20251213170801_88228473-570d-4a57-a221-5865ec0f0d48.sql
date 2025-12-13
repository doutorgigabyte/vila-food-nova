-- Add delivery_mode to delivery_zones table
ALTER TABLE delivery_zones 
ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'standard' 
CHECK (delivery_mode IN ('free', 'minimum', 'standard', 'turbo'));

-- Add delivery configuration fields to establishments table
ALTER TABLE establishments
ADD COLUMN IF NOT EXISTS free_delivery_radius_km NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_delivery_fee NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS minimum_delivery_radius_km NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS turbo_fee NUMERIC DEFAULT 15,
ADD COLUMN IF NOT EXISTS turbo_radius_km NUMERIC DEFAULT 15,
ADD COLUMN IF NOT EXISTS delivery_calculation_mode TEXT DEFAULT 'distance'
CHECK (delivery_calculation_mode IN ('distance', 'fixed', 'zone'));

-- Add turbo time estimates
ALTER TABLE delivery_zones
ADD COLUMN IF NOT EXISTS turbo_min_time INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS turbo_max_time INTEGER DEFAULT 20;

-- Update delivery_zones to support the new system
COMMENT ON COLUMN delivery_zones.delivery_mode IS 'Zone type: free (no charge), minimum (min fee applies), standard (calculated), turbo (express with higher fee)';
COMMENT ON COLUMN establishments.delivery_calculation_mode IS 'How delivery fee is calculated: distance (base + per km), fixed (flat rate), zone (by region/polygon)';