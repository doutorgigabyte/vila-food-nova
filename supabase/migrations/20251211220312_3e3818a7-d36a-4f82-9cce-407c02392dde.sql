-- Drop existing policy
DROP POLICY IF EXISTS "Establishment users can manage their tokens" ON public.public_display_tokens;

-- Create separate policies for different operations

-- SELECT policy
CREATE POLICY "Establishment users can view their tokens"
ON public.public_display_tokens
FOR SELECT
USING (
  is_active = true
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

-- INSERT policy with WITH CHECK
CREATE POLICY "Establishment users can create tokens"
ON public.public_display_tokens
FOR INSERT
WITH CHECK (
  EXISTS (
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
  EXISTS (
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
  EXISTS (
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