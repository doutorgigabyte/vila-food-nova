
-- Add SEO meta fields to establishments
ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS meta_title text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS meta_image text;

-- Add comment for documentation
COMMENT ON COLUMN public.establishments.meta_title IS 'Custom SEO title for establishment page';
COMMENT ON COLUMN public.establishments.meta_description IS 'Custom SEO description for establishment page';
COMMENT ON COLUMN public.establishments.meta_image IS 'Custom SEO og:image URL for establishment page';
