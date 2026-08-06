-- A user id does not fit in a uuid column.
--
-- `"user".id` is a 32-character nanoid, and it always was; these columns were
-- declared UUID because the name `created_by` reads like a foreign key to a
-- table whose primary key happens to be one. Postgres rejects the write with
-- 22P02 `invalid input syntax for type uuid`, so every route below returned 500
-- to every caller. Not a permission problem and not intermittent — the feature
-- simply never worked for anybody.
--
-- It survived review because nothing exercises these writes: the route tests
-- stub the database, and a reviewer reading either the SQL or the TypeScript
-- alone sees nothing wrong. The mismatch only exists between them.
--
-- The columns converted here are exactly those that receive `user.id` in this
-- extension's own INSERT and UPDATE statements, established by aligning each
-- statement's column list against its bound values. Naming was not enough to
-- decide it: `zvd_employees.manager_id` is also a UUID named like a person, and
-- it correctly references `zvd_employees(id)`, so it is left alone.
--
-- Converting uuid to text needs no USING clause and preserves any existing
-- values in their canonical 36-character form, so rows written by a god user —
-- whose id is a UUID on some installs — survive the change.

ALTER TABLE IF EXISTS zvd_bank_reconciliations ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE IF EXISTS zvd_bank_rules ALTER COLUMN created_by TYPE TEXT;
ALTER TABLE IF EXISTS zvd_cash_flow_entries ALTER COLUMN created_by TYPE TEXT;
