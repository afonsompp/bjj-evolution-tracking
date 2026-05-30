ALTER TABLE scheduled_class DROP CONSTRAINT IF EXISTS scheduled_class_status_check;
ALTER TABLE scheduled_class ADD CONSTRAINT scheduled_class_status_check
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELED'));
