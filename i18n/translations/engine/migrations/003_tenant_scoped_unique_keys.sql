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

-- zvd_locales: code is unique per company, not per instance.
UPDATE zvd_locales SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_locales ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE zvd_locales DROP CONSTRAINT IF EXISTS zvd_locales_pkey;
ALTER TABLE zvd_locales ADD CONSTRAINT zvd_locales_pkey PRIMARY KEY (tenant_id, code);

-- zvd_translation_glossary: term + locale is unique per company, not per instance.
UPDATE zvd_translation_glossary SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_translation_glossary DROP CONSTRAINT IF EXISTS zvd_translation_glossary_term_locale_key;
ALTER TABLE zvd_translation_glossary ADD CONSTRAINT zvd_translation_glossary_term_locale_key UNIQUE (tenant_id, term, locale);

-- zvd_translation_keys is NOT here, on purpose.
--
-- The engine creates that table in its own 001_initial.sql, gives it tenant_id
-- there, and serves it from `routes/translations.ts` — the host translates its
-- own interface whether or not this extension is installed. It is the host's
-- table, so the widened key ships as engine migration 036 and this file does not
-- reach across into it.
--
-- The three above are a different case: the engine creates them WITHOUT
-- tenant_id, and this extension's 002_tenant_rls.sql is what makes them
-- multi-tenant. The constraint only becomes wrong once that happens, so it is
-- repaired here, next to the migration that caused it.

-- zvd_translation_memory: source_text + locale is unique per company, not per instance.
UPDATE zvd_translation_memory SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_translation_memory DROP CONSTRAINT IF EXISTS zvd_translation_memory_source_text_locale_key;
ALTER TABLE zvd_translation_memory ADD CONSTRAINT zvd_translation_memory_source_text_locale_key UNIQUE (tenant_id, source_text, locale);
