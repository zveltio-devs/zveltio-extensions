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

-- zvd_product_variants: sku is unique per company, not per instance.
UPDATE zvd_product_variants SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_product_variants DROP CONSTRAINT IF EXISTS zvd_product_variants_sku_key;
ALTER TABLE zvd_product_variants ADD CONSTRAINT zvd_product_variants_sku_key UNIQUE (tenant_id, sku);

-- zvd_products: sku is unique per company, not per instance.
UPDATE zvd_products SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_products DROP CONSTRAINT IF EXISTS zvd_products_sku_key;
ALTER TABLE zvd_products ADD CONSTRAINT zvd_products_sku_key UNIQUE (tenant_id, sku);

-- zvd_purchase_orders: number is unique per company, not per instance.
UPDATE zvd_purchase_orders SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_purchase_orders DROP CONSTRAINT IF EXISTS zvd_purchase_orders_number_key;
ALTER TABLE zvd_purchase_orders ADD CONSTRAINT zvd_purchase_orders_number_key UNIQUE (tenant_id, number);
