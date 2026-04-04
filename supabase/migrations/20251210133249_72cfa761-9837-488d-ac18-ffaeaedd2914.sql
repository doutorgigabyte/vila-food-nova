-- Add awaiting_payment status to order_status enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'awaiting_payment' BEFORE 'pending';

-- Add new columns to orders table for 99Food model
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS out_of_stock_action TEXT DEFAULT 'contact_me';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pix_qr_base64 TEXT;

-- Add coupon_type to coupons table (product discount vs delivery discount)
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS coupon_type TEXT DEFAULT 'product';

-- Add comment for out_of_stock_action values
COMMENT ON COLUMN orders.out_of_stock_action IS 'Options: contact_me, cancel_order, cancel_item';
COMMENT ON COLUMN coupons.coupon_type IS 'Options: product (discount on items), delivery (free/discounted delivery)';