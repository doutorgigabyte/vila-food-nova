-- Allow anyone (including anonymous users) to view active establishments
DROP POLICY IF EXISTS "Authenticated can view active establishments basic info" ON establishments;

CREATE POLICY "Anyone can view active establishments"
ON establishments
FOR SELECT
USING (status = 'active'::establishment_status);