-- Adicionar campo para música nos vídeos
ALTER TABLE establishment_videos 
ADD COLUMN IF NOT EXISTS music_url TEXT;

-- Adicionar coluna main_category_id para filtrar vídeos por categoria
ALTER TABLE establishment_videos
ADD COLUMN IF NOT EXISTS main_category_id UUID REFERENCES main_categories(id);