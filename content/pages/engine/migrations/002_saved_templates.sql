-- Saved templates — a block, or a whole page's worth of blocks, kept by name.
--
-- A separate migration rather than an edit to 001, because 001 is already
-- applied wherever this extension was installed today: editing it would change a
-- file the runner has recorded a checksum for, and the warning it prints never
-- goes away. New schema ships as a new file, always.
--
-- What this buys: building ten pages instead of building one page ten times. It
-- is the cheapest of the remaining gaps against Elementor and the one an author
-- asks for first, right after they have laid out a section they like.

CREATE TABLE IF NOT EXISTS zv_page_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID,
  name        TEXT NOT NULL,
  description TEXT,
  -- 'block' is one block with everything nested inside it; 'page' is a whole
  -- page's block list. The editor inserts the first and replaces with the second.
  kind        TEXT NOT NULL DEFAULT 'block' CHECK (kind IN ('block', 'page')),
  -- Always an ARRAY, even for a single block, so the insert path has one shape.
  blocks      JSONB NOT NULL DEFAULT '[]',
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zv_page_templates
  ALTER COLUMN tenant_id SET DEFAULT
    COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
             '00000000-0000-0000-0000-000000000001'::uuid);

UPDATE zv_page_templates SET tenant_id = '00000000-0000-0000-0000-000000000001'
  WHERE tenant_id IS NULL;

-- A name is unique per company, not per instance — the lesson of the 61 unique
-- keys written before multi-tenancy existed.
CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_page_templates_name
  ON zv_page_templates (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_zv_page_templates_tenant
  ON zv_page_templates (tenant_id, kind);

ALTER TABLE zv_page_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_page_templates FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_zv_page_templates ON zv_page_templates;
CREATE POLICY tenant_isolation_zv_page_templates ON zv_page_templates
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- DOWN
-- Templates are the operator's work, not the extension's bookkeeping, so the
-- table is left in place for the same reason the pages are — uninstalling the
-- thing that presents them is not a statement that they should be destroyed.
DROP POLICY IF EXISTS tenant_isolation_zv_page_templates ON zv_page_templates;
