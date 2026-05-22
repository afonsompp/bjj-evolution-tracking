-- Run this script manually on the database before deploying the new backend version.
-- Converts TIMESTAMP columns to TIMESTAMPTZ so all stored values are timezone-aware.
-- Existing values are treated as UTC.

ALTER TABLE training ALTER COLUMN session_date TYPE TIMESTAMPTZ USING session_date AT TIME ZONE 'UTC';
ALTER TABLE scheduled_class ALTER COLUMN start_time TYPE TIMESTAMPTZ USING start_time AT TIME ZONE 'UTC';
ALTER TABLE class_attendance ALTER COLUMN check_in_time TYPE TIMESTAMPTZ USING check_in_time AT TIME ZONE 'UTC';
ALTER TABLE graduation_history ALTER COLUMN graduation_date TYPE TIMESTAMPTZ USING graduation_date AT TIME ZONE 'UTC';
