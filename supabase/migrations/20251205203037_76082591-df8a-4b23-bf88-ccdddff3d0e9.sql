-- Add public read policy for active establishments
CREATE POLICY "Anyone can view active establishments" 
ON public.establishments 
FOR SELECT 
USING (status = 'active');

-- Ensure products policy allows public viewing for active products
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);