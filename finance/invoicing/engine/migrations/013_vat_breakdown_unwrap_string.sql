-- Recover invoice VAT breakdowns that were stored as JSON string scalars.
--
-- Invoice creation bound `JSON.stringify(vatBreakdown)` with a single `::jsonb`
-- cast, and the recurring-invoice copy bound the JS array itself. Under Bun.SQL,
-- the engine's driver, both store a jsonb STRING whose text is the array
-- (measured 2026-10-02, Bun 1.3.14). The PDF/e-Factura reader tolerated it with
-- `typeof === 'string' ? JSON.parse : ...`, but any SQL over vat_breakdown saw
-- a string. The routes now write `::text::jsonb`; this unwraps existing rows.
--
-- A per-row loop, not one UPDATE, for the reason analytics/dashboard 003
-- records: Postgres does not guarantee the guard runs before the cast, so a
-- single string that is not JSON would abort the whole statement. Only text
-- that parses to an array is touched; anything else is left for someone to look at.
--
-- ROW LEVEL SECURITY. zvd_invoices is FORCE RLS (002), and the engine runs
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
      ('zvd_invoices', 'vat_breakdown', 'array')) AS v(tbl, col, shape)
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
      RAISE NOTICE 'finance/invoicing 013: recovered % %.% value(s) stored as a JSON string.', recovered, t.tbl, t.col;
    END IF;
    IF skipped > 0 THEN
      RAISE WARNING 'finance/invoicing 013: % %.% value(s) hold a string that is not a JSON %; left untouched.', skipped, t.tbl, t.col, t.shape;
    END IF;
  END LOOP;
END $$;

-- DOWN
-- Not reversed: re-wrapping recovered values as strings would re-break them,
-- and nothing tells a recovered row from one written correctly afterwards.
SELECT 1;
