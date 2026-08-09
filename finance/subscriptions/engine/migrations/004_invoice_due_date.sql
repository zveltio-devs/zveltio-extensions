-- A subscription invoice has a due date and an author.
--
-- Both were written and neither existed. Without a due date a subscription
-- invoice cannot be chased, which is most of what a subscription invoice is
-- for.
ALTER TABLE zvd_subscription_invoices ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE zvd_subscription_invoices ADD COLUMN IF NOT EXISTS created_by TEXT;
