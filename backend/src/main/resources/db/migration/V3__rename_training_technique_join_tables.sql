-- Rename the technique join tables to match the broadened semantics: both lists
-- now hold any technique type, not just submissions.
--   training_submission_technique         -> training_applied_technique  (techniques you applied)
--   training_submission_technique_allowed -> training_suffered_technique (techniques applied on you)
ALTER TABLE public.training_submission_technique RENAME TO training_applied_technique;
ALTER TABLE public.training_submission_technique_allowed RENAME TO training_suffered_technique;
