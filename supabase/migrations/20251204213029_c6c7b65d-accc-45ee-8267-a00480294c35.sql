-- Add service area and geolocation columns to establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS service_area JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_delivery_radius_km NUMERIC DEFAULT 10,
ADD COLUMN IF NOT EXISTS delivery_base_fee NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS delivery_fee_per_km NUMERIC DEFAULT 1.5;

-- Create delivery_zones table for detailed zone management
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'polygon', -- polygon, radius, neighborhood
  coordinates JSONB DEFAULT '[]'::jsonb, -- For polygon type
  radius_km NUMERIC DEFAULT NULL, -- For radius type
  neighborhoods TEXT[] DEFAULT '{}', -- For neighborhood type
  zip_codes TEXT[] DEFAULT '{}', -- CEPs covered
  fee NUMERIC NOT NULL DEFAULT 0,
  min_time INTEGER DEFAULT 20,
  max_time INTEGER DEFAULT 45,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on delivery_zones
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- RLS policies for delivery_zones
CREATE POLICY "Anyone can view active delivery zones"
ON public.delivery_zones
FOR SELECT
USING (is_active = true);

CREATE POLICY "Establishment owners can manage delivery zones"
ON public.delivery_zones
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = delivery_zones.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_delivery_zones_establishment ON public.delivery_zones(establishment_id);
CREATE INDEX IF NOT EXISTS idx_establishments_location ON public.establishments(latitude, longitude);