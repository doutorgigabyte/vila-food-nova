-- Add 'turbo' as a valid delivery_type enum value
ALTER TYPE delivery_type ADD VALUE IF NOT EXISTS 'turbo';