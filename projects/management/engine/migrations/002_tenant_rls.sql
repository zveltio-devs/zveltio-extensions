-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for projects/management. Same pattern as
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

ALTER TABLE zvd_milestones ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_project_custom_fields ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_project_members ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_projects ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_subtasks ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_task_attachments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_task_comments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_task_custom_values ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_task_dependencies ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_tasks ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zvd_milestones ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_project_custom_fields ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_project_members ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_projects ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_subtasks ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_task_attachments ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_task_comments ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_task_custom_values ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_task_dependencies ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_tasks ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zvd_milestones_tenant ON zvd_milestones (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_project_custom_fields_tenant ON zvd_project_custom_fields (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_project_members_tenant ON zvd_project_members (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_projects_tenant ON zvd_projects (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_subtasks_tenant ON zvd_subtasks (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_task_attachments_tenant ON zvd_task_attachments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_task_comments_tenant ON zvd_task_comments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_task_custom_values_tenant ON zvd_task_custom_values (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_task_dependencies_tenant ON zvd_task_dependencies (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_tasks_tenant ON zvd_tasks (tenant_id);

ALTER TABLE zvd_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_milestones FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_project_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_project_custom_fields FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_project_members FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_projects FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_subtasks FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_task_attachments FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_task_comments FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_task_custom_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_task_custom_values FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_task_dependencies FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_tasks FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_milestones',
    'zvd_project_custom_fields',
    'zvd_project_members',
    'zvd_projects',
    'zvd_subtasks',
    'zvd_task_attachments',
    'zvd_task_comments',
    'zvd_task_custom_values',
    'zvd_task_dependencies',
    'zvd_tasks'
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
    'zvd_milestones',
    'zvd_project_custom_fields',
    'zvd_project_members',
    'zvd_projects',
    'zvd_subtasks',
    'zvd_task_attachments',
    'zvd_task_comments',
    'zvd_task_custom_values',
    'zvd_task_dependencies',
    'zvd_tasks'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[projects/management tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
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
    'zvd_milestones',
    'zvd_project_custom_fields',
    'zvd_project_members',
    'zvd_projects',
    'zvd_subtasks',
    'zvd_task_attachments',
    'zvd_task_comments',
    'zvd_task_custom_values',
    'zvd_task_dependencies',
    'zvd_tasks'
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
