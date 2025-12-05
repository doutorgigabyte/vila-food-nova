-- Fix permissive customer INSERT policy
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
DROP POLICY IF EXISTS "Service role can create customers" ON public.customers;

-- Create proper INSERT policy: users can only create their own customer record
CREATE POLICY "Users can create their own customer record"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

-- Allow establishments to create customer records for their customers (e.g., from orders)
CREATE POLICY "Establishment owners can create customers for their establishment"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (
  establishment_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = customers.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);