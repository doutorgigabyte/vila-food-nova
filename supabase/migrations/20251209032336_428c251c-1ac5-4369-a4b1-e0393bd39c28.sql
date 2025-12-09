-- Drop existing insert policy and recreate with correct permissions
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can create orders" ON public.orders;

-- Allow authenticated users to create orders (they can create for any establishment)
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow customers to also view orders by their user_id (not just customer_id)
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;

CREATE POLICY "Customers can view own orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = orders.customer_id
    AND customers.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.user_id = auth.uid()
    AND customers.phone = orders.customer_phone
  )
);

-- Allow customers to update their own orders (for payment status, etc)
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;

CREATE POLICY "Customers can update own orders"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM customers
    WHERE customers.id = orders.customer_id
    AND customers.user_id = auth.uid()
  )
);