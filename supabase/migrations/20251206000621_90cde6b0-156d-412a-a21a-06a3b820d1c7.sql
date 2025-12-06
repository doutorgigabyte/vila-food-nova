
-- Adicionar coluna type na tabela whatsapp_instances se não existir
ALTER TABLE public.whatsapp_instances ADD COLUMN IF NOT EXISTS instance_type TEXT DEFAULT 'establishment' CHECK (instance_type IN ('system', 'establishment'));

-- Adicionar coluna description se não existir
ALTER TABLE public.whatsapp_instances ADD COLUMN IF NOT EXISTS description TEXT;

-- Adicionar coluna phone_number se não existir
ALTER TABLE public.whatsapp_instances ADD COLUMN IF NOT EXISTS phone_number TEXT;
