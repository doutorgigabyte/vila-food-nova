-- Drop existing policy and recreate with proper INSERT/UPDATE/DELETE support
DROP POLICY IF EXISTS "Establishment owners can manage delivery zones" ON public.delivery_zones;

-- Create separate policies for each operation

-- SELECT: Anyone can view active zones
-- (already exists: "Anyone can view active delivery zones")

-- INSERT: Owners and super admins can insert
CREATE POLICY "Owners and admins can insert delivery zones" 
ON public.delivery_zones 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM establishments 
    WHERE id = establishment_id 
    AND owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- UPDATE: Owners and super admins can update
CREATE POLICY "Owners and admins can update delivery zones" 
ON public.delivery_zones 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM establishments 
    WHERE id = establishment_id 
    AND owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- DELETE: Owners and super admins can delete
CREATE POLICY "Owners and admins can delete delivery zones" 
ON public.delivery_zones 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM establishments 
    WHERE id = establishment_id 
    AND owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);