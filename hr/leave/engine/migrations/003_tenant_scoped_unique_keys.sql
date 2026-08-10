-- Unique keys that predate multi-tenancy.
--
-- These constraints were written when one company per instance was the whole
-- story. `tenant_id` and row-level security arrived later and the keys were
-- never widened, so on a shared instance the second company is refused a value
-- the first one already used — its own invoice number, its own product code,
-- its own fiscal year.
--
-- Verified on a live instance before writing this: company A inserts invoice
-- FACT-2026-0001, company B inserts the same number and gets
--
--   ERROR: duplicate key value violates unique constraint "zvd_invoices_number_key"
--
-- and because RLS hides the conflicting row, company B sees a database error
-- about a row it cannot see and cannot resolve.
--
-- Widening a unique key is strictly more permissive: every dataset valid under
-- the narrow key stays valid under the wider one, so this cannot fail on an
-- existing installation. Rows predating the column are backfilled to the
-- default tenant, which is where they came from.

-- zvd_leave_types: code is unique per company, not per instance.
UPDATE zvd_leave_types SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_leave_types DROP CONSTRAINT IF EXISTS zvd_leave_types_code_key;
ALTER TABLE zvd_leave_types ADD CONSTRAINT zvd_leave_types_code_key UNIQUE (tenant_id, code);

-- zvd_public_holidays: date is unique per company, not per instance.
UPDATE zvd_public_holidays SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_public_holidays DROP CONSTRAINT IF EXISTS zvd_public_holidays_date_key;
ALTER TABLE zvd_public_holidays ADD CONSTRAINT zvd_public_holidays_date_key UNIQUE (tenant_id, date);
