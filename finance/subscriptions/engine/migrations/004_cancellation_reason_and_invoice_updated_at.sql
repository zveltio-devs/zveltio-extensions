-- Two more columns the routes have always written and the table never had.
--
-- `zvd_subscribers.cancellation_reason` — `POST /subscribers/:id/cancel`
-- accepts a `reason` and assigns it here; `POST /subscribers/:id/reactivate`
-- clears it. Neither statement could run, so a subscription could be neither
-- cancelled nor reactivated: both answered 500. Churn is the number a
-- subscription business is run on and the reason for it was unrecordable.
--
-- `zvd_subscription_invoices.updated_at` — `POST /invoices/:id/pay` sets it.
-- Marking an invoice paid answered 500, which is the other end of the same
-- business. Every sibling table here carries `updated_at`; this one was missed.
--
-- Both additive. The reason column is nullable — subscriptions cancelled before
-- this migration could not exist, and there is nothing to backfill. The
-- timestamp defaults to now() so an existing invoice reads as last touched when
-- the migration ran, which is the honest answer when no history was kept.

ALTER TABLE zvd_subscribers ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE zvd_subscription_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- And the two subscriber states the routes use that the domain never had.
--
-- The CHECK lists (trialing, active, past_due, cancelled, expired). The routes
-- write `status = 'paused'` and both read and write `cancel_scheduled`:
--
--   POST /subscribers/:id/pause   → status = 'paused'          → 500
--   POST /subscribers/:id/cancel  → status = 'cancel_scheduled' when the caller
--                                    asks to cancel at period end → 500
--   the same route's WHERE reads  → status IN ('active','trialing',
--                                    'cancel_scheduled','paused')
--
-- So pausing never worked, and "cancel at the end of the period" — the option
-- that keeps a customer paying for the month they already bought — could not be
-- recorded. The WHERE clauses naming both states are the evidence they were
-- always intended; only the constraint was never widened.
--
-- Widening a CHECK is strictly more permissive: every existing row stays valid.
ALTER TABLE zvd_subscribers DROP CONSTRAINT IF EXISTS zvd_subscribers_status_check;
ALTER TABLE zvd_subscribers ADD CONSTRAINT zvd_subscribers_status_check
  CHECK (status = ANY (ARRAY['trialing', 'active', 'past_due', 'paused', 'cancel_scheduled', 'cancelled', 'expired']));

-- DOWN
ALTER TABLE zvd_subscribers DROP COLUMN IF EXISTS cancellation_reason;
ALTER TABLE zvd_subscription_invoices DROP COLUMN IF EXISTS updated_at;
UPDATE zvd_subscribers SET status = 'active' WHERE status = 'paused';
UPDATE zvd_subscribers SET status = 'cancelled' WHERE status = 'cancel_scheduled';
ALTER TABLE zvd_subscribers DROP CONSTRAINT IF EXISTS zvd_subscribers_status_check;
ALTER TABLE zvd_subscribers ADD CONSTRAINT zvd_subscribers_status_check
  CHECK (status = ANY (ARRAY['trialing', 'active', 'past_due', 'cancelled', 'expired']));
