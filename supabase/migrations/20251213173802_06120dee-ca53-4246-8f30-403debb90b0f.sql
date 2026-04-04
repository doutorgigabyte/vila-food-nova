-- Drop and recreate the policy with explicit roles
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create policy explicitly for all roles including anon
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);