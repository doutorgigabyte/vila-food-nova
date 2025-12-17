-- Add custom SEO fields to establishments table
-- These fields allow each store to have personalized SEO metadata

-- Note: meta_title, meta_description, meta_image already exist in establishments table
-- Just ensuring they are documented and understood for SEO purposes

COMMENT ON COLUMN establishments.meta_title IS 'Custom SEO title for social sharing (og:title). Falls back to name if null.';
COMMENT ON COLUMN establishments.meta_description IS 'Custom SEO description for social sharing (og:description). Falls back to description if null.';
COMMENT ON COLUMN establishments.meta_image IS 'Custom SEO image URL for social sharing (og:image). Falls back to banner_url or logo_url if null.';