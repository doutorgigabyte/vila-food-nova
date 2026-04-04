-- Adicionar campos para WhatsApp AI avançado na tabela establishments
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS menu_json JSONB DEFAULT '[]'::jsonb;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE establishments ADD COLUMN IF NOT EXISTS menu_json_updated_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campos para WhatsApp instances
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT;
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS n8n_enabled BOOLEAN DEFAULT false;
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'google/gemini-2.5-flash';
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS send_media_enabled BOOLEAN DEFAULT true;
ALTER TABLE whatsapp_instances ADD COLUMN IF NOT EXISTS menu_sync_enabled BOOLEAN DEFAULT true;

-- Criar tabela para cache de coordenadas de endereços (otimização)
CREATE TABLE IF NOT EXISTS address_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cep TEXT NOT NULL,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  lat NUMERIC,
  lng NUMERIC,
  formatted_address TEXT,
  source TEXT DEFAULT 'viacep',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice único para CEP
CREATE UNIQUE INDEX IF NOT EXISTS idx_address_cache_cep ON address_cache(cep);

-- RLS para address_cache (público para leitura, serviço para escrita)
ALTER TABLE address_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read address cache" 
ON address_cache FOR SELECT 
USING (true);

CREATE POLICY "Service role can manage address cache" 
ON address_cache FOR ALL 
USING (true)
WITH CHECK (true);

-- Adicionar campos de endereço completo na tabela customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_address JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_location_lat NUMERIC;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_location_lng NUMERIC;

-- Atualizar tabela de mensagens do WhatsApp para suportar mídia
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS media_type TEXT;
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Criar função para gerar menu_json automaticamente
CREATE OR REPLACE FUNCTION generate_menu_json(est_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'name', p.name,
      'description', COALESCE(p.description, ''),
      'price', COALESCE(p.promotional_price, p.price),
      'original_price', p.price,
      'image_url', p.image_url,
      'category', COALESCE(c.name, 'Outros'),
      'is_available', p.is_active
    )
  )
  INTO result
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.establishment_id = est_id AND p.is_active = true
  ORDER BY c.sort_order, p.name;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar menu_json quando produtos mudam
CREATE OR REPLACE FUNCTION update_establishment_menu_json()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar menu_json do estabelecimento
  UPDATE establishments 
  SET 
    menu_json = generate_menu_json(COALESCE(NEW.establishment_id, OLD.establishment_id)),
    menu_json_updated_at = now()
  WHERE id = COALESCE(NEW.establishment_id, OLD.establishment_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger se existir e recriar
DROP TRIGGER IF EXISTS trigger_update_menu_json ON products;
CREATE TRIGGER trigger_update_menu_json
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION update_establishment_menu_json();