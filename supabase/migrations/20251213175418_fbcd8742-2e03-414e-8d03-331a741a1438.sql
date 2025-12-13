
-- Drop the current policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create policy explicitly for anon and authenticated roles
CREATE POLICY "Anyone can create orders" 
ON public.orders 
AS PERMISSIVE
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also ensure service_role can insert (for edge functions)
CREATE POLICY "Service role can create orders" 
ON public.orders 
AS PERMISSIVE
FOR INSERT 
TO service_role
WITH CHECK (true);
