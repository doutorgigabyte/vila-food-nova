
-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create a new INSERT policy that works for both authenticated and anonymous users
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
TO public, authenticated, anon
WITH CHECK (true);
