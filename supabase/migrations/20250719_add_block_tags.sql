-- Add block_tags column to ocs table
-- Block tags filter characters out of the swipe roster

ALTER TABLE ocs
ADD COLUMN IF NOT EXISTS block_tags text[] DEFAULT '{}'::text[];
