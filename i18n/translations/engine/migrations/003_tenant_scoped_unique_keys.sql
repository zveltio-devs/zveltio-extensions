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
--
-- The foreign key has to move with the key it points at. `zvd_translations.locale`
-- REFERENCES zvd_locales(code), and once `code` alone stops being unique that
-- reference cannot stand -- Postgres refuses to drop the primary key while it
-- does, which is how this surfaced.
--
-- It surfaced only now because until the engine stopped creating these two
-- tables, its shape won: the engine declared `locale TEXT NOT NULL` with no
-- foreign key at all, so this extension's `CREATE TABLE IF NOT EXISTS` was a
-- no-op and the constraint written in its own 001 never existed on any
-- database. The engine's 001 no longer creates them, so this extension's schema
-- applies for the first time -- and this migration was written against the
-- shape it is now replacing.
--
-- Re-created per tenant rather than dropped: a locale belongs to one company,
-- so a translation must reference the locale OF ITS OWN company. Dropped and
-- restored around the key swap because the order is forced.
ALTER TABLE zvd_translations DROP CONSTRAINT IF EXISTS zvd_translations_locale_fkey;

UPDATE zvd_locales SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_locales ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE zvd_locales DROP CONSTRAINT IF EXISTS zvd_locales_pkey;
ALTER TABLE zvd_locales ADD CONSTRAINT zvd_locales_pkey PRIMARY KEY (tenant_id, code);

-- NOT VALID on purpose: this reference has never been enforced on a live
-- database (see above), so rows written while it was absent may not satisfy it.
-- Validating here would fail the migration on data the product itself wrote.
-- New writes are bound from this point; a later migration can VALIDATE once
-- there is a reason to believe the backlog is clean.
UPDATE zvd_translations SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_translations
  ADD CONSTRAINT zvd_translations_locale_fkey
  FOREIGN KEY (tenant_id, locale) REFERENCES zvd_locales (tenant_id, code) ON DELETE CASCADE
  NOT VALID;

-- zvd_translation_glossary: term + locale is unique per company, not per instance.
UPDATE zvd_translation_glossary SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_translation_glossary DROP CONSTRAINT IF EXISTS zvd_translation_glossary_term_locale_key;
ALTER TABLE zvd_translation_glossary ADD CONSTRAINT zvd_translation_glossary_term_locale_key UNIQUE (tenant_id, term, locale);

-- zvd_translation_keys is NOT here, and that has stopped being right — see 004.
--
-- What this said, and what was true when it was written: the engine creates that
-- table in its own 001_initial.sql, gives it tenant_id there, and serves it from
-- `routes/translations.ts`. It was the host's table, so the widened key shipped
-- as engine migration 036 and this file did not reach across into it.
--
-- None of that holds now. The engine's fifteen `/api/translations` routes were
-- deleted as duplicates of this extension's, and its 001_initial.sql no longer
-- creates the table. The widening left with it, so 004 brings it back here,
-- where the table now lives.
--
-- The three above are a different case: the engine creates them WITHOUT
-- tenant_id, and this extension's 002_tenant_rls.sql is what makes them
-- multi-tenant. The constraint only becomes wrong once that happens, so it is
-- repaired here, next to the migration that caused it.

-- zvd_translation_memory: source_text + locale is unique per company, not per instance.
UPDATE zvd_translation_memory SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zvd_translation_memory DROP CONSTRAINT IF EXISTS zvd_translation_memory_source_text_locale_key;
ALTER TABLE zvd_translation_memory ADD CONSTRAINT zvd_translation_memory_source_text_locale_key UNIQUE (tenant_id, source_text, locale);
