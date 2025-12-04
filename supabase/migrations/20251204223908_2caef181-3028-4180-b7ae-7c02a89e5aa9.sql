
-- Tabela de entregadores
CREATE TABLE public.delivery_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  vehicle_type TEXT DEFAULT 'motorcycle',
  license_plate TEXT,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de cashback
CREATE TABLE public.cashback_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE UNIQUE,
  percentage NUMERIC DEFAULT 5,
  min_order_value NUMERIC DEFAULT 0,
  max_cashback_value NUMERIC,
  expiration_days INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.cashback_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id),
  type TEXT NOT NULL CHECK (type IN ('earned', 'used', 'expired')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de carrinhos abandonados
CREATE TABLE public.abandoned_carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  recovery_attempts INTEGER DEFAULT 0,
  last_recovery_at TIMESTAMP WITH TIME ZONE,
  recovered BOOLEAN DEFAULT false,
  recovered_order_id UUID REFERENCES public.orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de pedidos agendados
CREATE TABLE public.scheduled_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  delivery_address JSONB,
  delivery_type TEXT DEFAULT 'delivery',
  payment_method TEXT DEFAULT 'pix',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de comandas (garçom)
CREATE TABLE public.waiter_tabs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  waiter_name TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  notes TEXT,
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de fornecedores
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  contact_person TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de compras de fornecedores
CREATE TABLE public.supplier_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES public.suppliers(id),
  invoice_number TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  taxes NUMERIC DEFAULT 0,
  shipping NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de movimentações de estoque
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'adjustment', 'loss', 'transfer')),
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC,
  total_cost NUMERIC,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de contas financeiras
CREATE TABLE public.financial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'cash', 'credit_card', 'other')),
  balance NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de transações financeiras avançadas
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.financial_accounts(id),
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  due_date DATE,
  paid_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'overdue')),
  recurrence TEXT CHECK (recurrence IN ('once', 'daily', 'weekly', 'monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de configuração de pixels
CREATE TABLE public.analytics_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE UNIQUE,
  facebook_pixel_id TEXT,
  google_analytics_id TEXT,
  google_ads_id TEXT,
  tiktok_pixel_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiter_tabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_pixels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for delivery_drivers
CREATE POLICY "Establishments can manage their drivers" ON public.delivery_drivers FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = delivery_drivers.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for cashback_config
CREATE POLICY "Establishments can manage their cashback config" ON public.cashback_config FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = cashback_config.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for cashback_transactions
CREATE POLICY "Establishments can view their cashback transactions" ON public.cashback_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = cashback_transactions.establishment_id AND establishments.owner_id = auth.uid()));
CREATE POLICY "Customers can view their cashback" ON public.cashback_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM customers WHERE customers.id = cashback_transactions.customer_id AND customers.user_id = auth.uid()));

-- RLS Policies for abandoned_carts
CREATE POLICY "Establishments can manage abandoned carts" ON public.abandoned_carts FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = abandoned_carts.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for scheduled_orders
CREATE POLICY "Establishments can manage scheduled orders" ON public.scheduled_orders FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = scheduled_orders.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for waiter_tabs
CREATE POLICY "Establishments can manage waiter tabs" ON public.waiter_tabs FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = waiter_tabs.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for suppliers
CREATE POLICY "Establishments can manage their suppliers" ON public.suppliers FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = suppliers.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for supplier_purchases
CREATE POLICY "Establishments can manage their purchases" ON public.supplier_purchases FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = supplier_purchases.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for inventory_movements
CREATE POLICY "Establishments can manage inventory" ON public.inventory_movements FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = inventory_movements.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for financial_accounts
CREATE POLICY "Establishments can manage their accounts" ON public.financial_accounts FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = financial_accounts.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for financial_transactions
CREATE POLICY "Establishments can manage their transactions" ON public.financial_transactions FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = financial_transactions.establishment_id AND establishments.owner_id = auth.uid()));

-- RLS Policies for analytics_pixels
CREATE POLICY "Establishments can manage their pixels" ON public.analytics_pixels FOR ALL USING (EXISTS (SELECT 1 FROM establishments WHERE establishments.id = analytics_pixels.establishment_id AND establishments.owner_id = auth.uid()));

-- Add stock fields to products if not exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_price NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_stock INTEGER;

-- Triggers for updated_at
CREATE TRIGGER update_delivery_drivers_updated_at BEFORE UPDATE ON public.delivery_drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_abandoned_carts_updated_at BEFORE UPDATE ON public.abandoned_carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_analytics_pixels_updated_at BEFORE UPDATE ON public.analytics_pixels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
