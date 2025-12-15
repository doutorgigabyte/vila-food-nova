-- Adicionar subcategorias regionais para Mercado
INSERT INTO public.segments (name, icon, is_active, parent_category_id)
SELECT name, icon, true, (SELECT id FROM main_categories WHERE slug = 'mercado')
FROM (VALUES 
  ('Hortifruti', 'Carrot'),
  ('Mercearia', 'ShoppingBasket'),
  ('Conveniência', 'Store'),
  ('Padaria', 'Croissant'),
  ('Açougue', 'Beef'),
  ('Peixaria', 'Fish'),
  ('Adega', 'Wine'),
  ('Empório', 'Package'),
  ('Produtos Naturais', 'Leaf'),
  ('Doces e Guloseimas', 'Candy')
) AS t(name, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM segments s 
  WHERE s.name = t.name 
  AND s.parent_category_id = (SELECT id FROM main_categories WHERE slug = 'mercado')
);

-- Adicionar subcategorias regionais para Farmácia
INSERT INTO public.segments (name, icon, is_active, parent_category_id)
SELECT name, icon, true, (SELECT id FROM main_categories WHERE slug = 'farmacia')
FROM (VALUES 
  ('Drogaria', 'Pill'),
  ('Manipulação', 'FlaskConical'),
  ('Homeopatia', 'Flower2'),
  ('Perfumaria', 'Sparkles'),
  ('Higiene Pessoal', 'Bath'),
  ('Suplementos', 'Dumbbell'),
  ('Cosméticos', 'Palette')
) AS t(name, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM segments s 
  WHERE s.name = t.name 
  AND s.parent_category_id = (SELECT id FROM main_categories WHERE slug = 'farmacia')
);

-- Adicionar subcategorias regionais para Artesanato
INSERT INTO public.segments (name, icon, is_active, parent_category_id)
SELECT name, icon, true, (SELECT id FROM main_categories WHERE slug = 'artesanato')
FROM (VALUES 
  ('Bordados', 'Scissors'),
  ('Cerâmica', 'Circle'),
  ('Madeira', 'TreeDeciduous'),
  ('Couro', 'Briefcase'),
  ('Bijuterias', 'Gem'),
  ('Decoração', 'Lamp'),
  ('Tecidos', 'Shirt'),
  ('Crochê', 'Heart'),
  ('Pintura', 'Palette'),
  ('Esculturas', 'Shapes')
) AS t(name, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM segments s 
  WHERE s.name = t.name 
  AND s.parent_category_id = (SELECT id FROM main_categories WHERE slug = 'artesanato')
);

-- Adicionar subcategorias regionais para Serviços
INSERT INTO public.segments (name, icon, is_active, parent_category_id)
SELECT name, icon, true, (SELECT id FROM main_categories WHERE slug = 'servicos')
FROM (VALUES 
  ('Manutenção', 'Wrench'),
  ('Limpeza', 'Sparkles'),
  ('Beleza', 'Scissors'),
  ('Saúde', 'Heart'),
  ('Educação', 'GraduationCap'),
  ('Consultoria', 'MessageSquare'),
  ('Transporte', 'Truck'),
  ('Reparos', 'Hammer'),
  ('Pet Shop', 'Dog'),
  ('Estética', 'Sparkle')
) AS t(name, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM segments s 
  WHERE s.name = t.name 
  AND s.parent_category_id = (SELECT id FROM main_categories WHERE slug = 'servicos')
);

-- Adicionar subcategorias regionais para Compras
INSERT INTO public.segments (name, icon, is_active, parent_category_id)
SELECT name, icon, true, (SELECT id FROM main_categories WHERE slug = 'compras')
FROM (VALUES 
  ('Roupas', 'Shirt'),
  ('Calçados', 'Footprints'),
  ('Eletrônicos', 'Smartphone'),
  ('Móveis', 'Armchair'),
  ('Papelaria', 'FileText'),
  ('Brinquedos', 'Gamepad2'),
  ('Esportes', 'Dumbbell'),
  ('Joias', 'Gem'),
  ('Acessórios', 'Watch'),
  ('Presentes', 'Gift')
) AS t(name, icon)
WHERE NOT EXISTS (
  SELECT 1 FROM segments s 
  WHERE s.name = t.name 
  AND s.parent_category_id = (SELECT id FROM main_categories WHERE slug = 'compras')
);