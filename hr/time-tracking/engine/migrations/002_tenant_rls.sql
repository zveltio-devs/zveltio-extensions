-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for hr/time-tracking. Same pattern as
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

ALTER TABLE zvd_active_timers ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_time_entries ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_time_entry_tag_map ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_time_entry_tags ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_time_projects ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_timesheets ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zvd_active_timers ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_time_entries ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_time_entry_tag_map ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_time_entry_tags ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_time_projects ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_timesheets ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zvd_active_timers_tenant ON zvd_active_timers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_time_entries_tenant ON zvd_time_entries (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_time_entry_tag_map_tenant ON zvd_time_entry_tag_map (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_time_entry_tags_tenant ON zvd_time_entry_tags (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_time_projects_tenant ON zvd_time_projects (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_timesheets_tenant ON zvd_timesheets (tenant_id);

ALTER TABLE zvd_active_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_active_timers FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_time_entries FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_time_entry_tag_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_time_entry_tag_map FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_time_entry_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_time_entry_tags FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_time_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_time_projects FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_timesheets FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_active_timers',
    'zvd_time_entries',
    'zvd_time_entry_tag_map',
    'zvd_time_entry_tags',
    'zvd_time_projects',
    'zvd_timesheets'
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
    'zvd_active_timers',
    'zvd_time_entries',
    'zvd_time_entry_tag_map',
    'zvd_time_entry_tags',
    'zvd_time_projects',
    'zvd_timesheets'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[hr/time-tracking tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zvd_active_timers',
    'zvd_time_entries',
    'zvd_time_entry_tag_map',
    'zvd_time_entry_tags',
    'zvd_time_projects',
    'zvd_timesheets'
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
