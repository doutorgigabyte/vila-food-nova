-- Allow customers to create scheduled orders
CREATE POLICY "Customers can create scheduled orders"
ON public.scheduled_orders
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow customers to view their own scheduled orders by customer_id
CREATE POLICY "Customers can view own scheduled orders"
ON public.scheduled_orders
FOR SELECT
TO authenticated
USING (customer_id = auth.uid());

-- Allow public users to create scheduled orders (for checkout without login)
CREATE POLICY "Anyone can create scheduled orders"
ON public.scheduled_orders
FOR INSERT
TO anon
WITH CHECK (true);