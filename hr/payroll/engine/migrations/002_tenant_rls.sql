-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for hr/payroll. Same pattern as
-- crm/engine/migrations/002_tenant_rls.sql (PR #1). Payroll is one
-- of the most sensitive surfaces (salaries, CNP, sick leave) — no
-- tenant_id meant any tenant could enumerate every other tenant's
-- payroll entries through the existing route handlers.
--
-- For the rationale + per-step explanation, see CRM's 002_tenant_rls.sql.

ALTER TABLE zvd_payroll_periods         ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_payroll_entries         ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_payroll_adjustments     ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_payroll_sick_leave      ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_payroll_meal_vouchers   ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_payroll_overtime        ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_payroll_exports         ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zvd_payroll_periods       ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_payroll_entries       ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_payroll_adjustments   ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_payroll_sick_leave    ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_payroll_meal_vouchers ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_payroll_overtime      ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_payroll_exports       ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zvd_payroll_periods_tenant       ON zvd_payroll_periods       (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_payroll_entries_tenant       ON zvd_payroll_entries       (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_payroll_adjustments_tenant   ON zvd_payroll_adjustments   (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_payroll_sick_leave_tenant    ON zvd_payroll_sick_leave    (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_payroll_meal_vouchers_tenant ON zvd_payroll_meal_vouchers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_payroll_overtime_tenant      ON zvd_payroll_overtime      (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_payroll_exports_tenant       ON zvd_payroll_exports       (tenant_id, generated_at DESC);

ALTER TABLE zvd_payroll_periods       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_periods       FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_entries       FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_adjustments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_adjustments   FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_sick_leave    ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_sick_leave    FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_meal_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_meal_vouchers FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_overtime      ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_overtime      FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_exports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_payroll_exports       FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_payroll_periods',
    'zvd_payroll_entries',
    'zvd_payroll_adjustments',
    'zvd_payroll_sick_leave',
    'zvd_payroll_meal_vouchers',
    'zvd_payroll_overtime',
    'zvd_payroll_exports'
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
      'zvd_payroll_periods',
      'zvd_payroll_entries',
      'zvd_payroll_adjustments',
      'zvd_payroll_sick_leave',
      'zvd_payroll_meal_vouchers',
      'zvd_payroll_overtime',
      'zvd_payroll_exports'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[hr/payroll tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zvd_payroll_periods',
    'zvd_payroll_entries',
    'zvd_payroll_adjustments',
    'zvd_payroll_sick_leave',
    'zvd_payroll_meal_vouchers',
    'zvd_payroll_overtime',
    'zvd_payroll_exports'
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
