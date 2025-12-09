-- Drop all existing order policies to start fresh
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Establishments can manage their orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can view their orders" ON public.orders;
DROP POLICY IF EXISTS "Super admins can manage all orders" ON public.orders;

-- 1. INSERT policy - Anyone can create orders (public checkout)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- 2. SELECT policy - Establishments can view their orders
CREATE POLICY "Establishments can view their orders"
ON public.orders
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = orders.establishment_id
  AND establishments.owner_id = auth.uid()
));

-- 3. SELECT policy - Customers can view their own orders
CREATE POLICY "Customers can view their orders"
ON public.orders
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM customers
  WHERE customers.id = orders.customer_id
  AND customers.user_id = auth.uid()
));

-- 4. UPDATE policy - Establishments can update their orders
CREATE POLICY "Establishments can update their orders"
ON public.orders
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = orders.establishment_id
  AND establishments.owner_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = orders.establishment_id
  AND establishments.owner_id = auth.uid()
));

-- 5. DELETE policy - Establishments can delete their orders
CREATE POLICY "Establishments can delete their orders"
ON public.orders
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = orders.establishment_id
  AND establishments.owner_id = auth.uid()
));

-- 6. Super admins full access (separate policies for each operation)
CREATE POLICY "Super admins can view all orders"
ON public.orders
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all orders"
ON public.orders
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete all orders"
ON public.orders
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));