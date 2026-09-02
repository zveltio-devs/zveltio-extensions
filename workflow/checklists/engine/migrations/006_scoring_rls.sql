-- 006_scoring_rls.sql
--
-- Tenant isolation for the three scoring tables. `004_scoring_schemes.sql`
-- created them with `tenant_id NOT NULL DEFAULT <GUC>`, indexed them, and
-- granted them to `zveltio_rls` — and then never enabled row level security or
-- wrote a policy. Everything except the part that enforces anything.
--
-- ── Five things could have caught this. None did. ───────────────
--
-- 1. `002_tenant_rls.sql` enumerates a FIXED list of five tables. Nothing
--    connects it to 004, so new tables land outside it silently.
--
-- 2. The ENGINE's `004_tenancy_hierarchy.sql` actually names all three of these
--    tables and applies RLS to them — and it is a no-op here, every time:
--
--        FOREACH t IN ARRAY ARRAY['zv_checklist_scoring_schemes', ...]
--          CONTINUE WHEN to_regclass('public.' || t) IS NULL;
--
--    Extension migrations run AFTER the engine's. On a fresh install the tables
--    do not exist yet when that block runs, so all three are skipped — and
--    nothing runs it again. The fix was written, from the wrong side of an
--    ordering it could not see. `zv_record_comments` and `zv_saved_queries` sit
--    in the same ARRAY and ARE protected, because they are engine tables that
--    already existed. Same code, opposite outcome, decided by load order.
--
-- 3. `reconcileExtensionTenantRLS` adopts, by construction, only tables that
--    already declare a `tenant_isolation_*` policy — `pg_policies WHERE
--    policyname LIKE 'tenant\_isolation\_%'`. A table that never had one is
--    invisible to it. The safety net has the same blind spot as the thing it
--    was meant to catch.
--
-- 4. `check-tenant-boundary` classifies these as tenant-scoped and reports
--    "OK — 333 tenant-scoped". It never asks whether a tenant-scoped table has
--    a policy, so it counted all three as protected while they were not.
--
-- 5. The classification document listed them under "goes into a migration".
--    The migration was never written; two of the five in that group were done
--    and these three were not.
--
-- ── What this was, measured ─────────────────────────────────────
--
-- Not theoretical. Run as `zveltio_rls` with firm B's GUC set — exactly what a
-- request does:
--
--     parent (zv_checklist_templates, protected)   → 0 rows
--     child  (zv_checklist_scoring_schemes)        → "Schema secreta a firmei A"
--     UPDATE on that same row                      → UPDATE 1
--
-- So firm B could read firm A's confidential scoring scheme AND write over it.
-- Five routes were reachable this way, not one: GET
-- /templates/:id/scoring-schemes reads by a URL parameter without going through
-- the protected parent, and PATCH, DELETE and the weights PUT all look the
-- scheme up by id IN THE UNPROTECTED TABLE, so their "not found" guard could
-- never fire for a foreign row. `GET /:id/scores` reads scores the same way.
--
-- The twin routes are the tell: POST on the same path looks up
-- `zv_checklist_templates` first — protected — and 404s on a foreign id. One of
-- two identical-looking routes had the guard. That is an omission, not a design.
--
-- Fixing it in the routes would mean five guards that must each stay correct.
-- The policy makes the database refuse, which is where the other five tables of
-- this extension already have it.

ALTER TABLE zv_checklist_scoring_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scoring_schemes FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scheme_weights  ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scheme_weights  FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scores          FORCE  ROW LEVEL SECURITY;

-- FORCE matters and is not decoration: the engine connects as the tables' owner,
-- and without FORCE Postgres lets an owner past its own policies, which would
-- make every line above advisory.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'zv_checklist_scoring_schemes',
    'zv_checklist_scheme_weights',
    'zv_checklist_scores'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation_%I ON %I
      USING (zveltio_tenant_scope_ok(tenant_id))
      WITH CHECK (zveltio_tenant_scope_ok(tenant_id))
    $pol$, tbl, tbl);
  END LOOP;
END $$;

-- Same predicate as the five tables 002 covered, so the three join the set
-- rather than becoming a second, slightly different rule. `zveltio_tenant_scope_ok`
-- is the engine's own function: it matches the current tenant, and falls back to
-- the default tenant when no tenant context is set, which is what keeps
-- single-tenant installs and contextless jobs working.

-- No backfill is needed. 004 created all three columns `NOT NULL DEFAULT
-- COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
-- '…0001'::uuid)`, so every row already carries a tenant — rows written before
-- multi-tenancy carry the default one. Verified in the catalog rather than
-- assumed: `attnotnull` is true on all three.
--
-- This is why there is no `RAISE WARNING` block here, unlike 002: that one
-- added the column to existing tables and had to warn about rows predating it.

-- DOWN

DROP POLICY IF EXISTS tenant_isolation_zv_checklist_scoring_schemes ON zv_checklist_scoring_schemes;
DROP POLICY IF EXISTS tenant_isolation_zv_checklist_scheme_weights  ON zv_checklist_scheme_weights;
DROP POLICY IF EXISTS tenant_isolation_zv_checklist_scores          ON zv_checklist_scores;
ALTER TABLE zv_checklist_scoring_schemes NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scoring_schemes DISABLE ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scheme_weights  NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scheme_weights  DISABLE ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scores          NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zv_checklist_scores          DISABLE ROW LEVEL SECURITY;
