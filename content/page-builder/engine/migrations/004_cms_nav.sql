-- 004_cms_nav.sql — public site navigation menus.
--
-- One row per named menu (e.g. 'main', 'footer'). `items` is the ordered list
-- the public host renders: [{ label, slug?, url?, external? }] — `slug` links
-- to a zv_pages slug, `url` to an arbitrary (external) address.

CREATE TABLE IF NOT EXISTS zv_page_menus (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key   TEXT NOT NULL,
  items      JSONB NOT NULL DEFAULT '[]',
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Same tenant-RLS pattern as 002_tenant_rls.sql.
ALTER TABLE zv_page_menus ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_page_menus
  ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zv_page_menus_tenant ON zv_page_menus (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_page_menus_single
  ON zv_page_menus (menu_key) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_page_menus_tenant
  ON zv_page_menus (tenant_id, menu_key) WHERE tenant_id IS NOT NULL;

ALTER TABLE zv_page_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_page_menus FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zv_page_menus ON zv_page_menus;
CREATE POLICY tenant_isolation_zv_page_menus ON zv_page_menus
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
DROP POLICY IF EXISTS tenant_isolation_zv_page_menus ON zv_page_menus;
DROP TABLE IF EXISTS zv_page_menus;
