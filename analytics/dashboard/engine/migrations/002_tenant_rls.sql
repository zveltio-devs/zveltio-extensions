-- 002_tenant_rls.sql — analytics/dashboard
--
-- Multi-tenant isolation. Same pattern as analytics/quality's 002_tenant_rls.sql
-- (PR #1 template): tenant_id with session-GUC DEFAULT, index, ENABLE + FORCE
-- RLS, and a tenant_isolation policy that falls back to single-tenant when the
-- GUC is unset. FORCE matters — without it the owner connection bypasses RLS.

ALTER TABLE zv_dashboard_layouts ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zv_dashboard_layouts
  ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zv_dashboard_layouts_tenant
  ON zv_dashboard_layouts (tenant_id);

-- Uniqueness per (scope, owner) within a tenant. Two partial indexes so the
-- single-tenant case (tenant_id IS NULL) is also deduplicated correctly.
CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_dashboard_layouts_single
  ON zv_dashboard_layouts (scope, owner) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_dashboard_layouts_tenant
  ON zv_dashboard_layouts (tenant_id, scope, owner) WHERE tenant_id IS NOT NULL;

ALTER TABLE zv_dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_dashboard_layouts FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zv_dashboard_layouts ON zv_dashboard_layouts;
CREATE POLICY tenant_isolation_zv_dashboard_layouts ON zv_dashboard_layouts
  USING (
    NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
    OR tenant_id IS NULL
    OR tenant_id::text = current_setting('zveltio.current_tenant', true)
  )
  WITH CHECK (
    NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
    OR tenant_id IS NULL
    OR tenant_id::text = current_setting('zveltio.current_tenant', true)
  );

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_zv_dashboard_layouts ON zv_dashboard_layouts;
ALTER TABLE zv_dashboard_layouts NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zv_dashboard_layouts DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS uq_zv_dashboard_layouts_single;
DROP INDEX IF EXISTS uq_zv_dashboard_layouts_tenant;
DROP INDEX IF EXISTS idx_zv_dashboard_layouts_tenant;
ALTER TABLE zv_dashboard_layouts DROP COLUMN IF EXISTS tenant_id;
