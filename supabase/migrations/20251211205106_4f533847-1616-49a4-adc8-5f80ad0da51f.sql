-- Enable RLS on qr_codes table if not already enabled
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Establishment owners can view their QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Establishment owners can create QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Establishment owners can update their QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Establishment owners can delete their QR codes" ON public.qr_codes;

-- Create policy for SELECT
CREATE POLICY "Establishment owners can view their QR codes"
ON public.qr_codes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = qr_codes.establishment_id
    AND e.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Create policy for INSERT
CREATE POLICY "Establishment owners can create QR codes"
ON public.qr_codes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = establishment_id
    AND e.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Create policy for UPDATE
CREATE POLICY "Establishment owners can update their QR codes"
ON public.qr_codes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = qr_codes.establishment_id
    AND e.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Create policy for DELETE
CREATE POLICY "Establishment owners can delete their QR codes"
ON public.qr_codes
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.establishments e
    WHERE e.id = qr_codes.establishment_id
    AND e.owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);