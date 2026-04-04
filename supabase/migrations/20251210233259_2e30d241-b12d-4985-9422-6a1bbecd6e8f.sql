-- Adicionar campo de status da IA na tabela whatsapp_chats
ALTER TABLE public.whatsapp_chats 
ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'active';

-- Criar índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_whatsapp_chats_ai_status 
ON public.whatsapp_chats(phone, establishment_id, ai_status);

COMMENT ON COLUMN public.whatsapp_chats.ai_status IS 'Status da IA: active, paused, reactivated';