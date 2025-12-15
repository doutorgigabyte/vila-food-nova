-- Add payment methods configuration to establishments
ALTER TABLE establishments 
ADD COLUMN IF NOT EXISTS payment_methods_config jsonb DEFAULT '{
  "pix": true,
  "credit_card": true,
  "debit_card": true,
  "cash": true,
  "card_on_delivery": false,
  "pix_on_delivery": false
}'::jsonb;