-- Drop and recreate with explicit auth.uid() check
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Create policy that explicitly checks auth.uid() is not null
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Also add a policy for anon users to create orders (for guest checkout)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);