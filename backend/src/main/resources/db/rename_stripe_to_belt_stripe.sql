-- Run this script manually on the database before deploying the new backend version.
-- Renames the stripe columns to belt_stripe to avoid naming collision with Stripe billing.

ALTER TABLE academy_member RENAME COLUMN stripe TO belt_stripe;
ALTER TABLE user_profile RENAME COLUMN stripe TO belt_stripe;
ALTER TABLE graduation_history RENAME COLUMN old_stripe TO old_belt_stripe;
ALTER TABLE graduation_history RENAME COLUMN new_stripe TO new_belt_stripe;
