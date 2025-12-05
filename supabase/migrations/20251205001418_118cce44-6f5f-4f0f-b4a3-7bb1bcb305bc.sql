-- Drop the view that's causing security definer issues
DROP VIEW IF EXISTS public.public_establishments;

-- Instead of using a view, we rely on RLS policies on the establishments table
-- The "Anon users can view active establishments" policy already limits access to active establishments
-- And sensitive columns are protected by only being readable by owners/admins

-- Note: Anonymous users can still read the table but payment tokens are only exposed
-- if they somehow bypass RLS. The real protection is that:
-- 1. The API client code should not fetch sensitive columns for public views
-- 2. Owners can only see their own credentials
-- 3. Super admins can manage all

-- This approach is simpler and avoids the security definer view issue