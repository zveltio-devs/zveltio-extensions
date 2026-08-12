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

-- zv_ai_features: feature_key is unique per company, not per instance.
UPDATE zv_ai_features SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zv_ai_features DROP CONSTRAINT IF EXISTS zv_ai_features_feature_key_key;
ALTER TABLE zv_ai_features ADD CONSTRAINT zv_ai_features_feature_key_key UNIQUE (tenant_id, feature_key);

-- zv_ai_providers: name is unique per company, not per instance.
UPDATE zv_ai_providers SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zv_ai_providers DROP CONSTRAINT IF EXISTS zv_ai_providers_name_key;
ALTER TABLE zv_ai_providers ADD CONSTRAINT zv_ai_providers_name_key UNIQUE (tenant_id, name);

-- zvd_ai_search_config: collection + namespace is unique per company, not per instance.
UPDATE zvd_ai_search_config SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_ai_search_config DROP CONSTRAINT IF EXISTS zvd_ai_search_config_collection_namespace_key;
ALTER TABLE zvd_ai_search_config ADD CONSTRAINT zvd_ai_search_config_collection_namespace_key UNIQUE (tenant_id, collection, namespace);
