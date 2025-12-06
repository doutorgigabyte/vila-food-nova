-- Adicionar novos campos à tabela products para suporte completo a variações
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS product_type TEXT DEFAULT 'single',
ADD COLUMN IF NOT EXISTS allows_multiple_flavors BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_flavors INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS temperature_options JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS progressive_pricing JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS requires_age_verification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS storage_type TEXT DEFAULT 'ambient';

-- Criar índice para product_type
CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products(product_type);

-- Comentários para documentação
COMMENT ON COLUMN public.products.product_type IS 'Tipo do produto: single, pizza, drink, combo, frozen, fresh';
COMMENT ON COLUMN public.products.allows_multiple_flavors IS 'Se permite múltiplos sabores (pizzas)';
COMMENT ON COLUMN public.products.max_flavors IS 'Quantidade máxima de sabores permitidos';
COMMENT ON COLUMN public.products.temperature_options IS 'Opções de temperatura: gelada, ambiente, congelada, in_natura';
COMMENT ON COLUMN public.products.progressive_pricing IS 'Preço progressivo: {"tiers": [{"qty": 1, "price": 8.79}, {"qty": 2, "price": 8.49}]}';
COMMENT ON COLUMN public.products.requires_age_verification IS 'Se requer verificação de idade (bebidas alcoólicas)';
COMMENT ON COLUMN public.products.storage_type IS 'Tipo de armazenamento: ambient, refrigerated, frozen';