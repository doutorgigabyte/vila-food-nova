
-- Tornar establishment_id nullable para permitir instâncias do sistema
ALTER TABLE public.whatsapp_instances ALTER COLUMN establishment_id DROP NOT NULL;
