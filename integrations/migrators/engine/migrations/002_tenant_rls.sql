-- 002_tenant_rls.sql — integrations/migrators
-- Same tenant-RLS pattern as the repo template (crm PR #1).

ALTER TABLE zv_migrator_connections ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_migrator_runs        ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zv_migrator_connections ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_migrator_runs        ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zv_migrator_connections_tenant ON zv_migrator_connections (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_migrator_runs_tenant        ON zv_migrator_runs (tenant_id);

ALTER TABLE zv_migrator_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_migrator_connections FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_migrator_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_migrator_runs FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['zv_migrator_connections','zv_migrator_runs'];
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

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_zv_migrator_connections ON zv_migrator_connections;
DROP POLICY IF EXISTS tenant_isolation_zv_migrator_runs ON zv_migrator_runs;
DROP TABLE IF EXISTS zv_migrator_runs;
DROP TABLE IF EXISTS zv_migrator_connections;
