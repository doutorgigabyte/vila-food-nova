
-- Create favorites table for users to save favorite establishments and products
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT favorites_unique_establishment UNIQUE (user_id, establishment_id),
  CONSTRAINT favorites_unique_product UNIQUE (user_id, product_id),
  CONSTRAINT favorites_must_have_target CHECK (
    (establishment_id IS NOT NULL AND product_id IS NULL) OR
    (establishment_id IS NULL AND product_id IS NOT NULL)
  )
);

-- Create saved_addresses table for user delivery addresses
CREATE TABLE public.saved_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL DEFAULT 'Casa',
  street TEXT NOT NULL,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'PE',
  zip_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  formatted_address TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT saved_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorites
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on saved_addresses
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_addresses
CREATE POLICY "Users can view their own addresses"
ON public.saved_addresses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own addresses"
ON public.saved_addresses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
ON public.saved_addresses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
ON public.saved_addresses FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX idx_favorites_establishment_id ON public.favorites(establishment_id);
CREATE INDEX idx_favorites_product_id ON public.favorites(product_id);
CREATE INDEX idx_saved_addresses_user_id ON public.saved_addresses(user_id);

-- Trigger for updated_at on saved_addresses
CREATE TRIGGER update_saved_addresses_updated_at
BEFORE UPDATE ON public.saved_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for favorites
ALTER PUBLICATION supabase_realtime ADD TABLE public.favorites;
