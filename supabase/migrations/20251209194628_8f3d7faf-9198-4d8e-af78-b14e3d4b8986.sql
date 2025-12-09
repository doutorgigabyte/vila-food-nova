-- Tabela para contatos do sistema (micro CRM)
CREATE TABLE IF NOT EXISTS public.system_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'owner', -- owner, manager, attendant
  is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  opted_in_broadcasts BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(phone, establishment_id)
);

-- Tabela para campanhas/disparos em massa
CREATE TABLE IF NOT EXISTS public.broadcast_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT, -- image, video, document
  target_tags TEXT[] DEFAULT '{}', -- filtrar por tags
  target_all BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft', -- draft, scheduled, sending, completed, failed
  scheduled_for TIMESTAMPTZ,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Tabela para log de mensagens enviadas
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.system_contacts(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, delivered, read, failed
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para templates de mensagens do sistema
CREATE TABLE IF NOT EXISTS public.system_message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL, -- auth, notification, alert, marketing
  message TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}', -- {{name}}, {{code}}, {{store_name}}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir templates padrão
INSERT INTO public.system_message_templates (name, category, message, variables) VALUES
  ('auth_code', 'auth', '🔐 *VilaFood* - Seu código de verificação é: *{{code}}*

Este código expira em 5 minutos.
Não compartilhe este código com ninguém.', ARRAY['code']),
  ('welcome_store', 'notification', '🎉 Bem-vindo ao *VilaFood*, {{store_name}}!

Sua loja foi cadastrada com sucesso. Acesse o painel para configurar seus produtos e começar a vender.

📱 Painel: {{panel_url}}', ARRAY['store_name', 'panel_url']),
  ('order_alert', 'alert', '🔔 *{{store_name}}* - Novo pedido!

Pedido #{{order_number}}
Total: R$ {{total}}

Acesse o painel para gerenciar.', ARRAY['store_name', 'order_number', 'total']),
  ('payment_pending', 'alert', '⚠️ *VilaFood* - Atenção {{store_name}}!

Você tem um pagamento pendente de R$ {{amount}}.
Regularize para manter sua loja ativa.

📱 Acesse: {{payment_url}}', ARRAY['store_name', 'amount', 'payment_url']),
  ('maintenance', 'notification', '🔧 *VilaFood* - Manutenção Programada

Olá {{name}}, informamos que haverá manutenção no sistema:

📅 Data: {{date}}
⏰ Horário: {{time}}
⏱️ Duração estimada: {{duration}}

Agradecemos a compreensão!', ARRAY['name', 'date', 'time', 'duration']),
  ('new_feature', 'marketing', '🚀 *Novidade no VilaFood!*

Olá {{name}}, temos uma novidade para você:

{{feature_description}}

Acesse o painel e confira! 📱', ARRAY['name', 'feature_description'])
ON CONFLICT (name) DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.system_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_message_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Super admins podem gerenciar tudo
CREATE POLICY "Super admins can manage system_contacts" ON public.system_contacts
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage broadcast_campaigns" ON public.broadcast_campaigns
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage broadcast_messages" ON public.broadcast_messages
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Super admins can manage system_message_templates" ON public.system_message_templates
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Função trigger para auto-cadastrar contato quando estabelecimento é criado
CREATE OR REPLACE FUNCTION auto_register_system_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir contato do owner no sistema
  IF NEW.phone IS NOT NULL THEN
    INSERT INTO public.system_contacts (
      establishment_id,
      name,
      phone,
      email,
      role,
      tags
    ) VALUES (
      NEW.id,
      NEW.name,
      NEW.phone,
      NEW.email,
      'owner',
      ARRAY['lojista', 'novo']
    )
    ON CONFLICT (phone, establishment_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-cadastrar
DROP TRIGGER IF EXISTS trigger_auto_register_contact ON public.establishments;
CREATE TRIGGER trigger_auto_register_contact
  AFTER INSERT ON public.establishments
  FOR EACH ROW
  EXECUTE FUNCTION auto_register_system_contact();

-- Habilitar realtime para campanhas
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.broadcast_messages;