-- Tabela para sessões de chat WhatsApp
CREATE TABLE public.whatsapp_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id),
  nome_wpp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX idx_whatsapp_chats_phone_establishment 
ON public.whatsapp_chats(phone, establishment_id);

-- Tabela para histórico de mensagens
CREATE TABLE public.whatsapp_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id),
  user_message TEXT,
  bot_message TEXT,
  message_type TEXT DEFAULT 'text',
  nome_wpp TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para buscas rápidas
CREATE INDEX idx_whatsapp_chat_messages_phone ON public.whatsapp_chat_messages(phone);
CREATE INDEX idx_whatsapp_chat_messages_establishment ON public.whatsapp_chat_messages(establishment_id);

-- RLS
ALTER TABLE public.whatsapp_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_chats
CREATE POLICY "Establishments can manage their chats"
ON public.whatsapp_chats FOR ALL
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = whatsapp_chats.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all chats"
ON public.whatsapp_chats FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Service role can manage chats"
ON public.whatsapp_chats FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas para whatsapp_chat_messages
CREATE POLICY "Establishments can view their messages"
ON public.whatsapp_chat_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM establishments 
  WHERE establishments.id = whatsapp_chat_messages.establishment_id 
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all messages"
ON public.whatsapp_chat_messages FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Service role can manage messages"
ON public.whatsapp_chat_messages FOR ALL
USING (true)
WITH CHECK (true);