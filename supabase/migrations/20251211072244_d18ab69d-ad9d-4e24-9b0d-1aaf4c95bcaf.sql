-- ==============================================
-- FASE 1-4: RELATÓRIOS FINANCEIROS + FIDELIDADE
-- ==============================================

-- Adicionar campo birth_date em customers (Fase 3)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS birth_date date;

-- Adicionar campo cost_price_updated_at em products (Fase 1)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price_updated_at timestamptz;

-- ==============================================
-- FASE 2: DRE - Categorias Contábeis
-- ==============================================

CREATE TABLE IF NOT EXISTS dre_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('receita', 'deducao', 'custo', 'despesa_operacional', 'despesa_financeira', 'outros')),
  group_name text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dre_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishment managers can manage DRE categories"
ON dre_categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = dre_categories.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Mapeamento de categorias para DRE
CREATE TABLE IF NOT EXISTS dre_category_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  source_table text NOT NULL,
  source_category text NOT NULL,
  dre_category_id uuid REFERENCES dre_categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dre_category_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishment managers can manage DRE mappings"
ON dre_category_mappings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = dre_category_mappings.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- ==============================================
-- FASE 4: PROGRAMA DE FIDELIDADE
-- ==============================================

-- Configuração do programa
CREATE TABLE IF NOT EXISTS loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Programa de Fidelidade',
  type text NOT NULL DEFAULT 'points' CHECK (type IN ('points', 'stamps', 'tiers')),
  points_per_real numeric DEFAULT 1,
  points_value numeric DEFAULT 0.01,
  min_redemption integer DEFAULT 100,
  expiration_days integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(establishment_id)
);

ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishment managers can manage loyalty programs"
ON loyalty_programs FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = loyalty_programs.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Anyone can view active loyalty programs"
ON loyalty_programs FOR SELECT
USING (is_active = true);

-- Saldo de pontos
CREATE TABLE IF NOT EXISTS loyalty_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  points_balance integer DEFAULT 0,
  total_earned integer DEFAULT 0,
  total_redeemed integer DEFAULT 0,
  tier text DEFAULT 'bronze',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, establishment_id)
);

ALTER TABLE loyalty_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own loyalty balance"
ON loyalty_balances FOR SELECT
USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = loyalty_balances.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Establishment managers can manage loyalty balances"
ON loyalty_balances FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = loyalty_balances.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Transações de pontos
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('earn', 'redeem', 'expire', 'bonus', 'adjustment')),
  points integer NOT NULL,
  balance_after integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own loyalty transactions"
ON loyalty_transactions FOR SELECT
USING (
  customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = loyalty_transactions.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

CREATE POLICY "Establishment managers can manage loyalty transactions"
ON loyalty_transactions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = loyalty_transactions.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Níveis do programa
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_points integer NOT NULL,
  multiplier numeric DEFAULT 1,
  benefits jsonb DEFAULT '[]',
  color text,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view loyalty tiers"
ON loyalty_tiers FOR SELECT USING (true);

CREATE POLICY "Establishment managers can manage loyalty tiers"
ON loyalty_tiers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = loyalty_tiers.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Recompensas
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  points_cost integer NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('discount_percent', 'discount_fixed', 'free_product', 'free_delivery')),
  reward_value numeric,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  stock integer,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active loyalty rewards"
ON loyalty_rewards FOR SELECT
USING (is_active = true);

CREATE POLICY "Establishment managers can manage loyalty rewards"
ON loyalty_rewards FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = loyalty_rewards.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Histórico de felicitações de aniversário
CREATE TABLE IF NOT EXISTS birthday_greetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  year integer NOT NULL,
  sent_at timestamptz DEFAULT now(),
  coupon_code text,
  message text,
  UNIQUE(customer_id, establishment_id, year)
);

ALTER TABLE birthday_greetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishment managers can manage birthday greetings"
ON birthday_greetings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishment_users
    WHERE establishment_users.establishment_id = birthday_greetings.establishment_id
    AND establishment_users.user_id = auth.uid()
    AND establishment_users.is_active = true
  )
  OR EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);