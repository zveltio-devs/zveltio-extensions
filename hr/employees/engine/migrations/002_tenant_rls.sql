-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for hr/employees. Same pattern as
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

ALTER TABLE zvd_departments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_employee_benefits ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_employee_documents ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_employee_emergency_contacts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_employees ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_job_positions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_onboarding_tasks ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_performance_cycles ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_performance_reviews ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_salary_history ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zvd_departments ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_employee_benefits ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_employee_documents ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_employee_emergency_contacts ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_employees ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_job_positions ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_onboarding_tasks ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_performance_cycles ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_performance_reviews ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_salary_history ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zvd_departments_tenant ON zvd_departments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_employee_benefits_tenant ON zvd_employee_benefits (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_employee_documents_tenant ON zvd_employee_documents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_employee_emergency_contacts_tenant ON zvd_employee_emergency_contacts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_employees_tenant ON zvd_employees (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_job_positions_tenant ON zvd_job_positions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_onboarding_tasks_tenant ON zvd_onboarding_tasks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_performance_cycles_tenant ON zvd_performance_cycles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_performance_reviews_tenant ON zvd_performance_reviews (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_salary_history_tenant ON zvd_salary_history (tenant_id);

ALTER TABLE zvd_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_departments FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_employee_benefits FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_employee_documents FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_employee_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_employee_emergency_contacts FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_employees FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_job_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_job_positions FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_onboarding_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_onboarding_tasks FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_performance_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_performance_cycles FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_performance_reviews FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_salary_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_salary_history FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_departments',
    'zvd_employee_benefits',
    'zvd_employee_documents',
    'zvd_employee_emergency_contacts',
    'zvd_employees',
    'zvd_job_positions',
    'zvd_onboarding_tasks',
    'zvd_performance_cycles',
    'zvd_performance_reviews',
    'zvd_salary_history'
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
    'zvd_departments',
    'zvd_employee_benefits',
    'zvd_employee_documents',
    'zvd_employee_emergency_contacts',
    'zvd_employees',
    'zvd_job_positions',
    'zvd_onboarding_tasks',
    'zvd_performance_cycles',
    'zvd_performance_reviews',
    'zvd_salary_history'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[hr/employees tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zvd_departments',
    'zvd_employee_benefits',
    'zvd_employee_documents',
    'zvd_employee_emergency_contacts',
    'zvd_employees',
    'zvd_job_positions',
    'zvd_onboarding_tasks',
    'zvd_performance_cycles',
    'zvd_performance_reviews',
    'zvd_salary_history'
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
