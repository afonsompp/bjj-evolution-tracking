-- Replace Duration-typed `duration` column with int `duration_minutes` on
-- scheduled_class and class_template.
-- Hibernate 7 maps java.time.Duration to PostgreSQL `interval second(9)` by default;
-- if your column is bigint (nanoseconds), swap EXTRACT(EPOCH FROM duration) for
-- (duration / 60000000000).

ALTER TABLE scheduled_class ADD COLUMN duration_minutes INTEGER;
UPDATE scheduled_class
SET duration_minutes = (EXTRACT(EPOCH FROM duration) / 60)::INTEGER;
ALTER TABLE scheduled_class ALTER COLUMN duration_minutes SET NOT NULL;
ALTER TABLE scheduled_class DROP COLUMN duration;

ALTER TABLE class_template ADD COLUMN duration_minutes INTEGER;
UPDATE class_template
SET duration_minutes = (EXTRACT(EPOCH FROM duration) / 60)::INTEGER;
ALTER TABLE class_template ALTER COLUMN duration_minutes SET NOT NULL;
ALTER TABLE class_template DROP COLUMN duration;
