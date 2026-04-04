
-- Completely reset the insert policy for orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create using USING clause style that PostgREST definitely understands
CREATE POLICY "Anyone can create orders" 
ON public.orders 
AS PERMISSIVE
FOR INSERT 
TO public
WITH CHECK (true);

-- Also grant explicit INSERT on orders to anon and authenticated
GRANT INSERT ON public.orders TO anon;
GRANT INSERT ON public.orders TO authenticated;

-- Ensure sequence is accessible
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
