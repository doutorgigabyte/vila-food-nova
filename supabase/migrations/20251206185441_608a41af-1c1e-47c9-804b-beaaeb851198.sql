-- Criar tabela de categorias principais
CREATE TABLE public.main_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  icon text,
  description text,
  bg_color text DEFAULT 'bg-gray-100',
  icon_color text DEFAULT 'text-gray-600',
  border_color text DEFAULT 'border-gray-400',
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Adicionar campo parent_category_id na tabela segments
ALTER TABLE public.segments 
ADD COLUMN IF NOT EXISTS parent_category_id uuid REFERENCES public.main_categories(id),
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- Criar índice para busca por parent_category
CREATE INDEX IF NOT EXISTS idx_segments_parent_category ON public.segments(parent_category_id);

-- Habilitar RLS na tabela main_categories
ALTER TABLE public.main_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para main_categories
CREATE POLICY "Anyone can view active main_categories" 
ON public.main_categories 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Super admins can manage main_categories" 
ON public.main_categories 
FOR ALL 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Inserir as 6 categorias principais
INSERT INTO public.main_categories (slug, name, icon, description, bg_color, icon_color, border_color, image_url, sort_order) VALUES
('mercado', 'Mercado', 'shopping-cart', 'Supermercados e mercearias', 'bg-emerald-100 dark:bg-emerald-900/40', 'text-emerald-600 dark:text-emerald-400', 'border-emerald-400', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop', 1),
('farmacia', 'Farmácia', 'pill', 'Medicamentos e saúde', 'bg-red-100 dark:bg-red-900/40', 'text-red-500 dark:text-red-400', 'border-red-400', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop', 2),
('compras', 'Compras', 'shopping-bag', 'Lojas e varejo', 'bg-green-100 dark:bg-green-900/40', 'text-green-600 dark:text-green-400', 'border-green-400', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop', 3),
('comida', 'Comida', 'utensils-crossed', 'Restaurantes e lanches', 'bg-amber-100 dark:bg-amber-900/40', 'text-amber-600 dark:text-amber-400', 'border-amber-400', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop', 4),
('artesanato', 'Artesanato', 'palette', 'Artesãos locais', 'bg-purple-100 dark:bg-purple-900/40', 'text-purple-600 dark:text-purple-400', 'border-purple-400', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=100&h=100&fit=crop', 5),
('servicos', 'Serviços', 'wrench', 'Entregas e serviços', 'bg-blue-100 dark:bg-blue-900/40', 'text-blue-600 dark:text-blue-400', 'border-blue-400', 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=100&h=100&fit=crop', 6);

-- Atualizar segments existentes com parent_category_id baseado no mapeamento
-- Comida
UPDATE public.segments SET parent_category_id = (SELECT id FROM public.main_categories WHERE slug = 'comida')
WHERE LOWER(name) IN ('pizzaria', 'hamburgueria', 'lanchonete', 'restaurante', 'marmitaria', 'padaria', 'sorveteria', 'sushi', 'açaí', 'alimentação');

-- Mercado
UPDATE public.segments SET parent_category_id = (SELECT id FROM public.main_categories WHERE slug = 'mercado')
WHERE LOWER(name) IN ('supermercados', 'bebidas');

-- Farmácia
UPDATE public.segments SET parent_category_id = (SELECT id FROM public.main_categories WHERE slug = 'farmacia')
WHERE LOWER(name) IN ('farmácia');

-- Compras
UPDATE public.segments SET parent_category_id = (SELECT id FROM public.main_categories WHERE slug = 'compras')
WHERE LOWER(name) IN ('moda', 'eletrônicos', 'casa e jardim', 'pet shop', 'beleza', 'outros');

-- Artesanato
UPDATE public.segments SET parent_category_id = (SELECT id FROM public.main_categories WHERE slug = 'artesanato')
WHERE LOWER(name) IN ('artesanato');

-- Serviços
UPDATE public.segments SET parent_category_id = (SELECT id FROM public.main_categories WHERE slug = 'servicos')
WHERE LOWER(name) IN ('serviços');