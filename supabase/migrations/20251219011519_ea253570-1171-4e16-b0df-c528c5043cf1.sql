-- Adicionar colunas para personalização da logomarca
ALTER TABLE public.tv_slides 
ADD COLUMN IF NOT EXISTS logo_position text DEFAULT 'center',
ADD COLUMN IF NOT EXISTS logo_shape text DEFAULT 'circle';

-- Adicionar comentários explicativos
COMMENT ON COLUMN public.tv_slides.logo_position IS 'Posição da logo: left, center, right';
COMMENT ON COLUMN public.tv_slides.logo_shape IS 'Formato da logo: circle, rounded_square';