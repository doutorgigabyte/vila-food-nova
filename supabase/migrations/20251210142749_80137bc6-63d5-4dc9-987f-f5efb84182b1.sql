-- Tabela de conversas de suporte
CREATE TABLE public.support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  customer_id UUID,
  customer_phone TEXT,
  customer_name TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'waiting_customer', 'waiting_establishment', 'resolved', 'cancelled')),
  subject TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de mensagens do suporte
CREATE TABLE public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'establishment', 'system', 'bot')),
  sender_id UUID,
  sender_name TEXT,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'bot_suggestion')),
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de respostas automáticas do chatbot
CREATE TABLE public.chatbot_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
  trigger_keywords TEXT[] NOT NULL,
  response_text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de templates de FAQ global
CREATE TABLE public.faq_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_support_conversations_establishment ON public.support_conversations(establishment_id);
CREATE INDEX idx_support_conversations_order ON public.support_conversations(order_id);
CREATE INDEX idx_support_conversations_status ON public.support_conversations(status);
CREATE INDEX idx_support_messages_conversation ON public.support_messages(conversation_id);
CREATE INDEX idx_support_messages_created ON public.support_messages(created_at DESC);

-- RLS para support_conversations
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own conversations" ON public.support_conversations
  FOR SELECT USING (customer_id = auth.uid() OR customer_phone IN (
    SELECT phone FROM public.customers WHERE user_id = auth.uid()
  ));

CREATE POLICY "Customers can create conversations" ON public.support_conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Establishments can view their conversations" ON public.support_conversations
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.establishments 
    WHERE id = support_conversations.establishment_id 
    AND owner_id = auth.uid()
  ));

CREATE POLICY "Establishments can update their conversations" ON public.support_conversations
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.establishments 
    WHERE id = support_conversations.establishment_id 
    AND owner_id = auth.uid()
  ));

CREATE POLICY "Super admins can manage all conversations" ON public.support_conversations
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS para support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversations" ON public.support_messages
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.support_conversations sc
    WHERE sc.id = support_messages.conversation_id
    AND (sc.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.establishments e WHERE e.id = sc.establishment_id AND e.owner_id = auth.uid()
    ))
  ));

CREATE POLICY "Users can send messages to their conversations" ON public.support_messages
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_conversations sc
    WHERE sc.id = support_messages.conversation_id
    AND (sc.customer_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.establishments e WHERE e.id = sc.establishment_id AND e.owner_id = auth.uid()
    ))
  ));

CREATE POLICY "Super admins can manage all messages" ON public.support_messages
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS para chatbot_responses
ALTER TABLE public.chatbot_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active chatbot responses" ON public.chatbot_responses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Establishments can manage their chatbot" ON public.chatbot_responses
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.establishments WHERE id = chatbot_responses.establishment_id AND owner_id = auth.uid()
  ) OR establishment_id IS NULL);

CREATE POLICY "Super admins can manage all chatbot responses" ON public.chatbot_responses
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS para faq_templates
ALTER TABLE public.faq_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active FAQs" ON public.faq_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage FAQs" ON public.faq_templates
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger para atualizar last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_conversations
  SET last_message_at = NEW.created_at,
      updated_at = now(),
      status = CASE 
        WHEN NEW.sender_type = 'customer' THEN 'waiting_establishment'
        WHEN NEW.sender_type = 'establishment' THEN 'waiting_customer'
        ELSE status
      END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Habilitar realtime para mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_conversations;