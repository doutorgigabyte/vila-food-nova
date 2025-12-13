-- Drop existing problematic policy
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create simple policy that allows anyone to insert orders
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);