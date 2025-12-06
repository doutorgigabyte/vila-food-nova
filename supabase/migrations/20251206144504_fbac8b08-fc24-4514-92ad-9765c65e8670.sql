-- Corrigir URLs relativas de produtos para CloudFront completo
UPDATE products 
SET image_url = 'https://d2fhl3f70zfvod.cloudfront.net/_uploads/' || image_url
WHERE image_url IS NOT NULL 
  AND image_url NOT LIKE 'http%'
  AND image_url NOT LIKE 'https%';

-- Corrigir URLs relativas de categorias para CloudFront completo  
UPDATE categories
SET image_url = 'https://d2fhl3f70zfvod.cloudfront.net/_uploads/' || image_url
WHERE image_url IS NOT NULL 
  AND image_url NOT LIKE 'http%'
  AND image_url NOT LIKE 'https%';

-- Corrigir URLs relativas de establishments para CloudFront completo
UPDATE establishments
SET logo_url = 'https://d2fhl3f70zfvod.cloudfront.net/_uploads/' || logo_url
WHERE logo_url IS NOT NULL 
  AND logo_url NOT LIKE 'http%'
  AND logo_url NOT LIKE 'https%';

UPDATE establishments
SET banner_url = 'https://d2fhl3f70zfvod.cloudfront.net/_uploads/' || banner_url
WHERE banner_url IS NOT NULL 
  AND banner_url NOT LIKE 'http%'
  AND banner_url NOT LIKE 'https%';