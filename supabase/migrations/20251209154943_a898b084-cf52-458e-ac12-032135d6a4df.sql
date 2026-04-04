-- Drop conflicting policies
DROP POLICY IF EXISTS "Anonymous users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Create proper INSERT policy for all users (both anonymous and authenticated)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Make sure the existing policies have proper WITH CHECK for ALL commands
DROP POLICY IF EXISTS "Establishments can manage their orders" ON public.orders;
CREATE POLICY "Establishments can manage their orders"
ON public.orders
FOR ALL
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