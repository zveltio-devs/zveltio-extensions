-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for operations/traceability. Same pattern as
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

ALTER TABLE trace_dispatches ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_locations ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_lot_consumptions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_lots ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_movements ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_production_orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_recalls ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_recipe_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_recipes ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE trace_suppliers ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE trace_dispatches ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_items ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_locations ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_lot_consumptions ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_lots ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_movements ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_production_orders ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_recalls ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_recipe_items ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_recipes ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE trace_suppliers ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_trace_dispatches_tenant ON trace_dispatches (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_items_tenant ON trace_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_locations_tenant ON trace_locations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_lot_consumptions_tenant ON trace_lot_consumptions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_lots_tenant ON trace_lots (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_movements_tenant ON trace_movements (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_production_orders_tenant ON trace_production_orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_recalls_tenant ON trace_recalls (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_recipe_items_tenant ON trace_recipe_items (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_recipes_tenant ON trace_recipes (tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_suppliers_tenant ON trace_suppliers (tenant_id);

ALTER TABLE trace_dispatches ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_dispatches FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_items FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_locations FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_lot_consumptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_lot_consumptions FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_lots FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_movements FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_production_orders FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_recalls FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_recipe_items FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_recipes FORCE  ROW LEVEL SECURITY;
ALTER TABLE trace_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trace_suppliers FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'trace_dispatches',
    'trace_items',
    'trace_locations',
    'trace_lot_consumptions',
    'trace_lots',
    'trace_movements',
    'trace_production_orders',
    'trace_recalls',
    'trace_recipe_items',
    'trace_recipes',
    'trace_suppliers'
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
    'trace_dispatches',
    'trace_items',
    'trace_locations',
    'trace_lot_consumptions',
    'trace_lots',
    'trace_movements',
    'trace_production_orders',
    'trace_recalls',
    'trace_recipe_items',
    'trace_recipes',
    'trace_suppliers'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[operations/traceability tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'trace_dispatches',
    'trace_items',
    'trace_locations',
    'trace_lot_consumptions',
    'trace_lots',
    'trace_movements',
    'trace_production_orders',
    'trace_recalls',
    'trace_recipe_items',
    'trace_recipes',
    'trace_suppliers'
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
