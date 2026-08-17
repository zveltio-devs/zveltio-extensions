-- JSON that was stored as text, stored as JSON.
--
-- `JSON.stringify(value)` bound as a parameter puts a JSON **string scalar** in
-- a jsonb column, not the value: `jsonb_typeof` says `string`. A single
-- `::jsonb` cast on that parameter changes nothing. Only `::text::jsonb` makes
-- the driver hand Postgres text to parse. Measured on a live database before
-- writing this — see `engine/jsonb.ts`.
--
-- Every reader in this extension does `typeof x === 'string' ? JSON.parse(x) : x`,
-- so the pages rendered correctly and the defect stayed invisible. It surfaces
-- the moment SQL treats the column as structured: appending to a popup's
-- `targets` with `jsonb ||` produced an ARRAY containing the old text, because
-- the old value WAS text. An index, a `->>`, or any future migration would have
-- met the same wall.
--
-- The writes are fixed. This converts what is already stored.
--
-- Idempotent by construction: it only touches rows where `jsonb_typeof` is
-- `string`, and a converted row is no longer one. Rows that were always correct
-- are left alone.

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('zv_pages',          'blocks'),
      ('zv_pages',          'meta'),
      ('zv_pages',          'popup_config'),
      ('zv_page_revisions', 'blocks'),
      ('zv_page_revisions', 'meta'),
      ('zv_page_ab_variants','blocks'),
      ('zv_page_seo_scores','issues'),
      ('zv_page_menus',     'items'),
      ('zv_page_templates', 'blocks'),
      ('zv_page_block_types','schema'),
      ('zv_page_block_types','default_props')
    ) AS v(tbl, col)
  LOOP
    IF to_regclass('public.' || t.tbl) IS NULL THEN CONTINUE; END IF;

    -- `#>> '{}'` extracts a JSON string scalar as plain text, which is exactly
    -- the JSON document that was wrapped. Feeding it back through ::jsonb parses
    -- it. A value that is not a string scalar is skipped by the WHERE.
    EXECUTE format(
      'UPDATE %I SET %I = (%I #>> ''{}'')::jsonb '
      'WHERE jsonb_typeof(%I) = ''string'' '
      -- Guard against a column that genuinely holds a JSON string: only convert
      -- when the text parses as an object or an array.
      'AND left(btrim(%I #>> ''{}''), 1) IN (''{'', ''['')',
      t.tbl, t.col, t.col, t.col, t.col);
  END LOOP;
END
$$;

-- DOWN
-- Nothing. Turning correct JSON back into text would be undoing a repair, and
-- every reader already handles both shapes, so there is nothing to restore.
