-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for CRM. Same pattern as
-- ai/engine/migrations/009_embeddings_tenant_isolation.sql — that
-- file is the canonical template for the rollout described in
-- docs/AUDIT-2026-05-24.md §6.1.
--
-- WHY THIS IS THE FIRST EXTENSION TO BE MIGRATED
--   CRM holds the most identifiable PII in the system (contact
--   names, emails, organization tax ids, transaction totals). With
--   no `tenant_id` column on `zvd_contacts`, `zvd_organizations`,
--   `zvd_transactions`, `zvd_crm_activities`, … a user in tenant A
--   could list every other tenant's contacts via the existing
--   route handlers (which filter only on owner/created_by, not on
--   tenant). This migration closes that gap at the database layer
--   so even a future route that forgets to filter by tenant cannot
--   leak cross-tenant rows.
--
-- ROLLOUT PATTERN (copy this file when migrating the next extension)
--   1. Add a nullable `tenant_id UUID` column with a session-GUC
--      DEFAULT — so application code that runs inside the request's
--      tenant transaction picks up the right value without having
--      to know about the column.
--   2. Index `(tenant_id, <hot-filter-column>)` so per-tenant
--      queries don't scan the whole table.
--   3. ENABLE + FORCE ROW LEVEL SECURITY. FORCE matters: without
--      it, the engine connects as table owner and Postgres lets
--      the owner bypass policies → RLS becomes advisory.
--   4. Install a `tenant_isolation_<table>` policy that:
--        - In multi-tenant mode (GUC set), restricts to the row's
--          tenant_id matching the GUC.
--        - In single-tenant mode (no GUC), allows all NULL rows so
--          legacy data is still readable.
--   5. Loudly warn the operator if any pre-existing rows have
--      tenant_id IS NULL while the deployment has provisioned
--      tenants (cross-tenant exposure surface).
--
-- AFTER THIS MIGRATION RUNS
--   The CRM route handlers must use the per-request transaction
--   (`c.get('tenantTrx') ?? db`) for the policy's session GUC to
--   match. The companion route changes in this PR add an inline
--   `reqDb(c)` helper to crm/engine/routes.ts (mirrors the AI
--   extension's pattern); without it queries return zero rows in
--   multi-tenant deployments because the GUC is unset on the bare
--   pool's connection.

-- ── 1. Add tenant_id column with session-GUC DEFAULT ─────────────────────────

ALTER TABLE zvd_contacts                ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_organizations           ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_transactions            ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_crm_pipeline_stages     ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_crm_custom_fields       ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_crm_activities          ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_crm_email_sequences     ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_crm_lead_scores         ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_contact_organizations   ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- DEFAULT pulls from the per-transaction GUC so app code that does
-- `INSERT INTO zvd_contacts (first_name, ...)` inside the tenant
-- trx automatically tags the row with the active tenant.
ALTER TABLE zvd_contacts              ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_organizations         ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_transactions          ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_crm_pipeline_stages   ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_crm_custom_fields     ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_crm_activities        ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_crm_email_sequences   ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_crm_lead_scores       ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_contact_organizations ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

-- ── 2. Indexes for per-tenant filtering ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_zvd_contacts_tenant              ON zvd_contacts              (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_organizations_tenant         ON zvd_organizations         (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_transactions_tenant          ON zvd_transactions          (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_crm_pipeline_stages_tenant   ON zvd_crm_pipeline_stages   (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_crm_custom_fields_tenant     ON zvd_crm_custom_fields     (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_crm_activities_tenant        ON zvd_crm_activities        (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_crm_email_sequences_tenant   ON zvd_crm_email_sequences   (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_crm_lead_scores_tenant       ON zvd_crm_lead_scores       (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_contact_organizations_tenant ON zvd_contact_organizations (tenant_id);

-- ── 3. ENABLE + FORCE row level security ─────────────────────────────────────

ALTER TABLE zvd_contacts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_contacts              FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_organizations         FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_transactions          FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_pipeline_stages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_pipeline_stages   FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_custom_fields     ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_custom_fields     FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_activities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_activities        FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_email_sequences   ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_email_sequences   FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_lead_scores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_crm_lead_scores       FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_contact_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_contact_organizations FORCE ROW LEVEL SECURITY;

-- ── 4. Tenant isolation policies ─────────────────────────────────────────────
-- Pattern (per table):
--   USING / WITH CHECK accept the row iff
--     (a) no GUC is set → single-tenant mode → allow all NULL rows
--     (b) row tenant_id IS NULL  (legacy / unmigrated data — visible
--         in single-tenant only because (a) covers it)
--     (c) row tenant_id matches the GUC
-- DROP first so the migration is idempotent on re-run.

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_contacts',
    'zvd_organizations',
    'zvd_transactions',
    'zvd_crm_pipeline_stages',
    'zvd_crm_custom_fields',
    'zvd_crm_activities',
    'zvd_crm_email_sequences',
    'zvd_crm_lead_scores',
    'zvd_contact_organizations'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation_%I ON %I
      USING (
        NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
        OR tenant_id IS NULL
        OR tenant_id::text = current_setting('zveltio.current_tenant', true)
      )
      WITH CHECK (
        NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
        OR tenant_id IS NULL
        OR tenant_id::text = current_setting('zveltio.current_tenant', true)
      )
    $pol$, tbl, tbl);
  END LOOP;
END $$;

-- ── 5. Loud warning if multi-tenant deployment has NULL-tenant rows ──────────
-- See ai/engine/migrations/001_initial.sql for the same pattern; the
-- single tenant case (no rows in zv_tenants) stays silent.

DO $$
DECLARE
  has_tenants BOOLEAN;
  null_count BIGINT;
  rec RECORD;
BEGIN
  SELECT EXISTS(SELECT 1 FROM zv_tenants) INTO has_tenants;
  IF NOT has_tenants THEN RETURN; END IF;

  FOR rec IN
    SELECT unnest(ARRAY[
      'zvd_contacts',
      'zvd_organizations',
      'zvd_transactions',
      'zvd_crm_pipeline_stages',
      'zvd_crm_custom_fields',
      'zvd_crm_activities',
      'zvd_crm_email_sequences',
      'zvd_crm_lead_scores',
      'zvd_contact_organizations'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[crm tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
        'These rows are visible to ALL tenants. Backfill with: '
        'UPDATE % SET tenant_id = ''<correct-tenant-id>'' WHERE tenant_id IS NULL',
        null_count, rec.t, rec.t;
    END IF;
  END LOOP;
END $$;

-- DOWN
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_contacts',
    'zvd_organizations',
    'zvd_transactions',
    'zvd_crm_pipeline_stages',
    'zvd_crm_custom_fields',
    'zvd_crm_activities',
    'zvd_crm_email_sequences',
    'zvd_crm_lead_scores',
    'zvd_contact_organizations'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP INDEX IF EXISTS idx_%I_tenant', tbl);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS tenant_id', tbl);
  END LOOP;
END $$;
