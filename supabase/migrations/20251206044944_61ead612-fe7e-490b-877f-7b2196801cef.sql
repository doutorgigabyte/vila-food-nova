
-- Create establishment_videos table for VilaTok feature
CREATE TABLE public.establishment_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  duration INTEGER,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create video_likes table for tracking likes
CREATE TABLE public.video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.establishment_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraints for likes (one per user or session per video)
CREATE UNIQUE INDEX video_likes_user_unique ON public.video_likes(video_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX video_likes_session_unique ON public.video_likes(video_id, session_id) WHERE session_id IS NOT NULL;

-- Add max_videos column to plans table
ALTER TABLE public.plans ADD COLUMN max_videos INTEGER DEFAULT 0;

-- Enable RLS on establishment_videos
ALTER TABLE public.establishment_videos ENABLE ROW LEVEL SECURITY;

-- Anyone can view active videos
CREATE POLICY "Anyone can view active videos"
ON public.establishment_videos
FOR SELECT
USING (is_active = true);

-- Establishment owners can manage their videos
CREATE POLICY "Establishment owners can manage videos"
ON public.establishment_videos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.establishments
    WHERE establishments.id = establishment_videos.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

-- Super admins can manage all videos
CREATE POLICY "Super admins can manage all videos"
ON public.establishment_videos
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Enable RLS on video_likes
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes
CREATE POLICY "Anyone can view video likes"
ON public.video_likes
FOR SELECT
USING (true);

-- Anyone can insert likes
CREATE POLICY "Anyone can like videos"
ON public.video_likes
FOR INSERT
WITH CHECK (true);

-- Users can delete their own likes
CREATE POLICY "Users can unlike videos"
ON public.video_likes
FOR DELETE
USING (user_id = auth.uid() OR session_id IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_establishment_videos_establishment ON public.establishment_videos(establishment_id);
CREATE INDEX idx_establishment_videos_active ON public.establishment_videos(is_active) WHERE is_active = true;
CREATE INDEX idx_video_likes_video ON public.video_likes(video_id);

-- Add trigger for updated_at
CREATE TRIGGER update_establishment_videos_updated_at
BEFORE UPDATE ON public.establishment_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for videos
ALTER PUBLICATION supabase_realtime ADD TABLE public.establishment_videos;
