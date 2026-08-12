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

-- zv_ro_budget_lines: code is unique per company, not per instance.
UPDATE zv_ro_budget_lines SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zv_ro_budget_lines DROP CONSTRAINT IF EXISTS zv_ro_budget_lines_code_key;
ALTER TABLE zv_ro_budget_lines ADD CONSTRAINT zv_ro_budget_lines_code_key UNIQUE (tenant_id, code);

-- zv_ro_contracts: number is unique per company, not per instance.
UPDATE zv_ro_contracts SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zv_ro_contracts DROP CONSTRAINT IF EXISTS zv_ro_contracts_number_key;
ALTER TABLE zv_ro_contracts ADD CONSTRAINT zv_ro_contracts_number_key UNIQUE (tenant_id, number);

-- zv_ro_purchase_orders: number is unique per company, not per instance.
UPDATE zv_ro_purchase_orders SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zv_ro_purchase_orders DROP CONSTRAINT IF EXISTS zv_ro_purchase_orders_number_key;
ALTER TABLE zv_ro_purchase_orders ADD CONSTRAINT zv_ro_purchase_orders_number_key UNIQUE (tenant_id, number);

-- zv_ro_reception_notes: number is unique per company, not per instance.
UPDATE zv_ro_reception_notes SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zv_ro_reception_notes DROP CONSTRAINT IF EXISTS zv_ro_reception_notes_number_key;
ALTER TABLE zv_ro_reception_notes ADD CONSTRAINT zv_ro_reception_notes_number_key UNIQUE (tenant_id, number);

-- zv_ro_suppliers: cui is unique per company, not per instance.
UPDATE zv_ro_suppliers SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zv_ro_suppliers DROP CONSTRAINT IF EXISTS zv_ro_suppliers_cui_key;
ALTER TABLE zv_ro_suppliers ADD CONSTRAINT zv_ro_suppliers_cui_key UNIQUE (tenant_id, cui);
