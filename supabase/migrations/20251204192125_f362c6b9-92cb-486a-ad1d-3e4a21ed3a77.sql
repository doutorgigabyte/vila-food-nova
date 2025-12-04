-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'affiliate', 'establishment', 'customer');

-- Enum para status de estabelecimento
CREATE TYPE public.establishment_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- Enum para status de pedido
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled');

-- Enum para tipo de entrega
CREATE TYPE public.delivery_type AS ENUM ('delivery', 'pickup', 'table', 'other');

-- Enum para método de pagamento
CREATE TYPE public.payment_method AS ENUM ('cash', 'pix', 'credit_card', 'debit_card', 'online');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de roles de usuário (segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Tabela de planos
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  billing_period TEXT DEFAULT 'monthly',
  max_products INTEGER DEFAULT 50,
  max_orders INTEGER DEFAULT 500,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de segmentos (tipos de estabelecimento)
CREATE TABLE public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de estados
CREATE TABLE public.states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  uf CHAR(2) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cidades
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state_id UUID REFERENCES public.states(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de estabelecimentos
CREATE TABLE public.establishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  address_number TEXT,
  neighborhood TEXT,
  city_id UUID REFERENCES public.cities(id),
  zip_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  segment_id UUID REFERENCES public.segments(id),
  plan_id UUID REFERENCES public.plans(id),
  status establishment_status DEFAULT 'pending',
  is_open BOOLEAN DEFAULT false,
  primary_color TEXT DEFAULT '#FF6B35',
  secondary_color TEXT DEFAULT '#1A1A2E',
  min_order_value DECIMAL(10,2) DEFAULT 0,
  avg_delivery_time INTEGER DEFAULT 45,
  accepts_delivery BOOLEAN DEFAULT true,
  accepts_pickup BOOLEAN DEFAULT true,
  accepts_table BOOLEAN DEFAULT false,
  pix_key TEXT,
  mercado_pago_token TEXT,
  pagseguro_token TEXT,
  operating_hours JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de categorias de produtos
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  promotional_price DECIMAL(10,2),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  stock_quantity INTEGER,
  preparation_time INTEGER DEFAULT 30,
  variations JSONB DEFAULT '[]',
  additionals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de clientes (dados específicos do cliente)
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  addresses JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, establishment_id)
);

-- Tabela de pedidos
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  delivery_type delivery_type DEFAULT 'delivery',
  payment_method payment_method DEFAULT 'cash',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  delivery_address JSONB,
  table_number TEXT,
  observations TEXT,
  change_for DECIMAL(10,2),
  estimated_time INTEGER,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de cupons
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  min_order_value DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(establishment_id, code)
);

-- Tabela de taxas de entrega
CREATE TABLE public.delivery_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  neighborhood TEXT NOT NULL,
  city TEXT,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_time INTEGER,
  max_time INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT DEFAULT 'active',
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de afiliados
CREATE TABLE public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  commission_rate DECIMAL(5,2) DEFAULT 40,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de referências de afiliados
CREATE TABLE public.affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  commission_earned DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações WhatsApp/IA
CREATE TABLE public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  instance_name TEXT,
  instance_id TEXT,
  api_key TEXT,
  webhook_url TEXT,
  qr_code TEXT,
  status TEXT DEFAULT 'disconnected',
  ai_prompt TEXT,
  ai_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de sessões WhatsApp
CREATE TABLE public.whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  cart JSONB DEFAULT '[]',
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de mensagens WhatsApp
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.whatsapp_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_from_bot BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_establishments_updated_at BEFORE UPDATE ON public.establishments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Políticas RLS

-- Profiles: usuários podem ver/editar próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles: apenas admins podem gerenciar
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Plans: públicos para leitura
CREATE POLICY "Anyone can view active plans" ON public.plans FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Segments: públicos para leitura
CREATE POLICY "Anyone can view segments" ON public.segments FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage segments" ON public.segments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- States e Cities: públicos
CREATE POLICY "Anyone can view states" ON public.states FOR SELECT USING (true);
CREATE POLICY "Anyone can view cities" ON public.cities FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage states" ON public.states FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins can manage cities" ON public.cities FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Establishments: públicos para leitura, donos podem editar
CREATE POLICY "Anyone can view active establishments" ON public.establishments FOR SELECT USING (status = 'active');
CREATE POLICY "Owners can manage own establishment" ON public.establishments FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all establishments" ON public.establishments FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Categories e Products: públicos para leitura do estabelecimento ativo
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Establishment owners can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.establishments WHERE id = establishment_id AND owner_id = auth.uid())
);

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Establishment owners can manage products" ON public.products FOR ALL USING (
  EXISTS (SELECT 1 FROM public.establishments WHERE id = establishment_id AND owner_id = auth.uid())
);

-- Customers: donos do estabelecimento podem ver
CREATE POLICY "Establishments can view their customers" ON public.customers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.establishments WHERE id = establishment_id AND owner_id = auth.uid())
);
CREATE POLICY "Customers can view own data" ON public.customers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create customer" ON public.customers FOR INSERT WITH CHECK (true);

-- Orders
CREATE POLICY "Establishments can manage their orders" ON public.orders FOR ALL USING (
  EXISTS (SELECT 1 FROM public.establishments WHERE id = establishment_id AND owner_id = auth.uid())
);
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.customers WHERE id = customer_id AND user_id = auth.uid())
);
CREATE POLICY "Anyone can create order" ON public.orders FOR INSERT WITH CHECK (true);

-- Coupons
CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Establishments can manage coupons" ON public.coupons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.establishments WHERE id = establishment_id AND owner_id = auth.uid())
);

-- Delivery fees
CREATE POLICY "Anyone can view delivery fees" ON public.delivery_fees FOR SELECT USING (is_active = true);
CREATE POLICY "Establishments can manage delivery fees" ON public.delivery_fees FOR ALL USING (
  EXISTS (SELECT 1 FROM public.establishments WHERE id = establishment_id AND owner_id = auth.uid())
);

-- Subscriptions
CREATE POLICY "Establishments can view own subscriptions" ON public.subscriptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.establishments WHERE id = establishment_id AND owner_id = auth.uid())
);
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- Affiliates
CREATE POLICY "Affiliates can view own data" ON public.affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage affiliates" ON public.affiliates FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Affiliates can view own referrals" ON public.affiliate_referrals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.affiliates WHERE id = affiliate_id AND user_id = auth.uid())
);

-- WhatsApp
CREATE POLICY "Establishments can manage whatsapp instances" ON public.whatsapp_instances FOR ALL USING (
  EXISTS (SELECT 1 FROM public.establishments WHERE id = establishment_id AND owner_id = auth.uid())
);

CREATE POLICY "Establishments can manage whatsapp sessions" ON public.whatsapp_sessions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.establishments WHERE id = establishment_id AND owner_id = auth.uid())
);

CREATE POLICY "Establishments can manage whatsapp messages" ON public.whatsapp_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.whatsapp_sessions s JOIN public.establishments e ON s.establishment_id = e.id WHERE s.id = session_id AND e.owner_id = auth.uid())
);

-- Habilitar realtime para pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Inserir dados iniciais

-- Planos
INSERT INTO public.plans (name, description, price, max_products, max_orders, features) VALUES
('Grátis', 'Plano inicial para testar a plataforma', 0, 10, 50, '["Cardápio digital", "Link personalizado", "Gestão de pedidos"]'),
('Mensal', 'Plano mensal com recursos completos', 30.00, 100, 500, '["Cardápio digital", "Link personalizado", "Gestão de pedidos", "Cupons", "Relatórios", "Suporte prioritário"]'),
('Semestral', 'Economia de 15% no plano semestral', 153.00, 200, 1000, '["Cardápio digital", "Link personalizado", "Gestão de pedidos", "Cupons", "Relatórios", "Suporte prioritário", "WhatsApp IA"]'),
('Anual', 'Economia de 25% no plano anual', 270.00, 500, -1, '["Cardápio digital", "Link personalizado", "Gestão de pedidos", "Cupons", "Relatórios", "Suporte prioritário", "WhatsApp IA", "Integrações"]');

-- Segmentos
INSERT INTO public.segments (name, icon) VALUES
('Pizzaria', 'pizza'),
('Hamburgueria', 'beef'),
('Restaurante', 'utensils'),
('Lanchonete', 'sandwich'),
('Sorveteria', 'ice-cream'),
('Padaria', 'croissant'),
('Açaí', 'grape'),
('Sushi', 'fish'),
('Marmitaria', 'package'),
('Bebidas', 'cup-soda');

-- Estados brasileiros
INSERT INTO public.states (name, uf) VALUES
('Acre', 'AC'), ('Alagoas', 'AL'), ('Amapá', 'AP'), ('Amazonas', 'AM'),
('Bahia', 'BA'), ('Ceará', 'CE'), ('Distrito Federal', 'DF'), ('Espírito Santo', 'ES'),
('Goiás', 'GO'), ('Maranhão', 'MA'), ('Mato Grosso', 'MT'), ('Mato Grosso do Sul', 'MS'),
('Minas Gerais', 'MG'), ('Pará', 'PA'), ('Paraíba', 'PB'), ('Paraná', 'PR'),
('Pernambuco', 'PE'), ('Piauí', 'PI'), ('Rio de Janeiro', 'RJ'), ('Rio Grande do Norte', 'RN'),
('Rio Grande do Sul', 'RS'), ('Rondônia', 'RO'), ('Roraima', 'RR'), ('Santa Catarina', 'SC'),
('São Paulo', 'SP'), ('Sergipe', 'SE'), ('Tocantins', 'TO');