-- Tabela para métricas e logs do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  session_id UUID REFERENCES whatsapp_sessions(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para respostas rápidas pré-definidas
CREATE TABLE IF NOT EXISTS public.whatsapp_quick_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  trigger_words TEXT[] DEFAULT '{}',
  response_text TEXT NOT NULL,
  response_media_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_establishment ON whatsapp_analytics(establishment_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_session ON whatsapp_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_event_type ON whatsapp_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_created ON whatsapp_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_replies_establishment ON whatsapp_quick_replies(establishment_id);

-- RLS para whatsapp_analytics
ALTER TABLE public.whatsapp_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishments can manage their analytics"
ON public.whatsapp_analytics
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = whatsapp_analytics.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

-- RLS para whatsapp_quick_replies
ALTER TABLE public.whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Establishments can manage their quick replies"
ON public.whatsapp_quick_replies
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM establishments
    WHERE establishments.id = whatsapp_quick_replies.establishment_id
    AND establishments.owner_id = auth.uid()
  )
);

-- Adicionar colunas à whatsapp_instances para Evolution API
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS evolution_api_url TEXT,
ADD COLUMN IF NOT EXISTS evolution_api_key TEXT,
ADD COLUMN IF NOT EXISTS auto_response_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS audio_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pix_enabled BOOLEAN DEFAULT false;