-- Tabela para conexões iFood
CREATE TABLE public.ifood_merchant_connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  merchant_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending',
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(establishment_id)
);

-- Tabela para catálogos iFood
CREATE TABLE public.ifood_catalogs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id uuid NOT NULL REFERENCES public.ifood_merchant_connections(id) ON DELETE CASCADE,
  catalog_id text NOT NULL,
  context text DEFAULT 'DEFAULT',
  is_active boolean DEFAULT true,
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Adicionar campos de referência iFood nas tabelas existentes
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS ifood_item_id text,
ADD COLUMN IF NOT EXISTS ifood_sku text,
ADD COLUMN IF NOT EXISTS ifood_last_sync timestamp with time zone;

ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS ifood_category_id text;

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_products_ifood_item_id ON public.products(ifood_item_id) WHERE ifood_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_ifood_category_id ON public.categories(ifood_category_id) WHERE ifood_category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ifood_connections_establishment ON public.ifood_merchant_connections(establishment_id);

-- Enable RLS
ALTER TABLE public.ifood_merchant_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifood_catalogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies para ifood_merchant_connections
CREATE POLICY "Establishment owners can view their iFood connections"
ON public.ifood_merchant_connections FOR SELECT
USING (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = ifood_merchant_connections.establishment_id
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Establishment owners can manage their iFood connections"
ON public.ifood_merchant_connections FOR ALL
USING (EXISTS (
  SELECT 1 FROM establishments
  WHERE establishments.id = ifood_merchant_connections.establishment_id
  AND establishments.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all iFood connections"
ON public.ifood_merchant_connections FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies para ifood_catalogs
CREATE POLICY "Establishment owners can view their iFood catalogs"
ON public.ifood_catalogs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM ifood_merchant_connections imc
  JOIN establishments e ON e.id = imc.establishment_id
  WHERE imc.id = ifood_catalogs.connection_id
  AND e.owner_id = auth.uid()
));

CREATE POLICY "Establishment owners can manage their iFood catalogs"
ON public.ifood_catalogs FOR ALL
USING (EXISTS (
  SELECT 1 FROM ifood_merchant_connections imc
  JOIN establishments e ON e.id = imc.establishment_id
  WHERE imc.id = ifood_catalogs.connection_id
  AND e.owner_id = auth.uid()
));

CREATE POLICY "Super admins can manage all iFood catalogs"
ON public.ifood_catalogs FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));