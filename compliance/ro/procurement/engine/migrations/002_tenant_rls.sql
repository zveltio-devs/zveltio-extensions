-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for compliance/ro/procurement. Same pattern as
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

ALTER TABLE zv_ro_budget_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ro_contracts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ro_purchase_orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ro_reception_notes ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ro_supplier_evaluations ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ro_suppliers ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zv_ro_budget_lines ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_ro_contracts ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_ro_purchase_orders ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_ro_reception_notes ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_ro_supplier_evaluations ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_ro_suppliers ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zv_ro_budget_lines_tenant ON zv_ro_budget_lines (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_ro_contracts_tenant ON zv_ro_contracts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_ro_purchase_orders_tenant ON zv_ro_purchase_orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_ro_reception_notes_tenant ON zv_ro_reception_notes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_ro_supplier_evaluations_tenant ON zv_ro_supplier_evaluations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_ro_suppliers_tenant ON zv_ro_suppliers (tenant_id);

ALTER TABLE zv_ro_budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_ro_budget_lines FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_ro_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_ro_contracts FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_ro_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_ro_purchase_orders FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_ro_reception_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_ro_reception_notes FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_ro_supplier_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_ro_supplier_evaluations FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_ro_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_ro_suppliers FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zv_ro_budget_lines',
    'zv_ro_contracts',
    'zv_ro_purchase_orders',
    'zv_ro_reception_notes',
    'zv_ro_supplier_evaluations',
    'zv_ro_suppliers'
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
    'zv_ro_budget_lines',
    'zv_ro_contracts',
    'zv_ro_purchase_orders',
    'zv_ro_reception_notes',
    'zv_ro_supplier_evaluations',
    'zv_ro_suppliers'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[compliance/ro/procurement tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zv_ro_budget_lines',
    'zv_ro_contracts',
    'zv_ro_purchase_orders',
    'zv_ro_reception_notes',
    'zv_ro_supplier_evaluations',
    'zv_ro_suppliers'
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
