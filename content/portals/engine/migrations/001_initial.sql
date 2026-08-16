-- Zones, pages and views — the portal cluster, moved out of the engine.
--
-- These four tables were created by the engine's `001_initial.sql` back when a
-- portal was considered part of the platform. It is not: presenting data to an
-- audience is what extensions do here, the public web surface was already one,
-- and nothing in the engine or in the other 57 extensions consumed these.
--
-- ADOPTED, not recreated. CREATE TABLE ... IF NOT EXISTS, with the DDL exactly as
-- the engine wrote it, so an existing install keeps its zones and their rows and
-- this is a no-op; a fresh install gets them from here.
--
-- The engine's historical migrations are deliberately left untouched. Removing
-- the CREATEs from `001_initial.sql` would break `007_default_tenant` and
-- `017_zones_views_tenant_isolation`, which ALTER these tables unguarded, and
-- would print a checksum warning on every boot of every install that already
-- applied them. Migrations are history — you stop writing new ones against a
-- table, you do not rewrite the past. The engine still creates them on a fresh
-- install and no longer does anything with them; that residue clears at the next
-- baseline squash.

CREATE TABLE IF NOT EXISTS zvd_views (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        REFERENCES zv_tenants(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  description  TEXT,
  collection   TEXT        NOT NULL,
  view_type    TEXT        NOT NULL DEFAULT 'table'
                 CHECK (view_type IN ('table','kanban','calendar','gallery','stats','chart','list','timeline')),
  fields       JSONB       NOT NULL DEFAULT '[]',
  filters      JSONB       NOT NULL DEFAULT '[]',
  sort_field   TEXT,
  sort_dir     TEXT        DEFAULT 'desc' CHECK (sort_dir IN ('asc','desc')),
  page_size    INT         DEFAULT 20,
  config       JSONB       NOT NULL DEFAULT '{}',
  is_public    BOOLEAN     NOT NULL DEFAULT false,
  created_by   TEXT        REFERENCES "user"(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_views_collection ON zvd_views(collection);

CREATE TABLE IF NOT EXISTS zvd_zones (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID        REFERENCES zv_tenants(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  slug           TEXT        NOT NULL,
  description    TEXT,
  is_active      BOOLEAN     NOT NULL DEFAULT false,
  access_roles   TEXT[]      NOT NULL DEFAULT '{}',
  base_path      TEXT        NOT NULL,
  -- Per-zone branding
  site_name      TEXT,
  site_logo_url  TEXT,
  primary_color  TEXT        DEFAULT '#069494',
  secondary_color TEXT,
  custom_css     TEXT,
  nav_position   TEXT        DEFAULT 'sidebar' CHECK (nav_position IN ('sidebar','topbar','both')),
  show_breadcrumbs BOOLEAN   NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_zvd_zones_tenant ON zvd_zones(tenant_id);

CREATE TABLE IF NOT EXISTS zvd_pages (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID        REFERENCES zv_tenants(id) ON DELETE CASCADE,
  zone_id       UUID        NOT NULL REFERENCES zvd_zones(id) ON DELETE CASCADE,
  parent_id     UUID        REFERENCES zvd_pages(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  slug          TEXT        NOT NULL,
  icon          TEXT,
  description   TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  is_homepage   BOOLEAN     NOT NULL DEFAULT false,
  auth_required BOOLEAN     NOT NULL DEFAULT true,
  allowed_roles TEXT[]      NOT NULL DEFAULT '{}',
  sort_order    INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (zone_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_zvd_pages_tenant ON zvd_pages(tenant_id);

CREATE TABLE IF NOT EXISTS zvd_page_views (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id         UUID NOT NULL REFERENCES zvd_pages(id) ON DELETE CASCADE,
  view_id         UUID NOT NULL REFERENCES zvd_views(id) ON DELETE CASCADE,
  title_override  TEXT,
  col_span        INT  NOT NULL DEFAULT 12 CHECK (col_span BETWEEN 1 AND 12),
  sort_order      INT  NOT NULL DEFAULT 0,
  config_override JSONB NOT NULL DEFAULT '{}',
  UNIQUE (page_id, view_id)
);

CREATE INDEX IF NOT EXISTS idx_zvd_page_views_page ON zvd_page_views(page_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_zvd_page_views_view ON zvd_page_views(view_id);

-- The tenant default and RLS the engine applied in migrations 007 and 017,
-- restated so a fresh install that never runs them is still isolated.
-- Idempotent on an install that did.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['zvd_zones','zvd_pages','zvd_views','zvd_page_views'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = t AND column_name = 'tenant_id') THEN
      EXECUTE format(
        'ALTER TABLE %I ALTER COLUMN tenant_id SET DEFAULT '
        'COALESCE(NULLIF(current_setting(''zveltio.current_tenant'', true), '''')::uuid, '
        '''00000000-0000-0000-0000-000000000001''::uuid)', t);
      EXECUTE format(
        'UPDATE %I SET tenant_id = ''00000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL', t);
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I', t || '_tenant_isolation', t);
      EXECUTE format(
        'CREATE POLICY %I ON %I USING (zveltio_tenant_scope_ok(tenant_id)) '
        'WITH CHECK (zveltio_tenant_scope_ok(tenant_id))', t || '_tenant_isolation', t);
    END IF;
  END LOOP;
END
$$;

-- DOWN
-- The tables are NOT dropped. Uninstalling the extension that presents portals
-- is not a statement that the portals should be destroyed, and this DOWN runs on
-- `purgeData=true`. Releasing the policies hands them back intact.
DROP POLICY IF EXISTS zvd_page_views_tenant_isolation ON zvd_page_views;
DROP POLICY IF EXISTS zvd_views_tenant_isolation ON zvd_views;
DROP POLICY IF EXISTS zvd_pages_tenant_isolation ON zvd_pages;
DROP POLICY IF EXISTS zvd_zones_tenant_isolation ON zvd_zones;
