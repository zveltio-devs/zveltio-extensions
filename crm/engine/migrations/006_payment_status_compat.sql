-- Legacy core installs used payment_status; CRM routes/briefing use status.
-- Keep both in sync so either column works for receivables queries.
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS payment_status TEXT;

UPDATE zvd_transactions
   SET payment_status = status
 WHERE payment_status IS NULL
   AND status IS NOT NULL;

-- Prefer status as source of truth going forward when only one is set.
UPDATE zvd_transactions
   SET status = payment_status
 WHERE (status IS NULL OR status = '')
   AND payment_status IS NOT NULL;
