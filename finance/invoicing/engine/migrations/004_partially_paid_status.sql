-- Let an invoice be partially paid.
--
-- `001_initial.sql` allowed draft/sent/paid/overdue/cancelled. Two handlers have
-- always written 'partially_paid' into that column:
--
--   POST /invoices/:id/payments        — recording a payment smaller than the balance
--   POST /credit-notes/:id/apply       — a credit note that does not cover the invoice
--
-- Both therefore ended in a 23514 check violation, surfaced as a 500. Partial
-- payment has never worked on any install: the table was written for a world
-- where an invoice is either open or settled, and the handlers were written for
-- the world businesses actually live in.
--
-- The column, not the handlers, is what was wrong — so widen it. Nothing is
-- rewritten: no row can currently hold this value, precisely because the
-- constraint refused every attempt to store one.

ALTER TABLE zvd_invoices DROP CONSTRAINT IF EXISTS zvd_invoices_status_check;

ALTER TABLE zvd_invoices ADD CONSTRAINT zvd_invoices_status_check
  CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'));
