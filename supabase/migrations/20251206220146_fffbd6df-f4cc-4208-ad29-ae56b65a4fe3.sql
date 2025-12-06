-- Create video_comments table for micro social network feature
CREATE TABLE public.video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.establishment_videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_video_comments_video_id ON public.video_comments(video_id);
CREATE INDEX idx_video_comments_parent_id ON public.video_comments(parent_id);
CREATE INDEX idx_video_comments_user_id ON public.video_comments(user_id);

-- Enable RLS
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-hidden comments
CREATE POLICY "Anyone can view non-hidden comments"
ON public.video_comments
FOR SELECT
USING (is_hidden = false);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
ON public.video_comments
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR session_id IS NOT NULL);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.video_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Establishment owners can manage comments on their videos
CREATE POLICY "Establishment owners can manage video comments"
ON public.video_comments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishment_videos ev
    JOIN establishments e ON e.id = ev.establishment_id
    WHERE ev.id = video_comments.video_id
    AND e.owner_id = auth.uid()
  )
);

-- Super admins can manage all comments
CREATE POLICY "Super admins can manage all comments"
ON public.video_comments
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add comments_count to establishment_videos
ALTER TABLE public.establishment_videos 
ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;

-- Create trigger to update updated_at
CREATE TRIGGER update_video_comments_updated_at
BEFORE UPDATE ON public.video_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();