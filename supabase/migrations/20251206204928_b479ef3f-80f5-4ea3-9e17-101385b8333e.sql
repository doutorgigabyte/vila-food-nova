-- Add order source tracking and platform fee columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_source TEXT DEFAULT 'direct';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN orders.order_source IS 'Origin of order: marketplace, direct, pdv, whatsapp';
COMMENT ON COLUMN orders.platform_fee IS 'Platform fee charged (5% for marketplace orders)';