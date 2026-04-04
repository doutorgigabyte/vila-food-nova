-- ============================================
-- Add missing columns for Driver App integration
-- Aligns delivery_drivers and delivery_tracking
-- with VilaFoodEntregador app expectations
-- ============================================

-- Add missing columns to delivery_drivers
ALTER TABLE delivery_drivers
  ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_earnings NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_deliveries INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pix_key TEXT,
  ADD COLUMN IF NOT EXISTS pix_key_type TEXT CHECK (pix_key_type IN ('cpf', 'email', 'phone', 'random')),
  ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS fcm_token TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add missing columns to delivery_tracking
ALTER TABLE delivery_tracking
  ADD COLUMN IF NOT EXISTS driver_earnings NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed'));

-- Index for driver earnings queries
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_driver_status ON delivery_tracking (driver_id, status);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_driver_delivered ON delivery_tracking (driver_id, delivered_at) WHERE status = 'delivered';

-- Add customers table if not exists (driver app queries it)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  neighborhood TEXT,
  city TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  addresses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "customers_select" ON customers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "customers_own" ON customers
  FOR ALL TO authenticated USING (user_id = auth.uid());
