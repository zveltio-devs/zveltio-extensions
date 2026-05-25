-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for finance/expenses. Same pattern as
-- crm/engine/migrations/002_tenant_rls.sql (PR #1 template).
-- See docs/AUDIT-2026-05-24.md §6.1 for the rationale; this file is
-- the result of the mechanical rollout across all remaining extensions.
--
-- Pattern:
--   1. ADD COLUMN tenant_id UUID with session-GUC DEFAULT so app code
--      writes inside the tenant transaction tag rows automatically.
--   2. (tenant_id) index per table.
--   3. ENABLE + FORCE ROW LEVEL SECURITY. FORCE matters: without it
--      the engine connects as table owner and Postgres lets the owner
--      bypass policies → RLS becomes advisory.
--   4. tenant_isolation_<table> policy: USING/WITH CHECK accepts the
--      row iff (a) GUC unset → single-tenant fallback, (b) row
--      tenant_id IS NULL (legacy data, single-tenant only), or
--      (c) row tenant_id matches the GUC.
--   5. RAISE WARNING per table on pre-existing NULL-tenant_id rows
--      when the deployment has provisioned tenants.

ALTER TABLE zvd_expense_reimbursements ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_expense_reports ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_expenses ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_mileage_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_per_diem_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zvd_expense_reimbursements ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_expense_reports ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_expenses ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_mileage_entries ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_per_diem_entries ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zvd_expense_reimbursements_tenant ON zvd_expense_reimbursements (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_expense_reports_tenant ON zvd_expense_reports (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_expenses_tenant ON zvd_expenses (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_mileage_entries_tenant ON zvd_mileage_entries (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_per_diem_entries_tenant ON zvd_per_diem_entries (tenant_id);

ALTER TABLE zvd_expense_reimbursements ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_expense_reimbursements FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_expense_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_expense_reports FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_expenses FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_mileage_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_mileage_entries FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_per_diem_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_per_diem_entries FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_expense_reimbursements',
    'zvd_expense_reports',
    'zvd_expenses',
    'zvd_mileage_entries',
    'zvd_per_diem_entries'
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
    'zvd_expense_reimbursements',
    'zvd_expense_reports',
    'zvd_expenses',
    'zvd_mileage_entries',
    'zvd_per_diem_entries'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[finance/expenses tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zvd_expense_reimbursements',
    'zvd_expense_reports',
    'zvd_expenses',
    'zvd_mileage_entries',
    'zvd_per_diem_entries'
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
