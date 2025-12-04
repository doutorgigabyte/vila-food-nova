-- Adicionar colunas necessárias para integração completa com Mercado Pago
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS mp_user_id TEXT,
ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS mp_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS mp_public_key TEXT;

-- Tabela para armazenar transações do Mercado Pago
CREATE TABLE IF NOT EXISTS public.mp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES establishments(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'sale', 'payout', 'refund')),
  mp_payment_id TEXT,
  mp_preapproval_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC NOT NULL DEFAULT 0,
  platform_fee NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  payer_email TEXT,
  payer_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para planos de assinatura
CREATE TABLE IF NOT EXISTS public.mp_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
  mp_preapproval_plan_id TEXT UNIQUE,
  reason TEXT NOT NULL,
  frequency INTEGER DEFAULT 1,
  frequency_type TEXT DEFAULT 'months',
  transaction_amount NUMERIC NOT NULL,
  currency_id TEXT DEFAULT 'BRL',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para pagamentos de afiliados
CREATE TABLE IF NOT EXISTS public.affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES affiliate_referrals(id),
  amount NUMERIC NOT NULL,
  pix_key TEXT NOT NULL,
  mp_payment_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mp_transactions_establishment ON mp_transactions(establishment_id);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_type ON mp_transactions(type);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_status ON mp_transactions(status);
CREATE INDEX IF NOT EXISTS idx_mp_transactions_mp_payment_id ON mp_transactions(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_affiliate ON affiliate_payouts(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- RLS para mp_transactions
ALTER TABLE public.mp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishments can view their transactions"
ON public.mp_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = mp_transactions.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all transactions"
ON public.mp_transactions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS para mp_subscription_plans
ALTER TABLE public.mp_subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.mp_subscription_plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage plans"
ON public.mp_subscription_plans FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS para affiliate_payouts
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their payouts"
ON public.affiliate_payouts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM affiliates
    WHERE affiliates.id = affiliate_payouts.affiliate_id
    AND affiliates.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage payouts"
ON public.affiliate_payouts FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));