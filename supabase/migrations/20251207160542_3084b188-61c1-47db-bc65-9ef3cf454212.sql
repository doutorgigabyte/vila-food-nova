-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can like videos" ON public.video_likes;
DROP POLICY IF EXISTS "Anyone can view video likes" ON public.video_likes;
DROP POLICY IF EXISTS "Users can unlike videos" ON public.video_likes;
DROP POLICY IF EXISTS "Authenticated users can like videos" ON public.video_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.video_likes;

-- Create correct RLS policies for video_likes
CREATE POLICY "Anyone can view video likes" 
ON public.video_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can like videos" 
ON public.video_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.video_likes 
FOR DELETE 
USING (auth.uid() = user_id);