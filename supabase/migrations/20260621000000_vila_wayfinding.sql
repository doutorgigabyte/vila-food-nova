-- =============================================================
-- Vila Wayfinding (Fase 1 - Outdoor MVP)
-- Adiciona suporte a mapa "Como chegar" na pagina /vila/:slug.
-- Apenas Modalidade A (outdoor walking route via Google Maps).
-- Modalidade B (indoor com planta upload + grafo) fica para Fase 2.
-- =============================================================

ALTER TABLE public.vilas
  ADD COLUMN IF NOT EXISTS has_wayfinding boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_entry_point jsonb;

COMMENT ON COLUMN public.vilas.has_wayfinding IS
  'Quando true, exibe o botao "Como chegar" na pagina da vila e habilita o mapa de wayfinding.';

COMMENT ON COLUMN public.vilas.default_entry_point IS
  'Ponto de entrada padrao quando o usuario nao concede GPS. Formato: {"lat": number, "lng": number, "label": string}.';

-- Constraint para garantir que default_entry_point, se preenchido, tenha lat/lng numericos.
ALTER TABLE public.vilas
  DROP CONSTRAINT IF EXISTS vilas_default_entry_point_shape;

ALTER TABLE public.vilas
  ADD CONSTRAINT vilas_default_entry_point_shape CHECK (
    default_entry_point IS NULL
    OR (
      jsonb_typeof(default_entry_point->'lat') = 'number'
      AND jsonb_typeof(default_entry_point->'lng') = 'number'
    )
  );
