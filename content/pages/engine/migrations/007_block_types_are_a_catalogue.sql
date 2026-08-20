-- The block-type library is a catalogue, not company data.
--
-- `001_initial.sql` ran `zv_page_block_types` through the loop that gives every
-- page table a `tenant_id`, row-level security, and a
-- `zveltio_tenant_scope_ok(tenant_id)` policy — and then seeded all fourteen
-- rows against the DEFAULT tenant. Measured on a live database as the
-- `zveltio_rls` role a tenant request actually runs as:
--
--   politica: tenant_isolation_zv_page_block_types :: zveltio_tenant_scope_ok(tenant_id)
--   seed:     14 randuri, 1 firma
--   firma seed   -> 14
--   a doua firma ->  0
--
-- So the second company an instance ever creates opens the page builder with an
-- empty block library: `GET /block-types` returns `{"block_types": []}` and the
-- picker has nothing in it. Nobody saw it because a single-tenant install — every
-- test, every demo — only ever queries as the tenant the seed belongs to.
--
-- These rows say what a `hero` block is and which properties it takes. That is
-- the same answer for everyone, and the vocabulary they describe lives in
-- `client/block-types.ts`, in code, where `block-contract.test.ts` checks it. A
-- per-company copy of it was never a feature; it was the loop being applied one
-- table too far.
--
-- 001 no longer puts this table through that loop, so a fresh install never gets
-- here. This migration is for a database that already ran it.

-- Collapse any per-tenant duplicates before the unique key narrows. `ctid` is
-- arbitrary but stable within the statement, and the rows are identical apart
-- from the tenant they were seeded for.
DELETE FROM zv_page_block_types a
  USING zv_page_block_types b
  WHERE a.name = b.name AND a.ctid > b.ctid;

DROP POLICY IF EXISTS tenant_isolation_zv_page_block_types ON zv_page_block_types;
ALTER TABLE zv_page_block_types NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zv_page_block_types DISABLE ROW LEVEL SECURITY;

-- The column goes too, not just the policy. Leaving it would let the next
-- instance-wide RLS sweep put the policy back, and this is exactly how the
-- defect arrived: a generic rule applied to a table that is not what the rule is
-- about.
ALTER TABLE zv_page_block_types DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE zv_page_block_types DROP CONSTRAINT IF EXISTS zv_page_block_types_name_key;
ALTER TABLE zv_page_block_types ADD CONSTRAINT zv_page_block_types_name_key UNIQUE (name);

-- DOWN
-- Deliberately not reversed. Restoring the column would restore an empty library
-- for every company but the first, and the rows carry no information about which
-- tenant they "belonged" to that would be worth putting back — they were all
-- seeded against the same one.
