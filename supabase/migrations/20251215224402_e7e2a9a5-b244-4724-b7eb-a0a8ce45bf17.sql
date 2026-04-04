-- Create category suggestions table for merchant category requests
CREATE TABLE public.category_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  parent_segment_id UUID REFERENCES public.segments(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  local_category_id UUID REFERENCES public.categories(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Establishments can view own suggestions"
ON public.category_suggestions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = category_suggestions.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Establishments can create suggestions"
ON public.category_suggestions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = category_suggestions.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all suggestions"
ON public.category_suggestions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Index for faster queries
CREATE INDEX idx_category_suggestions_status ON public.category_suggestions(status);
CREATE INDEX idx_category_suggestions_establishment ON public.category_suggestions(establishment_id);