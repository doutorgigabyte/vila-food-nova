-- Drop ALL existing INSERT policies on orders to start fresh
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can create orders" ON public.orders;

-- Create a single INSERT policy that allows any user to create orders
CREATE POLICY "Allow order creation"
ON public.orders
FOR INSERT
WITH CHECK (true);