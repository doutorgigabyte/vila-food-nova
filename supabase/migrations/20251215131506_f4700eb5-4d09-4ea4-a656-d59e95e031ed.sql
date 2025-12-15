-- Add background_color column to establishments table
ALTER TABLE establishments 
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#ffffff';