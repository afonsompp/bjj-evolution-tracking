-- Run this script manually on the database before deploying the new backend version.

ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS anonymized_at TIMESTAMPTZ;
