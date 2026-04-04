-- Adiciona colunas para configuração automática do N8N webhook
ALTER TABLE public.whatsapp_instances 
ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT DEFAULT 'https://n8n.vilafood.delivery/webhook/vilafood-webhook',
ADD COLUMN IF NOT EXISTS n8n_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS webhook_configured_at TIMESTAMP WITH TIME ZONE;

-- Atualiza instâncias existentes com a URL do N8N
UPDATE public.whatsapp_instances 
SET n8n_webhook_url = 'https://n8n.vilafood.delivery/webhook/vilafood-webhook',
    n8n_enabled = true
WHERE n8n_webhook_url IS NULL;

COMMENT ON COLUMN public.whatsapp_instances.n8n_webhook_url IS 'URL do webhook N8N para processamento de mensagens IA';
COMMENT ON COLUMN public.whatsapp_instances.n8n_enabled IS 'Se o processamento N8N está ativo para esta instância';
COMMENT ON COLUMN public.whatsapp_instances.webhook_configured_at IS 'Data/hora em que o webhook foi configurado automaticamente';