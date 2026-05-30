-- Run this script manually on the database before deploying the new backend version.
-- Tracks when the upcoming-class reminder email was sent, so the reminder job
-- (ClassReminderJob) never reminds the same class twice.

ALTER TABLE scheduled_class ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
