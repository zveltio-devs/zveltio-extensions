-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for content/media. Same pattern as
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

ALTER TABLE zv_media_ai_metadata ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_media_cdn_invalidations ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_media_collection_files ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_media_collections ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_media_favorites ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_media_file_tags ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_media_files ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_media_folders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_media_tags ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zv_media_ai_metadata ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_media_cdn_invalidations ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_media_collection_files ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_media_collections ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_media_favorites ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_media_file_tags ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_media_files ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_media_folders ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_media_tags ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zv_media_ai_metadata_tenant ON zv_media_ai_metadata (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_media_cdn_invalidations_tenant ON zv_media_cdn_invalidations (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_media_collection_files_tenant ON zv_media_collection_files (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_media_collections_tenant ON zv_media_collections (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_media_favorites_tenant ON zv_media_favorites (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_media_file_tags_tenant ON zv_media_file_tags (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_media_files_tenant ON zv_media_files (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_media_folders_tenant ON zv_media_folders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_media_tags_tenant ON zv_media_tags (tenant_id);

ALTER TABLE zv_media_ai_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_ai_metadata FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_media_cdn_invalidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_cdn_invalidations FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_media_collection_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_collection_files FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_media_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_collections FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_media_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_favorites FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_media_file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_file_tags FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_files FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_folders FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_media_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_tags FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zv_media_ai_metadata',
    'zv_media_cdn_invalidations',
    'zv_media_collection_files',
    'zv_media_collections',
    'zv_media_favorites',
    'zv_media_file_tags',
    'zv_media_files',
    'zv_media_folders',
    'zv_media_tags'
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
    'zv_media_ai_metadata',
    'zv_media_cdn_invalidations',
    'zv_media_collection_files',
    'zv_media_collections',
    'zv_media_favorites',
    'zv_media_file_tags',
    'zv_media_files',
    'zv_media_folders',
    'zv_media_tags'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[content/media tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zv_media_ai_metadata',
    'zv_media_cdn_invalidations',
    'zv_media_collection_files',
    'zv_media_collections',
    'zv_media_favorites',
    'zv_media_file_tags',
    'zv_media_files',
    'zv_media_folders',
    'zv_media_tags'
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
