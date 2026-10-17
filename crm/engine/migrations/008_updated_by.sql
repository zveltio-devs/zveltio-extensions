-- The data API stamps `updated_by` on every create and update of a collection
-- record (`dynamicInsert` / `dynamicUpdate` system columns), and every table the
-- engine creates has it. CRM's tables were created by this extension without
-- it, so any data API write to `contacts`, `organizations` or `transactions` —
-- `POST /api/data/contacts`, and CRM's own routes once they write through
-- `ctx.internals.createRecord` — failed with 42703 (undefined column).
--
-- TEXT with no foreign key, like this extension's `created_by`.
ALTER TABLE zvd_contacts ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE zvd_organizations ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- DOWN
ALTER TABLE zvd_contacts DROP COLUMN IF EXISTS updated_by;
ALTER TABLE zvd_organizations DROP COLUMN IF EXISTS updated_by;
ALTER TABLE zvd_transactions DROP COLUMN IF EXISTS updated_by;
