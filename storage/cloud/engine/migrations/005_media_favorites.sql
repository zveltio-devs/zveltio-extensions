-- Favorites are this extension's own table.
--
-- `/favorites` has always read and written `zv_media_favorites`, which
-- content/media 1.x created. content/media 2.0.0 declares its favorites as a
-- collection instead and no longer creates that table, so on an instance that
-- never ran media 1.x the routes answered 500 ("relation does not exist").
-- The definition is media 1.x's (001_initial + 002_tenant_rls); on an
-- instance where that table exists already every statement is a no-op.

CREATE TABLE IF NOT EXISTS zv_media_favorites (
  user_id TEXT NOT NULL,
  file_id UUID NOT NULL REFERENCES zv_media_files(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, file_id)
);

ALTER TABLE zv_media_favorites ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_media_favorites ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
CREATE INDEX IF NOT EXISTS idx_zv_media_favorites_tenant ON zv_media_favorites (tenant_id);

ALTER TABLE zv_media_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_media_favorites FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_zv_media_favorites ON zv_media_favorites;
CREATE POLICY tenant_isolation_zv_media_favorites ON zv_media_favorites
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));
