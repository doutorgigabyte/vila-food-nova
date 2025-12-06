-- Drop existing policy
DROP POLICY IF EXISTS "Establishment owners can manage products" ON public.products;

-- Create new policy that allows both establishment owners AND super admins
CREATE POLICY "Establishment owners and admins can manage products" 
ON public.products 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = products.establishment_id 
    AND establishments.owner_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = products.establishment_id 
    AND establishments.owner_id = auth.uid()
  )
  OR has_role(auth.uid(), 'super_admin'::app_role)
);