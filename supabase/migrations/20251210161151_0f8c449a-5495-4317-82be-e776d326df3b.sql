-- =============================================
-- REESTRUTURAÇÃO DO SISTEMA DE PLANOS VILAFOOD
-- =============================================

-- 1. Primeiro remover referências aos planos antigos
UPDATE public.establishments SET plan_id = NULL;

-- 2. Agora limpar planos existentes
DELETE FROM public.plans;

-- 3. Adicionar novas colunas à tabela plans se não existirem
ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS price_monthly NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_yearly NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_stores INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS marketplace_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS marketplace_highlight BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketplace_priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chatbot_basic BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 4. Criar tabela de add-ons
CREATE TABLE IF NOT EXISTS public.plan_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Criar tabela de relacionamento establishment <-> addons
CREATE TABLE IF NOT EXISTS public.establishment_addons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES public.plan_addons(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(establishment_id, addon_id)
);

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE public.plan_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishment_addons ENABLE ROW LEVEL SECURITY;

-- 7. Políticas para plan_addons (leitura pública, gerenciamento admin)
CREATE POLICY "Anyone can view active addons" ON public.plan_addons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage addons" ON public.plan_addons
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 8. Políticas para establishment_addons
CREATE POLICY "Establishments can view their addons" ON public.establishment_addons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM establishments 
      WHERE establishments.id = establishment_addons.establishment_id 
      AND establishments.owner_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all establishment addons" ON public.establishment_addons
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 9. Inserir os 4 planos definitivos
INSERT INTO public.plans (
  name, slug, description, price, price_monthly, price_yearly, billing_period,
  max_products, max_orders, max_videos, max_users, max_stores,
  max_whatsapp_messages, whatsapp_chatbot, whatsapp_ai_agent, ai_unlimited,
  marketplace_enabled, marketplace_highlight, marketplace_priority,
  chatbot_basic, is_popular, is_active, sort_order, features
) VALUES
-- GRATUITO
(
  'Gratuito', 'gratuito', 'Ideal para começar e testar a plataforma',
  0, 0, 0, 'free',
  10, 50, 1, 1, 1,
  0, false, false, false,
  true, false, 0,
  false, false, true, 1,
  '["Cardápio digital", "Link personalizado", "Presença no marketplace", "Suporte por email", "QR Code básico"]'::jsonb
),
-- STARTER
(
  'Starter', 'starter', 'Para pequenos negócios que querem crescer',
  79.90, 79.90, 63.92, 'monthly',
  50, 300, 5, 2, 1,
  100, false, false, false,
  true, false, 1,
  false, false, true, 2,
  '["Tudo do Gratuito", "50 produtos", "300 pedidos/mês", "5 vídeos VilaTok", "2 usuários", "Cupons e promoções", "Relatórios básicos", "Suporte prioritário"]'::jsonb
),
-- PRO (Popular)
(
  'Pro', 'pro', 'Para negócios em crescimento que querem se destacar',
  149.90, 149.90, 119.92, 'monthly',
  -1, -1, 20, 5, 1,
  500, true, false, false,
  true, true, 2,
  true, true, true, 3,
  '["Tudo do Starter", "Produtos ilimitados", "Pedidos ilimitados", "20 vídeos VilaTok", "5 usuários", "Chatbot WhatsApp básico", "Destaque no marketplace", "Relatórios avançados", "Integração PDV", "Gestão de entregadores"]'::jsonb
),
-- BUSINESS
(
  'Business', 'business', 'Para redes e negócios com múltiplas lojas',
  299.90, 299.90, 239.92, 'monthly',
  -1, -1, 50, 10, 3,
  2000, true, false, true,
  true, true, 3,
  true, false, true, 4,
  '["Tudo do Pro", "Multi-loja (até 3)", "50 vídeos VilaTok", "10 usuários", "Prioridade máxima no marketplace", "API de integração", "Gerente de conta dedicado", "Treinamento personalizado"]'::jsonb
);

-- 10. Inserir add-ons
INSERT INTO public.plan_addons (name, slug, description, price_monthly, is_active) VALUES
('Agente IA Avançado', 'ai-agent-advanced', 'Chatbot inteligente com IA avançada para atendimento 24/7 no WhatsApp', 49.90, true),
('Loja Adicional', 'extra-store', 'Adicione mais uma loja ao seu plano', 39.90, true),
('Usuário Adicional', 'extra-user', 'Adicione mais um usuário ao painel', 19.90, true);

-- 11. Atribuir plano Gratuito a todos os establishments sem plano
UPDATE public.establishments 
SET plan_id = (SELECT id FROM public.plans WHERE slug = 'gratuito' LIMIT 1)
WHERE plan_id IS NULL;