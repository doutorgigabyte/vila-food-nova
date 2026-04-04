
-- =====================================================
-- FASE 1: MÓDULO DE ACOMPANHAMENTO DE PEDIDOS VIA WHATSAPP
-- =====================================================

-- 1.1 Adicionar campos de tracking em orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS whatsapp_tracking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS review_token TEXT,
ADD COLUMN IF NOT EXISTS review_token_expires_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- FASE 2: MÓDULO DE AVALIAÇÕES
-- =====================================================

-- 2.1 Criar tabela de avaliações
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Ratings (1-5 stars)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  food_rating INTEGER CHECK (food_rating >= 1 AND food_rating <= 5),
  delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
  service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
  
  -- Content
  comment TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  
  -- Owner response
  owner_response TEXT,
  owner_response_at TIMESTAMP WITH TIME ZONE,
  
  -- Moderation
  is_visible BOOLEAN DEFAULT true,
  is_verified_purchase BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- One review per order
  CONSTRAINT unique_order_review UNIQUE(order_id)
);

-- 2.2 Adicionar campos de rating em establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS rating_average NUMERIC(2,1) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- 2.3 Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_reviews_establishment ON public.reviews(establishment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON public.reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_tracking ON public.orders(whatsapp_tracking_enabled) WHERE whatsapp_tracking_enabled = true;

-- =====================================================
-- FASE 3: FUNÇÕES E TRIGGERS
-- =====================================================

-- 3.1 Função para atualizar média de avaliações do estabelecimento
CREATE OR REPLACE FUNCTION public.update_establishment_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.establishments
  SET 
    rating_average = (
      SELECT COALESCE(ROUND(AVG(overall_rating)::numeric, 1), 0)
      FROM public.reviews
      WHERE establishment_id = COALESCE(NEW.establishment_id, OLD.establishment_id)
      AND is_visible = true
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE establishment_id = COALESCE(NEW.establishment_id, OLD.establishment_id)
      AND is_visible = true
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.establishment_id, OLD.establishment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3.2 Trigger para atualizar rating automaticamente
DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_establishment_rating();

-- 3.3 Função para atualizar updated_at em reviews
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_reviews_timestamp ON public.reviews;
CREATE TRIGGER update_reviews_timestamp
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_reviews_updated_at();

-- =====================================================
-- FASE 4: RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible reviews
CREATE POLICY "Anyone can view visible reviews"
ON public.reviews FOR SELECT
USING (is_visible = true);

-- Users can create reviews for their orders
CREATE POLICY "Users can create reviews for their orders"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR user_id IS NULL
);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Establishment owners can respond to reviews
CREATE POLICY "Establishment owners can respond to reviews"
ON public.reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = reviews.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

-- Super admins can manage all reviews
CREATE POLICY "Super admins can manage all reviews"
ON public.reviews FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- =====================================================
-- FASE 5: ADICIONAR NOVOS EVENTOS DE AUTO-MENSAGEM
-- =====================================================

-- Inserir templates padrão de mensagens de pedido se não existirem
INSERT INTO public.whatsapp_auto_messages (establishment_id, event_type, message_template, is_active)
SELECT e.id, 'order_confirmed', 
'✅ *Pedido #{{order_number}} confirmado!*

Olá {{customer_name}}! Seu pedido foi aceito e será preparado em breve.

⏱️ Tempo estimado: {{estimated_time}} minutos

Aguarde as próximas atualizações! 📲', true
FROM establishments e
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_auto_messages wam 
  WHERE wam.establishment_id = e.id AND wam.event_type = 'order_confirmed'
);

INSERT INTO public.whatsapp_auto_messages (establishment_id, event_type, message_template, is_active)
SELECT e.id, 'order_preparing', 
'👨‍🍳 *Pedido #{{order_number}} em preparo!*

Seu pedido já está sendo preparado com todo carinho! 🍽️

⏱️ Previsão: {{estimated_time}} minutos', true
FROM establishments e
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_auto_messages wam 
  WHERE wam.establishment_id = e.id AND wam.event_type = 'order_preparing'
);

INSERT INTO public.whatsapp_auto_messages (establishment_id, event_type, message_template, is_active)
SELECT e.id, 'order_ready', 
'✅ *Pedido #{{order_number}} pronto!*

{{#if is_delivery}}
Seu pedido está pronto e aguardando o entregador! 🛵
{{else}}
Seu pedido está pronto para retirada no balcão! 🏪
{{/if}}', true
FROM establishments e
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_auto_messages wam 
  WHERE wam.establishment_id = e.id AND wam.event_type = 'order_ready'
);

INSERT INTO public.whatsapp_auto_messages (establishment_id, event_type, message_template, is_active)
SELECT e.id, 'order_out_for_delivery', 
'🛵 *Pedido #{{order_number}} saiu para entrega!*

Nosso entregador está a caminho do seu endereço!

📍 Endereço: {{delivery_address}}
⏱️ Previsão: {{estimated_time}} minutos', true
FROM establishments e
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_auto_messages wam 
  WHERE wam.establishment_id = e.id AND wam.event_type = 'order_out_for_delivery'
);

INSERT INTO public.whatsapp_auto_messages (establishment_id, event_type, message_template, is_active)
SELECT e.id, 'order_delivered', 
'🎉 *Pedido #{{order_number}} entregue!*

Obrigado por pedir na *{{establishment_name}}*! 

Esperamos que você tenha gostado! 😋

⭐ *Avalie seu pedido:*
{{rating_link}}

Sua opinião é muito importante para nós! 💚', true
FROM establishments e
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_auto_messages wam 
  WHERE wam.establishment_id = e.id AND wam.event_type = 'order_delivered'
);

INSERT INTO public.whatsapp_auto_messages (establishment_id, event_type, message_template, is_active)
SELECT e.id, 'order_cancelled', 
'❌ *Pedido #{{order_number}} cancelado*

Infelizmente seu pedido foi cancelado.

{{#if cancellation_reason}}
📝 Motivo: {{cancellation_reason}}
{{/if}}

Se precisar de ajuda, entre em contato conosco.', true
FROM establishments e
WHERE NOT EXISTS (
  SELECT 1 FROM whatsapp_auto_messages wam 
  WHERE wam.establishment_id = e.id AND wam.event_type = 'order_cancelled'
);
