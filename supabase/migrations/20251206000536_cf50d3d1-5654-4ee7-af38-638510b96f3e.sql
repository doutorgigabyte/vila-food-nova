
-- Criar tabela para armazenar credenciais de teste/sandbox do Mercado Pago
CREATE TABLE IF NOT EXISTS public.payment_sandbox_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('integrator', 'buyer', 'seller')),
  user_id TEXT NOT NULL,
  username TEXT,
  country TEXT DEFAULT 'BR',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_sandbox_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Super admins can manage sandbox accounts
CREATE POLICY "Super admins can manage sandbox accounts"
ON public.payment_sandbox_accounts
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

-- Insert Mercado Pago sandbox accounts
INSERT INTO public.payment_sandbox_accounts (name, account_type, user_id, username, description) VALUES
('Marketplace VilaFood', 'integrator', '3043493573', 'TESTUSER1910', 'Conta integradora principal do marketplace'),
('Cliente com fome', 'buyer', '3044195102', 'TESTUSER1590', 'Conta de teste para comprador'),
('Lojista', 'seller', '3044195106', 'TESTUSER6128', 'Conta de teste para vendedor/estabelecimento'),
('Admin', 'seller', '3044195104', 'TESTUSER5481', 'Conta de administrador vendedor');
