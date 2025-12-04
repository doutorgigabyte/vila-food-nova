-- Criar buckets de storage para imagens
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('establishments', 'establishments', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('products', 'products', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Políticas de storage para establishments
CREATE POLICY "Public can view establishment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'establishments');

CREATE POLICY "Authenticated users can upload establishment images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'establishments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their establishment images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'establishments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their establishment images"
ON storage.objects FOR DELETE
USING (bucket_id = 'establishments' AND auth.role() = 'authenticated');

-- Políticas de storage para products
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'products' AND auth.role() = 'authenticated');

-- Políticas de storage para avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');