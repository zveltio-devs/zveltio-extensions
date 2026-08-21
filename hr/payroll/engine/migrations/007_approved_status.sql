-- 007_approved_status.sql
--
-- Paying a payroll period did not require anyone to have approved it.
--
-- The lifecycle reads open → calculated → (approve) → (pay) → closed, and
-- `approve` wrote `approved_by` and `approved_at` while setting
--   status = 'calculated' WHERE status = 'calculated'
-- because 'approved' was not in the CHECK domain and there was nothing to move
-- to. `pay` then required only `status = 'calculated'` — a condition that holds
-- both before and after approval. So calculate → pay went straight through, and
-- money left the company without the approval that
-- `mayDecidePayroll(ctx, user, 'approve')` exists to demand.
--
-- The permission gate was never the weak part. The STATE MACHINE was: two
-- different decisions shared one state, so the second could not tell whether the
-- first had happened.
--
-- Adding the state makes the bypass structurally impossible rather than
-- checked-for. `pay` now requires `status = 'approved'`, which only `approve`
-- can produce.

ALTER TABLE zvd_payroll_periods DROP CONSTRAINT IF EXISTS zvd_payroll_periods_status_check;

ALTER TABLE zvd_payroll_periods
  ADD CONSTRAINT zvd_payroll_periods_status_check
  CHECK (status IN ('open', 'calculated', 'approved', 'closed'));

-- Periods approved before this migration carry the evidence in `approved_at`
-- even though their status could not record it. Move them, so an install
-- upgrading mid-cycle does not find its approved periods unpayable.
UPDATE zvd_payroll_periods
   SET status = 'approved'
 WHERE status = 'calculated'
   AND approved_at IS NOT NULL;
