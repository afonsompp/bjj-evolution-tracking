-- Run this script manually on the database before deploying the new backend version.
-- Stores the user's email (captured from the Supabase JWT) so notifications can be
-- sent outside of a request context (async listeners and the class-reminder job).

ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS email VARCHAR(320);
