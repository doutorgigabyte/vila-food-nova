-- Add can_manage_stores to affiliates table
ALTER TABLE public.affiliates ADD COLUMN IF NOT EXISTS can_manage_stores BOOLEAN DEFAULT false;

-- Create payment_splits table for multi-seller checkout tracking
CREATE TABLE IF NOT EXISTS public.payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_id TEXT NOT NULL UNIQUE,
  mp_payment_id TEXT,
  total_amount NUMERIC NOT NULL,
  platform_fee NUMERIC DEFAULT 0,
  platform_fee_percent NUMERIC DEFAULT 5,
  status TEXT DEFAULT 'pending',
  payment_method TEXT DEFAULT 'pix',
  payer_email TEXT,
  payer_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment_split_items table for per-establishment tracking
CREATE TABLE IF NOT EXISTS public.payment_split_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID REFERENCES public.payment_splits(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES public.establishments(id),
  order_id UUID REFERENCES public.orders(id),
  amount NUMERIC NOT NULL,
  establishment_fee NUMERIC DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  mp_transfer_id TEXT,
  transfer_status TEXT DEFAULT 'pending',
  transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_split_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_splits
CREATE POLICY "Super admins can manage all payment splits"
ON public.payment_splits FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Establishments can view their split payments"
ON public.payment_splits FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.payment_split_items psi
  JOIN public.establishments e ON e.id = psi.establishment_id
  WHERE psi.split_id = payment_splits.id AND e.owner_id = auth.uid()
));

-- RLS policies for payment_split_items
CREATE POLICY "Super admins can manage all split items"
ON public.payment_split_items FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Establishments can view their split items"
ON public.payment_split_items FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.establishments e
  WHERE e.id = payment_split_items.establishment_id AND e.owner_id = auth.uid()
));

-- Add affiliate_referrals link to affiliates for store management
ALTER TABLE public.affiliate_referrals ADD COLUMN IF NOT EXISTS can_be_managed BOOLEAN DEFAULT true;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_splits_status ON public.payment_splits(status);
CREATE INDEX IF NOT EXISTS idx_payment_splits_checkout_id ON public.payment_splits(checkout_id);
CREATE INDEX IF NOT EXISTS idx_payment_split_items_split_id ON public.payment_split_items(split_id);
CREATE INDEX IF NOT EXISTS idx_payment_split_items_establishment ON public.payment_split_items(establishment_id);

-- Trigger for updated_at
CREATE TRIGGER update_payment_splits_updated_at
BEFORE UPDATE ON public.payment_splits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();