-- Drop existing policy
DROP POLICY IF EXISTS "Establishment owners can manage categories" ON categories;

-- Create new policy that includes establishment users (team members)
CREATE POLICY "Establishment members can manage categories" 
ON categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM establishments e
    WHERE e.id = categories.establishment_id 
    AND (
      e.owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM establishment_users eu
        WHERE eu.establishment_id = e.id 
        AND eu.user_id = auth.uid() 
        AND eu.is_active = true
      )
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM establishments e
    WHERE e.id = categories.establishment_id 
    AND (
      e.owner_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM establishment_users eu
        WHERE eu.establishment_id = e.id 
        AND eu.user_id = auth.uid() 
        AND eu.is_active = true
      )
    )
  )
);