-- Create tv_slides table for VilaTok TV horizontal slide system
CREATE TABLE public.tv_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  title text,
  subtitle text,
  image_url text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  template_type text NOT NULL DEFAULT 'minimal',
  badge_text text,
  secondary_images jsonb DEFAULT '[]'::jsonb,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tv_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active slides via token" 
ON public.tv_slides 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Establishment owners can manage their slides" 
ON public.tv_slides 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = tv_slides.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all slides" 
ON public.tv_slides 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'));

-- Index for performance
CREATE INDEX idx_tv_slides_establishment ON public.tv_slides(establishment_id);
CREATE INDEX idx_tv_slides_active ON public.tv_slides(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_tv_slides_updated_at
BEFORE UPDATE ON public.tv_slides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.tv_slides IS 'VilaTok TV horizontal slides for TV displays';
COMMENT ON COLUMN public.tv_slides.template_type IS 'Template type: minimal, product_showcase, promo, full_image, blob_modern, polaroid, diamond, diagonal, menu_grid, special_day, catering, circles';
COMMENT ON COLUMN public.tv_slides.badge_text IS 'Optional badge text like 30% OFF, Menu Especial';
COMMENT ON COLUMN public.tv_slides.secondary_images IS 'Array of additional image URLs for multi-photo templates';