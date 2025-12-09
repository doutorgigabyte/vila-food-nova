-- Tabela para memória de conversação do n8n (Postgres Chat Memory)
CREATE TABLE IF NOT EXISTS public.n8n_chat_histories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  message JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca rápida por sessão
CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_session ON public.n8n_chat_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_n8n_chat_histories_created ON public.n8n_chat_histories(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- Policy para service role (n8n usa service role)
CREATE POLICY "Service role can manage chat histories"
ON public.n8n_chat_histories
FOR ALL
USING (true)
WITH CHECK (true);

-- Adicionar campos na tabela whatsapp_sessions para Human Takeover
ALTER TABLE public.whatsapp_sessions 
ADD COLUMN IF NOT EXISTS ai_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS paused_by TEXT,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pause_reason TEXT;

-- Adicionar campo para tracking de agente em whatsapp_messages
ALTER TABLE public.whatsapp_messages
ADD COLUMN IF NOT EXISTS agent_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS processed_content TEXT,
ADD COLUMN IF NOT EXISTS media_analyzed BOOLEAN DEFAULT false;

-- Tabela para logs de ações do agente
CREATE TABLE IF NOT EXISTS public.agent_action_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  establishment_id UUID REFERENCES public.establishments(id),
  action_type TEXT NOT NULL,
  action_data JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT '{}'::jsonb,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_agent_action_logs_session ON public.agent_action_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_action_logs_establishment ON public.agent_action_logs(establishment_id);
CREATE INDEX IF NOT EXISTS idx_agent_action_logs_created ON public.agent_action_logs(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.agent_action_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Establishments can view their agent logs"
ON public.agent_action_logs
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = agent_action_logs.establishment_id
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Service role can manage agent logs"
ON public.agent_action_logs
FOR ALL
USING (true)
WITH CHECK (true);