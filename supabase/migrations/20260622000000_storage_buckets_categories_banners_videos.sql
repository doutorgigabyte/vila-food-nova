-- Adiciona buckets de storage faltantes (categories, banners, videos).
-- Migration 20251204193416_*.sql ja criou establishments/products/avatars,
-- mas o front (UploadType em src/lib/s3.ts) tambem usa esses tres.
-- Sem isso, qualquer upload nesses tipos falha com "Bucket not found".

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('categories', 'categories', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('banners', 'banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Politicas espelham as ja existentes pros outros buckets: leitura publica,
-- escrita por qualquer usuario autenticado. A autorizacao de quem pode
-- fazer upload pra qual estabelecimento e feita pelo proprio app (folder
-- structure {establishmentId}/...) e nao pela storage RLS, igual ja vinha
-- sendo feito pros buckets antigos.

-- categories
CREATE POLICY "Public can view category images"
ON storage.objects FOR SELECT
USING (bucket_id = 'categories');

CREATE POLICY "Authenticated users can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'categories' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update category images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'categories' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete category images"
ON storage.objects FOR DELETE
USING (bucket_id = 'categories' AND auth.role() = 'authenticated');

-- banners
CREATE POLICY "Public can view banner images"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Authenticated users can upload banner images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update banner images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete banner images"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- videos
CREATE POLICY "Public can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND auth.role() = 'authenticated');
