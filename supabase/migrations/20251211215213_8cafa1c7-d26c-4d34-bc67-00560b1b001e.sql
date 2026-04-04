-- Add image adjustment columns to tv_slides
ALTER TABLE tv_slides ADD COLUMN IF NOT EXISTS image_scale DECIMAL DEFAULT 1.0;
ALTER TABLE tv_slides ADD COLUMN IF NOT EXISTS image_position_x DECIMAL DEFAULT 0;
ALTER TABLE tv_slides ADD COLUMN IF NOT EXISTS image_position_y DECIMAL DEFAULT 0;