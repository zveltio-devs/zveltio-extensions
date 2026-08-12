-- Currency and cost centre on an account.
--
-- Both were written by the create handler and neither existed, so creating an
-- account ended in a 500 — the first thing anyone does in an accounting module.
--
-- Currency is not decoration: a company with a EUR bank account and RON sales
-- needs the ledger to say which is which, and defaulting it to RON keeps every
-- existing row meaning exactly what it meant before.
ALTER TABLE zvd_accounts ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'RON';
ALTER TABLE zvd_accounts ADD COLUMN IF NOT EXISTS cost_center_id UUID;
