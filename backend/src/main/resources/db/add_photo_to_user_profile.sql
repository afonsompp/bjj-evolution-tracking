-- Run this script manually on the database before deploying the new backend version.

ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS photo_key TEXT;
