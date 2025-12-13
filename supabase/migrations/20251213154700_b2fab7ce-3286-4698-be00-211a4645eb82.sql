-- Adicionar coluna version_phase na tabela roadmap_items
ALTER TABLE public.roadmap_items 
ADD COLUMN IF NOT EXISTS version_phase text DEFAULT 'legacy';

-- Adicionar coluna tester_assigned para identificar testador responsável
ALTER TABLE public.roadmap_items 
ADD COLUMN IF NOT EXISTS tester_assigned text;

-- Criar índice para melhor performance nas queries por fase
CREATE INDEX IF NOT EXISTS idx_roadmap_items_version_phase ON public.roadmap_items(version_phase);

-- Atualizar todos os itens existentes para 'legacy' (já concluídos antes do novo sistema de versões)
UPDATE public.roadmap_items SET version_phase = 'legacy' WHERE version_phase IS NULL;