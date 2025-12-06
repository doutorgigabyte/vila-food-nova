-- Create AI profile analyses table
CREATE TABLE public.ai_profile_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  overall_score INTEGER DEFAULT 0,
  description_score INTEGER DEFAULT 0,
  photos_score INTEGER DEFAULT 0,
  banner_score INTEGER DEFAULT 0,
  logo_score INTEGER DEFAULT 0,
  products_analyzed INTEGER DEFAULT 0,
  suggestions JSONB DEFAULT '[]'::jsonb,
  improvements_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI credits table
CREATE TABLE public.ai_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE UNIQUE,
  credits_balance INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI transactions table
CREATE TABLE public.ai_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  credits_used INTEGER DEFAULT 0,
  price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'completed',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add ai_unlimited to plans table
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS ai_unlimited BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.ai_profile_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_profile_analyses
CREATE POLICY "Establishments can view their analyses"
ON public.ai_profile_analyses
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = ai_profile_analyses.establishment_id
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all analyses"
ON public.ai_profile_analyses
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for ai_credits
CREATE POLICY "Establishments can view their credits"
ON public.ai_credits
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = ai_credits.establishment_id
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all credits"
ON public.ai_credits
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for ai_transactions
CREATE POLICY "Establishments can view their transactions"
ON public.ai_transactions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = ai_transactions.establishment_id
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all transactions"
ON public.ai_transactions
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Update master plan to have ai_unlimited
UPDATE public.plans SET ai_unlimited = true WHERE name ILIKE '%anual%' OR name ILIKE '%master%' OR name ILIKE '%premium%';