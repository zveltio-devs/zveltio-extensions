-- A test case for a `transition` rule names the stored value it moves from.
--
-- `transition` rules (engine 3.0.0-beta.85) judge the value being written
-- against the one stored before it. NULL is a create: `previous` is null.

ALTER TABLE zvd_validation_test_cases ADD COLUMN IF NOT EXISTS previous_value TEXT;

-- DOWN

ALTER TABLE zvd_validation_test_cases DROP COLUMN IF EXISTS previous_value;
