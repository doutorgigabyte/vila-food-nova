-- Create table for waiter tab history/changelog
CREATE TABLE public.waiter_tab_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tab_id UUID NOT NULL REFERENCES public.waiter_tabs(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'item_added', 'item_removed', 'item_updated', 'sent_to_kitchen', 'tab_closed', 'discount_applied'
  details JSONB DEFAULT '{}'::jsonb,
  user_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast lookups by tab
CREATE INDEX idx_waiter_tab_history_tab_id ON public.waiter_tab_history(tab_id);
CREATE INDEX idx_waiter_tab_history_establishment ON public.waiter_tab_history(establishment_id);

-- Enable RLS
ALTER TABLE public.waiter_tab_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Establishment members can view their tab history"
ON public.waiter_tab_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM establishment_users eu 
    WHERE eu.establishment_id = waiter_tab_history.establishment_id 
    AND eu.user_id = auth.uid() 
    AND eu.is_active = true
  )
  OR 
  EXISTS (
    SELECT 1 FROM establishments e 
    WHERE e.id = waiter_tab_history.establishment_id 
    AND e.owner_id = auth.uid()
  )
);

CREATE POLICY "Establishment members can insert tab history"
ON public.waiter_tab_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM establishment_users eu 
    WHERE eu.establishment_id = waiter_tab_history.establishment_id 
    AND eu.user_id = auth.uid() 
    AND eu.is_active = true
  )
  OR 
  EXISTS (
    SELECT 1 FROM establishments e 
    WHERE e.id = waiter_tab_history.establishment_id 
    AND e.owner_id = auth.uid()
  )
);