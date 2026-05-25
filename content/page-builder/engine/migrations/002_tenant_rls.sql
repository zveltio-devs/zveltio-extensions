-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for content/page-builder. Same pattern as
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

ALTER TABLE zv_page_ab_variants ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_page_block_types ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_page_metrics ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_page_redirects ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_page_revisions ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_page_seo_scores ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_page_sitemap_config ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zv_page_ab_variants ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_page_block_types ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_page_metrics ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_page_redirects ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_page_revisions ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_page_seo_scores ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_page_sitemap_config ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_pages ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zv_page_ab_variants_tenant ON zv_page_ab_variants (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_page_block_types_tenant ON zv_page_block_types (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_page_metrics_tenant ON zv_page_metrics (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_page_redirects_tenant ON zv_page_redirects (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_page_revisions_tenant ON zv_page_revisions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_page_seo_scores_tenant ON zv_page_seo_scores (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_page_sitemap_config_tenant ON zv_page_sitemap_config (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_pages_tenant ON zv_pages (tenant_id);

ALTER TABLE zv_page_ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_page_ab_variants FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_page_block_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_page_block_types FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_page_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_page_metrics FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_page_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_page_redirects FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_page_revisions FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_page_seo_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_page_seo_scores FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_page_sitemap_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_page_sitemap_config FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_pages FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zv_page_ab_variants',
    'zv_page_block_types',
    'zv_page_metrics',
    'zv_page_redirects',
    'zv_page_revisions',
    'zv_page_seo_scores',
    'zv_page_sitemap_config',
    'zv_pages'
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
    'zv_page_ab_variants',
    'zv_page_block_types',
    'zv_page_metrics',
    'zv_page_redirects',
    'zv_page_revisions',
    'zv_page_seo_scores',
    'zv_page_sitemap_config',
    'zv_pages'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[content/page-builder tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zv_page_ab_variants',
    'zv_page_block_types',
    'zv_page_metrics',
    'zv_page_redirects',
    'zv_page_revisions',
    'zv_page_seo_scores',
    'zv_page_sitemap_config',
    'zv_pages'
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
