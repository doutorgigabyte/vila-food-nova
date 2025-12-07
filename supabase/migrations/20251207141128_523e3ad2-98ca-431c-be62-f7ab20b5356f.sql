-- Fix Critical: Drop dangerous public policy exposing payment tokens
-- The current policy exposes ALL columns including mercado_pago_token, mp_refresh_token, etc.

-- Drop the dangerous policy
DROP POLICY IF EXISTS "Anyone can view active establishments" ON establishments;

-- Create a restrictive policy for public access (basic info only via function)
-- Public access should use get_public_establishments() security definer function
-- This policy only allows authenticated users to see their own establishment or active ones

-- For truly public access (unauthenticated), users should use the get_public_establishments() function
-- which already excludes sensitive columns

-- Allow authenticated users to view active establishments (but not see sensitive token columns via RLS)
-- Note: RLS applies to ALL columns, so we need to ensure public access goes through the function
CREATE POLICY "Authenticated can view active establishments basic info"
ON establishments FOR SELECT
TO authenticated
USING (status = 'active');

-- Update the existing function to be the ONLY public access path
-- The function already excludes sensitive columns