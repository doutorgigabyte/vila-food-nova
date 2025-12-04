
-- Atualizar enum app_role para incluir novos roles de estabelecimento
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cashier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'attendant';

-- Tabela para vincular usuários a estabelecimentos com roles específicos
CREATE TABLE public.establishment_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'attendant' CHECK (role IN ('manager', 'cashier', 'attendant')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, establishment_id)
);

-- Tabela de audit logs para registrar todas as ações
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para registrar acessos de admin a painéis de estabelecimentos
CREATE TABLE public.admin_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  action TEXT NOT NULL DEFAULT 'access',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.establishment_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para establishment_users
CREATE POLICY "Super admins can manage all establishment users"
  ON public.establishment_users FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Establishment owners can manage their users"
  ON public.establishment_users FOR ALL
  USING (EXISTS (
    SELECT 1 FROM establishments 
    WHERE establishments.id = establishment_users.establishment_id 
    AND establishments.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view their own establishment access"
  ON public.establishment_users FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies para audit_logs
CREATE POLICY "Super admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Establishment owners can view logs of their establishment"
  ON public.audit_logs FOR SELECT
  USING (
    entity_type = 'establishment' AND
    EXISTS (
      SELECT 1 FROM establishments 
      WHERE establishments.id = audit_logs.entity_id 
      AND establishments.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone authenticated can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies para admin_access_logs
CREATE POLICY "Super admins can manage access logs"
  ON public.admin_access_logs FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Establishment owners can view access logs"
  ON public.admin_access_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM establishments 
    WHERE establishments.id = admin_access_logs.establishment_id 
    AND establishments.owner_id = auth.uid()
  ));

-- Indexes para performance
CREATE INDEX idx_establishment_users_user ON public.establishment_users(user_id);
CREATE INDEX idx_establishment_users_establishment ON public.establishment_users(establishment_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_admin_access_logs_admin ON public.admin_access_logs(admin_user_id);
CREATE INDEX idx_admin_access_logs_establishment ON public.admin_access_logs(establishment_id);

-- Trigger para updated_at
CREATE TRIGGER update_establishment_users_updated_at
  BEFORE UPDATE ON public.establishment_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
