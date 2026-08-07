-- Add the columns this extension declares and the engine's table never had.
--
-- Both the engine (`001_initial.sql`) and this extension create
-- `zv_generated_docs`, and the engine's migrations run first. The extension's
-- `CREATE TABLE IF NOT EXISTS` is therefore a silent no-op, and the four
-- columns it adds on top of the engine's shape were never created on any
-- install. The extension's own code queries them.
--
-- The result was not subtle: `GET /ext/content/documents/share/:token` is a
-- DECLARED PUBLIC route, so an anonymous visitor got a 500 and
-- `column "output_format" does not exist` in the log. Two of the extension's
-- seven GET routes failed the same way. Shipped, and broken everywhere, since
-- the feature moved out of the engine.
--
-- Adopting the existing table rather than renaming it: the engine's columns
-- (`variables_data`, `html_content`) stay, because rows written before this may
-- be using them and nothing here can tell. `IF NOT EXISTS` throughout, so this
-- is a no-op on an install where the extension's own CREATE happened to win.

ALTER TABLE zv_generated_docs ADD COLUMN IF NOT EXISTS variables_used JSONB NOT NULL DEFAULT '{}';
ALTER TABLE zv_generated_docs ADD COLUMN IF NOT EXISTS output_format TEXT NOT NULL DEFAULT 'pdf';
ALTER TABLE zv_generated_docs ADD COLUMN IF NOT EXISTS file_key TEXT;
ALTER TABLE zv_generated_docs ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- The CHECK the extension's CREATE carries, applied separately so the column
-- add above stays idempotent on a table that already has it.
ALTER TABLE zv_generated_docs DROP CONSTRAINT IF EXISTS zv_generated_docs_output_format_check;
ALTER TABLE zv_generated_docs ADD CONSTRAINT zv_generated_docs_output_format_check
  CHECK (output_format IN ('pdf', 'html'));
