-- SISTEMA DE DÍVIDA - Modelo Financeiro Blindado
-- Registra comissões devidas quando pagamento é na entrega (dinheiro/maquininha)

-- Tabela para rastrear dívidas de comissão dos estabelecimentos
CREATE TABLE IF NOT EXISTS public.establishment_commission_debt (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- Valores da dívida
  products_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_order NUMERIC(10,2) NOT NULL DEFAULT 0,
  
  -- Comissão devida à plataforma
  platform_product_fee NUMERIC(10,2) NOT NULL DEFAULT 0, -- 5% dos produtos
  platform_service_fee NUMERIC(10,2) NOT NULL DEFAULT 1, -- R$1 taxa de serviço
  total_commission_due NUMERIC(10,2) NOT NULL DEFAULT 0, -- Total a pagar para plataforma
  
  -- Status da dívida
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'deducted', 'cancelled')),
  payment_method TEXT, -- Como foi pago: 'online_deduction', 'pix', 'boleto', 'manual'
  
  -- Datas
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Referência de pagamento
  payment_reference TEXT,
  notes TEXT,
  
  -- Constraint única
  CONSTRAINT unique_order_debt UNIQUE (order_id)
);

-- Índices
CREATE INDEX idx_commission_debt_establishment ON public.establishment_commission_debt(establishment_id);
CREATE INDEX idx_commission_debt_status ON public.establishment_commission_debt(status);
CREATE INDEX idx_commission_debt_created ON public.establishment_commission_debt(created_at DESC);

-- RLS
ALTER TABLE public.establishment_commission_debt ENABLE ROW LEVEL SECURITY;

-- Lojistas veem apenas suas próprias dívidas
CREATE POLICY "Establishments view own debt"
  ON public.establishment_commission_debt
  FOR SELECT
  USING (
    establishment_id IN (
      SELECT eu.establishment_id FROM public.establishment_users eu
      WHERE eu.user_id = auth.uid() AND eu.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

-- Apenas sistema pode inserir/atualizar (via service role)
CREATE POLICY "System manages debt"
  ON public.establishment_commission_debt
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

-- View para resumo de dívidas por estabelecimento
CREATE OR REPLACE VIEW public.establishment_debt_summary AS
SELECT 
  establishment_id,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COALESCE(SUM(total_commission_due) FILTER (WHERE status = 'pending'), 0) as pending_amount,
  COUNT(*) FILTER (WHERE status = 'paid' OR status = 'deducted') as paid_count,
  COALESCE(SUM(total_commission_due) FILTER (WHERE status = 'paid' OR status = 'deducted'), 0) as paid_amount,
  COALESCE(SUM(total_commission_due), 0) as total_amount
FROM public.establishment_commission_debt
GROUP BY establishment_id;

-- Adicionar coluna na orders para marcar se gerou dívida
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_debt_created BOOLEAN DEFAULT false;

COMMENT ON TABLE public.establishment_commission_debt IS 'Registra comissões devidas quando pagamento é na entrega (Modelo Blindado)';
COMMENT ON VIEW public.establishment_debt_summary IS 'Resumo de dívidas de comissão por estabelecimento';