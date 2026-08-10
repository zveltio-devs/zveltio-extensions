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

-- zvd_ec_categories: slug is unique per company, not per instance.
UPDATE zvd_ec_categories SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_ec_categories DROP CONSTRAINT IF EXISTS zvd_ec_categories_slug_key;
ALTER TABLE zvd_ec_categories ADD CONSTRAINT zvd_ec_categories_slug_key UNIQUE (tenant_id, slug);

-- zvd_ec_coupons: code is unique per company, not per instance.
UPDATE zvd_ec_coupons SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_ec_coupons DROP CONSTRAINT IF EXISTS zvd_ec_coupons_code_key;
ALTER TABLE zvd_ec_coupons ADD CONSTRAINT zvd_ec_coupons_code_key UNIQUE (tenant_id, code);

-- zvd_ec_customers: email is unique per company, not per instance.
UPDATE zvd_ec_customers SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_ec_customers DROP CONSTRAINT IF EXISTS zvd_ec_customers_email_key;
ALTER TABLE zvd_ec_customers ADD CONSTRAINT zvd_ec_customers_email_key UNIQUE (tenant_id, email);

-- zvd_ec_orders: order_number is unique per company, not per instance.
UPDATE zvd_ec_orders SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_ec_orders DROP CONSTRAINT IF EXISTS zvd_ec_orders_order_number_key;
ALTER TABLE zvd_ec_orders ADD CONSTRAINT zvd_ec_orders_order_number_key UNIQUE (tenant_id, order_number);

-- zvd_ec_product_variants: sku is unique per company, not per instance.
UPDATE zvd_ec_product_variants SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_ec_product_variants DROP CONSTRAINT IF EXISTS zvd_ec_product_variants_sku_key;
ALTER TABLE zvd_ec_product_variants ADD CONSTRAINT zvd_ec_product_variants_sku_key UNIQUE (tenant_id, sku);

-- zvd_ec_products: slug is unique per company, not per instance.
UPDATE zvd_ec_products SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_ec_products DROP CONSTRAINT IF EXISTS zvd_ec_products_slug_key;
ALTER TABLE zvd_ec_products ADD CONSTRAINT zvd_ec_products_slug_key UNIQUE (tenant_id, slug);

-- zvd_ec_products: sku is unique per company, not per instance.
UPDATE zvd_ec_products SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_ec_products DROP CONSTRAINT IF EXISTS zvd_ec_products_sku_key;
ALTER TABLE zvd_ec_products ADD CONSTRAINT zvd_ec_products_sku_key UNIQUE (tenant_id, sku);

-- zvd_ec_tax_rules: country + region + applies_to is unique per company, not per instance.
UPDATE zvd_ec_tax_rules SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_ec_tax_rules DROP CONSTRAINT IF EXISTS zvd_ec_tax_rules_country_region_applies_to_key;
ALTER TABLE zvd_ec_tax_rules ADD CONSTRAINT zvd_ec_tax_rules_country_region_applies_to_key UNIQUE (tenant_id, country, region, applies_to);
