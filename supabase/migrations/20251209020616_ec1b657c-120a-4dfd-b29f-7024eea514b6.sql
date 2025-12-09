-- Drop existing policies on whatsapp_instances if any
DROP POLICY IF EXISTS "Users can view own establishment instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can insert own establishment instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can update own establishment instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete own establishment instances" ON public.whatsapp_instances;
DROP POLICY IF EXISTS "Super admin full access to whatsapp_instances" ON public.whatsapp_instances;

-- Enable RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Policy for establishment owners to view their instances
CREATE POLICY "Users can view own establishment instances"
ON public.whatsapp_instances
FOR SELECT
USING (
  establishment_id IN (
    SELECT id FROM public.establishments 
    WHERE owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Policy for establishment owners to insert instances
CREATE POLICY "Users can insert own establishment instances"
ON public.whatsapp_instances
FOR INSERT
WITH CHECK (
  establishment_id IN (
    SELECT id FROM public.establishments 
    WHERE owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Policy for establishment owners to update their instances
CREATE POLICY "Users can update own establishment instances"
ON public.whatsapp_instances
FOR UPDATE
USING (
  establishment_id IN (
    SELECT id FROM public.establishments 
    WHERE owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Policy for establishment owners to delete their instances
CREATE POLICY "Users can delete own establishment instances"
ON public.whatsapp_instances
FOR DELETE
USING (
  establishment_id IN (
    SELECT id FROM public.establishments 
    WHERE owner_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'super_admin')
);