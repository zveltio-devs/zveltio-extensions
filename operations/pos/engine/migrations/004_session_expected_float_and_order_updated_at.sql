-- Two columns the routes have always written and the table never had.
--
-- Both are on the paths a shop uses every single day, and both answered 500.
--
-- `zvd_pos_sessions.expected_float` — closing a till computes
-- `opening_float + cash_sales` and stores it beside the cashier's counted
-- `closing_float`. That pair IS the end-of-day reconciliation: the difference
-- between them is the over/short. The column was never created, so
-- `POST /sessions/:id/close` has never succeeded — a cashier could open a
-- session and never close it.
--
-- `zvd_pos_orders.updated_at` — refunding an order sets `status = 'refunded',
-- updated_at = NOW()`. The table carries `created_at` only, so refunds 500'd.
-- Every sibling table here has `updated_at`; this one was missed.
--
-- Both nullable / defaulted, so existing rows are untouched: a session closed
-- before this migration could not exist, and an order written before it keeps
-- `updated_at` equal to its creation time, which is true.

ALTER TABLE zvd_pos_sessions ADD COLUMN IF NOT EXISTS expected_float NUMERIC(14,2);
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- And the state a refund puts an order into.
--
-- The refund route sets `status = 'refunded'` and the CHECK domain is
-- ('open','paid','voided') — so a refund failed on two counts at once, the
-- missing column above and this. Found only when the two were tried together:
-- fixing the column alone would have moved the 500 from one line to the next.
--
-- The Z-report is the evidence that 'refunded' was always meant to exist: it
-- reads `SUM(total) FILTER (WHERE status = 'refunded')` as its refunds line, on
-- a domain where no row could ever hold that value. Every Z-report ever printed
-- reported zero refunds, correctly summing an empty set.
--
-- Widening a CHECK is strictly more permissive: every existing row stays valid.
ALTER TABLE zvd_pos_orders DROP CONSTRAINT IF EXISTS zvd_pos_orders_status_check;
ALTER TABLE zvd_pos_orders ADD CONSTRAINT zvd_pos_orders_status_check
  CHECK (status = ANY (ARRAY['open', 'paid', 'voided', 'refunded']));

-- DOWN
ALTER TABLE zvd_pos_sessions DROP COLUMN IF EXISTS expected_float;
ALTER TABLE zvd_pos_orders DROP COLUMN IF EXISTS updated_at;
UPDATE zvd_pos_orders SET status = 'voided' WHERE status = 'refunded';
ALTER TABLE zvd_pos_orders DROP CONSTRAINT IF EXISTS zvd_pos_orders_status_check;
ALTER TABLE zvd_pos_orders ADD CONSTRAINT zvd_pos_orders_status_check
  CHECK (status = ANY (ARRAY['open', 'paid', 'voided']));
