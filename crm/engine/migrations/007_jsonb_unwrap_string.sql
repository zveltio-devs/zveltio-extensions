-- Recover CRM jsonb values that were stored as JSON string scalars.
--
-- Every CRM write of `metadata` and `line_items` bound `JSON.stringify(x)` into
-- a jsonb column — with a single `::jsonb` cast on INSERT, with no cast at all
-- on UPDATE. Under Bun.SQL, which is what the engine runs, the driver types
-- that string parameter as json either way, so the column held a STRING whose
-- text is the JSON (measured 2026-10-02 against Bun 1.3.14):
--
--   jsonb_typeof(metadata) = 'string'      "{\"source\":\"import\"}"
--
-- so `metadata->>'x'` returned NULL and `jsonb_array_length(line_items)` raised.
-- The routes now write `::text::jsonb`; this unwraps the rows already written.
--
-- A per-row loop, not one UPDATE, for the reason analytics/dashboard 003
-- records: Postgres does not guarantee the guard runs before the cast, so a
-- single string that is not JSON would abort the whole statement. Only text
-- that parses to the shape the route accepts (object for metadata, array for
-- line_items) is touched; anything else is left for someone to look at.
--
-- ROW LEVEL SECURITY. These tables are FORCE RLS (002), and the engine runs
-- extension migrations on its own connection, which owns the tables but need
-- not be a superuser. Without a tenant GUC the policy shows such a role only
-- the rows with no tenant, so the loop would have repaired those and silently
-- skipped every tenant's data. Where the role does not bypass RLS, FORCE is
-- lifted for the loop and restored after it. The engine runs this file inside
-- the migration chain's transaction, so a failure cannot leave it lifted.
--
-- Idempotent; a no-op where no row is of type `string`.

DO $$
DECLARE
  t         RECORD;
  r         RECORD;
  parsed    JSONB;
  recovered BIGINT;
  skipped   BIGINT;
  bypass    BOOLEAN;
  forced    BOOLEAN;
BEGIN
  SELECT rolsuper OR rolbypassrls INTO bypass FROM pg_roles WHERE rolname = current_user;
  FOR t IN SELECT * FROM (VALUES
      ('zvd_contacts', 'metadata', 'object'),
      ('zvd_organizations', 'metadata', 'object'),
      ('zvd_transactions', 'metadata', 'object'),
      ('zvd_transactions', 'line_items', 'array')) AS v(tbl, col, shape)
  LOOP
    recovered := 0;
    skipped := 0;
    SELECT relforcerowsecurity INTO forced FROM pg_class WHERE oid = t.tbl::regclass;
    IF forced AND NOT bypass THEN
      EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', t.tbl);
    END IF;
    FOR r IN EXECUTE format(
        'SELECT id, %I #>> ''{}'' AS txt FROM %I WHERE jsonb_typeof(%I) = ''string''',
        t.col, t.tbl, t.col)
    LOOP
      BEGIN
        parsed := r.txt::jsonb;
      EXCEPTION WHEN others THEN
        skipped := skipped + 1;
        CONTINUE;
      END;
      IF jsonb_typeof(parsed) = t.shape THEN
        EXECUTE format('UPDATE %I SET %I = $1 WHERE id = $2', t.tbl, t.col) USING parsed, r.id;
        recovered := recovered + 1;
      ELSE
        skipped := skipped + 1;
      END IF;
    END LOOP;
    IF forced AND NOT bypass THEN
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t.tbl);
    END IF;
    IF recovered > 0 THEN
      RAISE NOTICE 'crm 007: recovered % %.% value(s) stored as a JSON string.', recovered, t.tbl, t.col;
    END IF;
    IF skipped > 0 THEN
      RAISE WARNING 'crm 007: % %.% value(s) hold a string that is not a JSON %; left untouched.', skipped, t.tbl, t.col, t.shape;
    END IF;
  END LOOP;
END $$;

-- DOWN
-- Not reversed: re-wrapping recovered values as strings would re-break them,
-- and nothing tells a recovered row from one written correctly afterwards.
SELECT 1;
