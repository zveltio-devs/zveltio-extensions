-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for compliance/ro/efactura. Same pattern as
-- crm/engine/migrations/002_tenant_rls.sql (PR #1). e-Factura is the
-- RO legal-compliance surface: invoices submitted to ANAF (the
-- national tax authority) under a CUI (company tax id). Cross-tenant
-- leakage here would expose another company's submitted invoices,
-- their ANAF correlation ids and the storno (cancellation) audit
-- trail.
--
-- For the rationale + per-step explanation, see CRM's 002_tenant_rls.sql.

ALTER TABLE zv_efactura_invoices     ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_efactura_status_log   ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_efactura_storno       ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_efactura_daily_stats  ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zv_efactura_invoices    ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_efactura_status_log  ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_efactura_storno      ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_efactura_daily_stats ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zv_efactura_invoices_tenant    ON zv_efactura_invoices    (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zv_efactura_status_log_tenant  ON zv_efactura_status_log  (tenant_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_zv_efactura_storno_tenant      ON zv_efactura_storno      (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zv_efactura_daily_stats_tenant ON zv_efactura_daily_stats (tenant_id, date DESC);

ALTER TABLE zv_efactura_invoices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_efactura_invoices    FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_efactura_status_log  ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_efactura_status_log  FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_efactura_storno      ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_efactura_storno      FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_efactura_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_efactura_daily_stats FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zv_efactura_invoices',
    'zv_efactura_status_log',
    'zv_efactura_storno',
    'zv_efactura_daily_stats'
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
      'zv_efactura_invoices',
      'zv_efactura_status_log',
      'zv_efactura_storno',
      'zv_efactura_daily_stats'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[compliance/ro/efactura tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zv_efactura_invoices',
    'zv_efactura_status_log',
    'zv_efactura_storno',
    'zv_efactura_daily_stats'
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
