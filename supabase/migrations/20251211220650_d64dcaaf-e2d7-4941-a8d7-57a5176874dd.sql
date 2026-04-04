-- Drop existing INSERT policy and recreate with super_admin support
DROP POLICY IF EXISTS "Establishment users can create tokens" ON public.public_display_tokens;

CREATE POLICY "Establishment users can create tokens"
ON public.public_display_tokens
FOR INSERT
WITH CHECK (
  -- Super admin can create for any establishment
  has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = public_display_tokens.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = public_display_tokens.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

-- Also update other policies to include super_admin
DROP POLICY IF EXISTS "Establishment users can view their tokens" ON public.public_display_tokens;
DROP POLICY IF EXISTS "Establishment users can update their tokens" ON public.public_display_tokens;
DROP POLICY IF EXISTS "Establishment users can delete their tokens" ON public.public_display_tokens;
DROP POLICY IF EXISTS "Anyone can view active tokens by token value" ON public.public_display_tokens;

-- SELECT policy (public for active tokens, full access for owners/admins)
CREATE POLICY "Anyone can view active tokens"
ON public.public_display_tokens
FOR SELECT
USING (
  is_active = true
  OR has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = public_display_tokens.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = public_display_tokens.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

-- UPDATE policy
CREATE POLICY "Establishment users can update their tokens"
ON public.public_display_tokens
FOR UPDATE
USING (
  has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = public_display_tokens.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = public_display_tokens.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

-- DELETE policy
CREATE POLICY "Establishment users can delete their tokens"
ON public.public_display_tokens
FOR DELETE
USING (
  has_role(auth.uid(), 'super_admin')
  OR EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = public_display_tokens.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = public_display_tokens.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);