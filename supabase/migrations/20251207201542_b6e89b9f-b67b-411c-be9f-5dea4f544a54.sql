-- Fase 6: Infraestrutura do Módulo WhatsApp

-- 1. Adicionar campos de WhatsApp na tabela plans
ALTER TABLE plans ADD COLUMN IF NOT EXISTS whatsapp_chatbot BOOLEAN DEFAULT true;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS whatsapp_ai_agent BOOLEAN DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS max_whatsapp_messages INTEGER DEFAULT 1000;

-- 2. Adicionar campos extras em whatsapp_instances
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS whatsapp_level INTEGER DEFAULT 1;
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS keywords_enabled BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS business_hours_message TEXT;
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS outside_hours_message TEXT;
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'google/gemini-2.5-flash';

-- 3. Criar tabela de palavras-chave configuráveis
CREATE TABLE IF NOT EXISTS public.whatsapp_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  response_text TEXT,
  response_link TEXT,
  send_menu_link BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Criar tabela de mensagens automáticas por evento
CREATE TABLE IF NOT EXISTS public.whatsapp_auto_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(establishment_id, event_type)
);

-- 5. Criar tabela de carrinhos temporários via WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  items JSONB DEFAULT '[]',
  subtotal NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  delivery_address JSONB,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Criar tabela de histórico de conversas
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  messages JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. RLS policies para whatsapp_keywords
ALTER TABLE whatsapp_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishments can manage their keywords" ON whatsapp_keywords
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = whatsapp_keywords.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all keywords" ON whatsapp_keywords
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 8. RLS policies para whatsapp_auto_messages
ALTER TABLE whatsapp_auto_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishments can manage their auto messages" ON whatsapp_auto_messages
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = whatsapp_auto_messages.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all auto messages" ON whatsapp_auto_messages
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 9. RLS policies para whatsapp_carts
ALTER TABLE whatsapp_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishments can manage their carts" ON whatsapp_carts
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = whatsapp_carts.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all carts" ON whatsapp_carts
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 10. RLS policies para whatsapp_conversations
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishments can manage their conversations" ON whatsapp_conversations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = whatsapp_conversations.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all conversations" ON whatsapp_conversations
FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- 11. Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_keywords_establishment ON whatsapp_keywords(establishment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_messages_establishment ON whatsapp_auto_messages(establishment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_carts_establishment ON whatsapp_carts(establishment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_carts_phone ON whatsapp_carts(customer_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_carts_status ON whatsapp_carts(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_establishment ON whatsapp_conversations(establishment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON whatsapp_conversations(customer_phone);