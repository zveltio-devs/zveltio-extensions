-- A leave balance must be a number.
--
-- That reads as a tautology. It is not, and the gap is what made this module
-- grant unlimited leave.
--
-- `allocated_days`, `carried_over_days`, `used_days` and `pending_days` are all
-- NUMERIC, and PostgreSQL sends NUMERIC to the driver as a **string**. The
-- carry-over job added two of them in JavaScript:
--
--   "21.0" + "0.0"  ->  "21.00.0"      -- concatenation, not addition
--   "21.00.0" - "5.0"  ->  NaN
--
-- `NaN <= 0` is false, so the "nothing to carry" guard did not skip the row. It
-- carried NaN forward, and PostgreSQL stored it without complaint: NaN is a
-- legal NUMERIC value.
--
-- Then the part that turns a wrong number into a security defect. In PostgreSQL
-- NaN compares as LARGER than every other numeric:
--
--   SELECT 'NaN'::numeric > 999999999;   -- true
--   SELECT 'NaN'::numeric >= 0;          -- true
--
-- So the obvious constraint — CHECK (carried_over_days >= 0) — passes on exactly
-- the rows it was written to catch. The guard is not absent; it runs, and agrees.
--
-- The usual IEEE-754 trick does not rescue it either. `CHECK (x = x)` is false
-- for NaN in most languages; in PostgreSQL it is TRUE, for both NUMERIC and
-- DOUBLE PRECISION, because NaN is defined equal to itself so that numeric
-- columns can be sorted and indexed. Measured here before relying on it:
--
--   SELECT 'NaN'::numeric = 'NaN'::numeric;   -- t
--   SELECT 'NaN'::float8  = 'NaN'::float8;    -- t
--
-- The test that does work is an explicit comparison against the value itself:
-- `x <> 'NaN'::numeric` is true for every real number and false for NaN. NULL
-- yields NULL, which a CHECK accepts — correct, since these columns are
-- nullable and absent is not corrupt.
--
-- The code path is fixed (routes.ts converts before it adds, and the approval
-- guard refuses a balance it cannot evaluate rather than approving it). This is
-- the database saying the same thing, so that the next module to compute a
-- balance cannot repeat it silently.
--
-- Existing poisoned rows are set to 0 rather than guessed at. Zero denies leave
-- where NaN granted it, which is the safe direction, and the carry-over job can
-- be re-run for the affected year now that it computes correctly. The rows are
-- named in a NOTICE first — an operator has to know which employees to re-run.

DO $$
DECLARE
  bad record;
  n integer := 0;
BEGIN
  FOR bad IN
    SELECT employee_id, leave_type_id, year FROM zvd_leave_balances
    WHERE allocated_days = 'NaN'::numeric
       OR carried_over_days = 'NaN'::numeric
       OR used_days = 'NaN'::numeric
       OR pending_days = 'NaN'::numeric
  LOOP
    RAISE NOTICE '[hr/leave] NaN leave balance reset to 0: employee=% leave_type=% year=% — re-run the carry-over job for this year',
      bad.employee_id, bad.leave_type_id, bad.year;
    n := n + 1;
  END LOOP;

  IF n > 0 THEN
    UPDATE zvd_leave_balances SET allocated_days = 0 WHERE allocated_days = 'NaN'::numeric;
    UPDATE zvd_leave_balances SET carried_over_days = 0 WHERE carried_over_days = 'NaN'::numeric;
    UPDATE zvd_leave_balances SET used_days = 0 WHERE used_days = 'NaN'::numeric;
    UPDATE zvd_leave_balances SET pending_days = 0 WHERE pending_days = 'NaN'::numeric;
    RAISE WARNING '[hr/leave] % leave balance row(s) held NaN and were reset to 0. Re-run POST /leave/carryover for the affected years.', n;
  END IF;
END
$$;

ALTER TABLE zvd_leave_balances DROP CONSTRAINT IF EXISTS zvd_leave_balances_days_are_numbers;
ALTER TABLE zvd_leave_balances ADD CONSTRAINT zvd_leave_balances_days_are_numbers
  CHECK (
    allocated_days <> 'NaN'::numeric
    AND carried_over_days <> 'NaN'::numeric
    AND used_days <> 'NaN'::numeric
    AND pending_days <> 'NaN'::numeric
  );

-- The carry-over log records how many days moved; NaN there is a false audit
-- trail rather than a wrong entitlement, but it comes from the same expression.
UPDATE zvd_leave_carryover_log SET days_carried = 0 WHERE days_carried = 'NaN'::numeric;
ALTER TABLE zvd_leave_carryover_log DROP CONSTRAINT IF EXISTS zvd_leave_carryover_log_days_is_number;
ALTER TABLE zvd_leave_carryover_log ADD CONSTRAINT zvd_leave_carryover_log_days_is_number
  CHECK (days_carried <> 'NaN'::numeric);

-- Requested days come from countWorkingDays(), which is plain JS arithmetic on
-- dates — but it feeds the same balance columns, so the same guard applies.
UPDATE zvd_leave_requests SET working_days = 0 WHERE working_days = 'NaN'::numeric;
ALTER TABLE zvd_leave_requests DROP CONSTRAINT IF EXISTS zvd_leave_requests_working_days_is_number;
ALTER TABLE zvd_leave_requests ADD CONSTRAINT zvd_leave_requests_working_days_is_number
  CHECK (working_days <> 'NaN'::numeric);

-- DOWN
ALTER TABLE zvd_leave_balances DROP CONSTRAINT IF EXISTS zvd_leave_balances_days_are_numbers;
ALTER TABLE zvd_leave_carryover_log DROP CONSTRAINT IF EXISTS zvd_leave_carryover_log_days_is_number;
ALTER TABLE zvd_leave_requests DROP CONSTRAINT IF EXISTS zvd_leave_requests_working_days_is_number;
