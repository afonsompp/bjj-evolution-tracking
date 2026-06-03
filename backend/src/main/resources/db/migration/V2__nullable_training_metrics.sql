-- Make the per-session training metrics nullable.
-- A NULL means "not recorded" and is excluded from statistics (SUM/AVG ignore
-- NULLs), whereas an explicit 0 is a real data point that counts.
ALTER TABLE public.training
    ALTER COLUMN total_rolls DROP NOT NULL,
    ALTER COLUMN round_length_minutes DROP NOT NULL,
    ALTER COLUMN rest_length_minutes DROP NOT NULL,
    ALTER COLUMN taps DROP NOT NULL,
    ALTER COLUMN submissions DROP NOT NULL,
    ALTER COLUMN escapes DROP NOT NULL,
    ALTER COLUMN sweeps DROP NOT NULL,
    ALTER COLUMN takedowns DROP NOT NULL,
    ALTER COLUMN guard_passes DROP NOT NULL;
