-- Add RLS policy for public access to active establishments
CREATE POLICY "Anyone can view active establishments" 
ON public.establishments 
FOR SELECT 
USING (status = 'active');