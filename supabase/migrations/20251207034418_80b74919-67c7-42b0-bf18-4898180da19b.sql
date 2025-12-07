-- Add scheduling columns to establishment_videos table
ALTER TABLE establishment_videos 
ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS repost_schedule JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS repost_days INTEGER[] DEFAULT '{}'::integer[];

-- Add comment for clarity
COMMENT ON COLUMN establishment_videos.scheduled_for IS 'Date/time for initial publication';
COMMENT ON COLUMN establishment_videos.repost_schedule IS 'Array of times for automatic reposting, e.g. ["08:00", "12:00", "18:00"]';
COMMENT ON COLUMN establishment_videos.repost_days IS 'Days of week for reposting: 0=Sunday, 1=Monday, etc.';