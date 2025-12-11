-- Add new fields to tv_slides table
ALTER TABLE public.tv_slides
ADD COLUMN IF NOT EXISTS media_type text DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
ADD COLUMN IF NOT EXISTS duration_seconds integer DEFAULT 10;

-- Create playlist settings table
CREATE TABLE IF NOT EXISTS public.tv_playlist_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  playback_mode text DEFAULT 'sequential' CHECK (playback_mode IN ('sequential', 'random', 'loop')),
  default_duration integer DEFAULT 10,
  transition_type text DEFAULT 'fade' CHECK (transition_type IN ('fade', 'slide', 'zoom')),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(establishment_id)
);

-- Enable RLS
ALTER TABLE public.tv_playlist_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for tv_playlist_settings
CREATE POLICY "Establishment owners can manage their playlist settings"
ON public.tv_playlist_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = tv_playlist_settings.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

CREATE POLICY "Public can view active playlist settings"
ON public.tv_playlist_settings
FOR SELECT
USING (is_active = true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tv_playlist_settings_establishment 
ON public.tv_playlist_settings(establishment_id);