-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for storage/cloud. Same pattern as
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

ALTER TABLE zv_cloud_access_logs ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_cloud_file_versions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_cloud_retention_policies ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_cloud_shares ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_cloud_trash ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_storage_quotas ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zv_cloud_access_logs ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_cloud_file_versions ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_cloud_retention_policies ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_cloud_shares ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_cloud_trash ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_storage_quotas ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zv_cloud_access_logs_tenant ON zv_cloud_access_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_cloud_file_versions_tenant ON zv_cloud_file_versions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_cloud_retention_policies_tenant ON zv_cloud_retention_policies (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_cloud_shares_tenant ON zv_cloud_shares (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_cloud_trash_tenant ON zv_cloud_trash (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_storage_quotas_tenant ON zv_storage_quotas (tenant_id);

ALTER TABLE zv_cloud_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_cloud_access_logs FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_cloud_file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_cloud_file_versions FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_cloud_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_cloud_retention_policies FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_cloud_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_cloud_shares FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_cloud_trash ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_cloud_trash FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_storage_quotas FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zv_cloud_access_logs',
    'zv_cloud_file_versions',
    'zv_cloud_retention_policies',
    'zv_cloud_shares',
    'zv_cloud_trash',
    'zv_storage_quotas'
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
    'zv_cloud_access_logs',
    'zv_cloud_file_versions',
    'zv_cloud_retention_policies',
    'zv_cloud_shares',
    'zv_cloud_trash',
    'zv_storage_quotas'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[storage/cloud tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zv_cloud_access_logs',
    'zv_cloud_file_versions',
    'zv_cloud_retention_policies',
    'zv_cloud_shares',
    'zv_cloud_trash',
    'zv_storage_quotas'
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
