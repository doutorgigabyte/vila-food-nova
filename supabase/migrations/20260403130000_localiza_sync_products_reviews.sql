-- ============================================
-- LocalizAI Sync: Products, Reviews & Promotions
-- Phase 3-5 infrastructure
-- ============================================

-- ============================================
-- Table: localiza_product_sync
-- Caches product data for LocalizAI consumption
-- ============================================
CREATE TABLE IF NOT EXISTS localiza_product_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  localiza_place_id TEXT NOT NULL,
  products_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  synced_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_localiza_product_sync_place ON localiza_product_sync (localiza_place_id);
CREATE INDEX idx_localiza_product_sync_expires ON localiza_product_sync (expires_at);
CREATE UNIQUE INDEX idx_localiza_product_sync_est ON localiza_product_sync (establishment_id);

-- RLS
ALTER TABLE localiza_product_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "localiza_product_sync_select" ON localiza_product_sync
  FOR SELECT TO authenticated USING (true);

-- Allow anonymous read for LocalizAI public access
CREATE POLICY "localiza_product_sync_anon_select" ON localiza_product_sync
  FOR SELECT TO anon USING (true);

-- ============================================
-- Table: localiza_review_sync
-- Syncs reviews between LocalizAI and VIlaFood
-- ============================================
CREATE TABLE IF NOT EXISTS localiza_review_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  localiza_place_id TEXT NOT NULL,
  user_id UUID,
  source TEXT NOT NULL CHECK (source IN ('vilafood', 'localiza')),
  source_review_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewer_name TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source, source_review_id)
);

CREATE INDEX idx_localiza_review_sync_est ON localiza_review_sync (establishment_id);
CREATE INDEX idx_localiza_review_sync_place ON localiza_review_sync (localiza_place_id);

-- RLS
ALTER TABLE localiza_review_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "localiza_review_sync_select" ON localiza_review_sync
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "localiza_review_sync_anon_select" ON localiza_review_sync
  FOR SELECT TO anon USING (true);

-- ============================================
-- Table: localiza_promotion_sync
-- Syncs promotions/offers for LocalizAI display
-- ============================================
CREATE TABLE IF NOT EXISTS localiza_promotion_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id UUID NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  localiza_place_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'bogo', 'coupon')),
  discount_value NUMERIC(10,2),
  coupon_code TEXT,
  image_url TEXT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_localiza_promo_sync_place ON localiza_promotion_sync (localiza_place_id);
CREATE INDEX idx_localiza_promo_sync_active ON localiza_promotion_sync (is_active, expires_at);

-- RLS
ALTER TABLE localiza_promotion_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "localiza_promo_sync_select" ON localiza_promotion_sync
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "localiza_promo_sync_anon_select" ON localiza_promotion_sync
  FOR SELECT TO anon USING (true);

-- ============================================
-- RPC: get_localiza_products
-- Public endpoint for LocalizAI to fetch products
-- ============================================
CREATE OR REPLACE FUNCTION get_localiza_products(p_place_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  est_id UUID;
BEGIN
  -- Find establishment by localiza_place_id
  SELECT establishment_id INTO est_id
  FROM localiza_place_mapping
  WHERE localiza_place_id = p_place_id AND sync_status = 'active'
  LIMIT 1;

  IF est_id IS NULL THEN
    RETURN json_build_object('error', 'Place not found or not synced');
  END IF;

  -- Try cached data first
  SELECT json_build_object(
    'products', ps.products_data,
    'categories', ps.categories_data,
    'cached', true,
    'synced_at', ps.synced_at
  ) INTO result
  FROM localiza_product_sync ps
  WHERE ps.establishment_id = est_id AND ps.expires_at > now();

  IF result IS NOT NULL THEN
    RETURN result;
  END IF;

  -- Fallback: fetch fresh data
  SELECT json_build_object(
    'products', COALESCE((
      SELECT json_agg(json_build_object(
        'id', p.id,
        'name', p.name,
        'description', p.description,
        'price', p.price,
        'promotional_price', p.promotional_price,
        'image_url', p.image_url,
        'category_id', p.category_id,
        'is_featured', p.is_featured,
        'is_active', p.is_active,
        'preparation_time', p.preparation_time
      ))
      FROM products p
      WHERE p.establishment_id = est_id AND p.is_active = true
    ), '[]'::json),
    'categories', COALESCE((
      SELECT json_agg(json_build_object(
        'id', c.id,
        'name', c.name,
        'sort_order', c.sort_order
      ))
      FROM categories c
      WHERE c.establishment_id = est_id
    ), '[]'::json),
    'cached', false,
    'synced_at', now()
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_localiza_products(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_localiza_products(TEXT) TO authenticated;

-- ============================================
-- RPC: get_localiza_reviews
-- Public endpoint for LocalizAI to fetch reviews
-- ============================================
CREATE OR REPLACE FUNCTION get_localiza_reviews(p_place_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'reviews', COALESCE((
      SELECT json_agg(json_build_object(
        'id', r.id,
        'rating', r.rating,
        'comment', r.comment,
        'reviewer_name', r.reviewer_name,
        'source', r.source,
        'created_at', r.created_at
      ) ORDER BY r.created_at DESC)
      FROM localiza_review_sync r
      WHERE r.localiza_place_id = p_place_id
    ), '[]'::json),
    'average_rating', (
      SELECT ROUND(AVG(r.rating)::numeric, 1)
      FROM localiza_review_sync r
      WHERE r.localiza_place_id = p_place_id
    ),
    'total_reviews', (
      SELECT COUNT(*)
      FROM localiza_review_sync r
      WHERE r.localiza_place_id = p_place_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_localiza_reviews(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_localiza_reviews(TEXT) TO authenticated;

-- ============================================
-- RPC: get_localiza_promotions
-- Public endpoint for LocalizAI to fetch active promos
-- ============================================
CREATE OR REPLACE FUNCTION get_localiza_promotions(p_place_id TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'promotions', COALESCE((
      SELECT json_agg(json_build_object(
        'id', p.id,
        'title', p.title,
        'description', p.description,
        'discount_type', p.discount_type,
        'discount_value', p.discount_value,
        'coupon_code', p.coupon_code,
        'image_url', p.image_url,
        'starts_at', p.starts_at,
        'expires_at', p.expires_at,
        'establishment_name', e.name,
        'establishment_slug', e.slug,
        'localiza_place_id', p.localiza_place_id
      ) ORDER BY p.created_at DESC)
      FROM localiza_promotion_sync p
      JOIN establishments e ON e.id = p.establishment_id
      WHERE p.is_active = true
        AND (p.expires_at IS NULL OR p.expires_at > now())
        AND (p_place_id IS NULL OR p.localiza_place_id = p_place_id)
    ), '[]'::json)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_localiza_promotions(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_localiza_promotions(TEXT) TO authenticated;
