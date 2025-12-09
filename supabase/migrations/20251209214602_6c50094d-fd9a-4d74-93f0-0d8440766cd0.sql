-- Add display columns to establishment_videos for filtering where stories appear
ALTER TABLE public.establishment_videos 
ADD COLUMN IF NOT EXISTS display_in_store boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS display_in_marketplace boolean DEFAULT true;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_establishment_videos_display_in_store 
ON public.establishment_videos(display_in_store) WHERE display_in_store = true;

CREATE INDEX IF NOT EXISTS idx_establishment_videos_display_in_marketplace 
ON public.establishment_videos(display_in_marketplace) WHERE display_in_marketplace = true;