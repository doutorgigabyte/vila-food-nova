-- Create helper function to check if user is manager of an establishment
-- This uses SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION is_establishment_manager(p_user_id uuid, p_establishment_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM establishment_users
    WHERE user_id = p_user_id 
    AND establishment_id = p_establishment_id 
    AND role = 'manager'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop problematic policies on establishment_users that cause recursion
DROP POLICY IF EXISTS "Managers can view their establishment users" ON establishment_users;
DROP POLICY IF EXISTS "Managers can insert their establishment users" ON establishment_users;
DROP POLICY IF EXISTS "Managers can update their establishment users" ON establishment_users;
DROP POLICY IF EXISTS "Managers can delete their establishment users" ON establishment_users;

-- Recreate policies using the helper function (no recursion)
CREATE POLICY "Managers can view their establishment users"
ON establishment_users FOR SELECT
USING (is_establishment_manager(auth.uid(), establishment_id));

CREATE POLICY "Managers can insert their establishment users"
ON establishment_users FOR INSERT
WITH CHECK (is_establishment_manager(auth.uid(), establishment_id));

CREATE POLICY "Managers can update their establishment users"
ON establishment_users FOR UPDATE
USING (is_establishment_manager(auth.uid(), establishment_id));

CREATE POLICY "Managers can delete their establishment users"
ON establishment_users FOR DELETE
USING (is_establishment_manager(auth.uid(), establishment_id) AND user_id != auth.uid());

-- Also fix establishments policy that references establishment_users
DROP POLICY IF EXISTS "Owners can view their establishments" ON establishments;

-- Create helper function for establishment access check
CREATE OR REPLACE FUNCTION user_has_establishment_access(p_user_id uuid, p_establishment_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM establishment_users
    WHERE user_id = p_user_id 
    AND establishment_id = p_establishment_id 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate establishments policy using helper function
CREATE POLICY "Owners can view their establishments"
ON establishments FOR SELECT
USING (
  owner_id = auth.uid() 
  OR has_role(auth.uid(), 'super_admin')
  OR user_has_establishment_access(auth.uid(), id)
);