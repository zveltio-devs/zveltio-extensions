-- The import fingerprint has to be unique per company, not per instance.
--
-- `import_hash` has carried `TEXT UNIQUE` since 001, and both import routes end
-- `ON CONFLICT DO NOTHING` — so re-import protection reads as implemented. It
-- has never run: neither INSERT supplied the column, and PostgreSQL does not
-- treat two NULLs as equal, so every row conflicted with nothing. Importing the
-- same statement twice inserted every transaction again and added the file's
-- whole delta to the account balance a second time.
--
-- The routes now write the fingerprint, which makes the constraint live for the
-- first time — and that is precisely when its scope starts to matter. Left as it
-- is, two companies on one instance importing the same statement (a shared
-- supplier, the same bank export format, the same amounts on the same day) would
-- collide: the second company's row is refused because of a row it cannot see
-- under RLS, and it gets a database error about data that is not its own.
--
-- This is the same class the tenant-unique-keys campaign widened across 60 keys.
-- Widening is strictly more permissive — every dataset valid under the narrow
-- key stays valid under the wider one — so it cannot fail on an existing
-- installation.

UPDATE zvd_bank_transactions
  SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
  WHERE tenant_id IS NULL;

ALTER TABLE zvd_bank_transactions DROP CONSTRAINT IF EXISTS zvd_bank_transactions_import_hash_key;
ALTER TABLE zvd_bank_transactions
  ADD CONSTRAINT zvd_bank_transactions_import_hash_key UNIQUE (tenant_id, import_hash);

-- DOWN
ALTER TABLE zvd_bank_transactions DROP CONSTRAINT IF EXISTS zvd_bank_transactions_import_hash_key;
ALTER TABLE zvd_bank_transactions ADD CONSTRAINT zvd_bank_transactions_import_hash_key UNIQUE (import_hash);
