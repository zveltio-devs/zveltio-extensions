-- The SQL editor's own saved statements.
--
-- These were being written into `zv_saved_queries`, which is an ENGINE table:
-- the engine's saved-queries feature owns it and stores a `collection` plus a
-- `config` object, describing a query over a collection. The SQL editor saves
-- something different — raw SQL, with no collection and no config — and wrote a
-- `query` column that does not exist there.
--
-- The first fix attempted was to ALTER the engine's table from this extension.
-- The engine refused: "has a migration that alters or drops engine table(s)".
-- That guard is right, and the refusal is the useful kind — an extension
-- reshaping a table the engine owns is how two features end up fighting over
-- one row.
--
-- So the SQL editor gets its own table in its own namespace. Nothing is
-- migrated across: the column it wanted never existed, so there is no data to
-- move.
CREATE TABLE IF NOT EXISTS zv_developer_database_snippets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  query       TEXT NOT NULL,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zv_developer_database_snippets ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_developer_database_snippets ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
CREATE INDEX IF NOT EXISTS idx_zv_dev_db_snippets_tenant ON zv_developer_database_snippets (tenant_id);

ALTER TABLE zv_developer_database_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_developer_database_snippets FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_zv_developer_database_snippets ON zv_developer_database_snippets;
CREATE POLICY tenant_isolation_zv_developer_database_snippets ON zv_developer_database_snippets
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zveltio_rls') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON zv_developer_database_snippets TO zveltio_rls;
  END IF;
END $$;
