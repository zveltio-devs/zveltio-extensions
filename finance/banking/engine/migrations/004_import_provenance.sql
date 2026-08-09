-- Where an imported transaction came from, and who the money moved to or from.
--
-- `import_id` ties a transaction to the import that produced it. Without it, a
-- statement imported twice cannot be told apart from one imported once, and a
-- bad import cannot be undone — you would be deleting rows by hand and hoping.
--
-- `counterparty_name` is who paid or was paid. It is on every bank statement
-- and is how a human recognises a line at all; matching a payment to an invoice
-- without it means matching on amount and date, which is a guess.
--
-- `source` on the import records the format or bank it came from, so a failed
-- parse can be traced to the shape it was given rather than to the file name.
ALTER TABLE zvd_bank_transactions ADD COLUMN IF NOT EXISTS import_id UUID;
ALTER TABLE zvd_bank_transactions ADD COLUMN IF NOT EXISTS counterparty_name TEXT;
ALTER TABLE zvd_bank_imports     ADD COLUMN IF NOT EXISTS source TEXT;

CREATE INDEX IF NOT EXISTS idx_zvd_bank_transactions_import
  ON zvd_bank_transactions (import_id) WHERE import_id IS NOT NULL;
