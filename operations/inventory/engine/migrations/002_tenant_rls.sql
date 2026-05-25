-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for operations/inventory. Same pattern as
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

ALTER TABLE zvd_product_batches ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_product_variants ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_products ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_purchase_order_lines ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_purchase_orders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_stock_levels ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_stock_movements ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_suppliers ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_warehouses ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zvd_product_batches ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_product_variants ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_products ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_purchase_order_lines ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_purchase_orders ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_stock_levels ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_stock_movements ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_suppliers ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_warehouses ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zvd_product_batches_tenant ON zvd_product_batches (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_product_variants_tenant ON zvd_product_variants (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_products_tenant ON zvd_products (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_purchase_order_lines_tenant ON zvd_purchase_order_lines (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_purchase_orders_tenant ON zvd_purchase_orders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_stock_levels_tenant ON zvd_stock_levels (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_stock_movements_tenant ON zvd_stock_movements (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_suppliers_tenant ON zvd_suppliers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_warehouses_tenant ON zvd_warehouses (tenant_id);

ALTER TABLE zvd_product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_product_batches FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_product_variants FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_products FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_purchase_order_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_purchase_order_lines FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_purchase_orders FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_stock_levels FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_stock_movements FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_suppliers FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_warehouses FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_product_batches',
    'zvd_product_variants',
    'zvd_products',
    'zvd_purchase_order_lines',
    'zvd_purchase_orders',
    'zvd_stock_levels',
    'zvd_stock_movements',
    'zvd_suppliers',
    'zvd_warehouses'
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
    'zvd_product_batches',
    'zvd_product_variants',
    'zvd_products',
    'zvd_purchase_order_lines',
    'zvd_purchase_orders',
    'zvd_stock_levels',
    'zvd_stock_movements',
    'zvd_suppliers',
    'zvd_warehouses'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[operations/inventory tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zvd_product_batches',
    'zvd_product_variants',
    'zvd_products',
    'zvd_purchase_order_lines',
    'zvd_purchase_orders',
    'zvd_stock_levels',
    'zvd_stock_movements',
    'zvd_suppliers',
    'zvd_warehouses'
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
