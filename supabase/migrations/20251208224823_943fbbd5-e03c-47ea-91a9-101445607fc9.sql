-- Adicionar campos para integração n8n multi-lojista
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS whatsapp_instance_name TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS evolution_api_token TEXT,
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Adicionar índice para busca rápida por instance_name
CREATE INDEX IF NOT EXISTS idx_establishments_whatsapp_instance 
ON public.establishments(whatsapp_instance_name) 
WHERE whatsapp_instance_name IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.establishments.whatsapp_instance_name IS 'Nome único da instância na Evolution API (ex: pizzaria_do_joao)';
COMMENT ON COLUMN public.establishments.evolution_api_token IS 'Token de autenticação da instância na Evolution API';
COMMENT ON COLUMN public.establishments.gemini_api_key IS 'Chave API Gemini opcional por estabelecimento (usa Lovable AI se null)';
COMMENT ON COLUMN public.establishments.system_prompt IS 'Prompt de sistema para IA (ex: Você é o garçom da Pizzaria X...)';
COMMENT ON COLUMN public.establishments.menu_json IS 'Cardápio em JSON para IA com id, nome, preco, img_url';