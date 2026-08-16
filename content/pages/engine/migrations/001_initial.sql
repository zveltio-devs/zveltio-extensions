-- content/pages — one page model for the public site and the authenticated portal.
--
-- This extension replaces `content/page-builder` and `content/portals`, which
-- were two halves of the same product: page-builder had blocks, SEO, revisions
-- and no access control; portals had sites, branding and roles but a page could
-- hold nothing except a saved view. The only real overlap was one idea —
-- "show rows of a collection, filtered and sorted" — spelled `collection_list`
-- on one side and a view on the other.
--
-- So: a PAGE is made of BLOCKS, a block is content or data, pages belong to a
-- SITE, and a site carries the base path, the branding and the access rules.
-- Views disappear as a concept.
--
-- ADOPTION, NOT RECREATION. Both predecessors have installed bases with customer
-- rows. Every CREATE is `IF NOT EXISTS` with the DDL exactly as it was written,
-- every ALTER is additive, and the data migration is idempotent and reversible
-- by inspection. Nothing is dropped and nothing is rebuilt.
--
-- Direction of travel: `zv_pages` survives and absorbs. It already had the block
-- model, the revisions, the SEO and the metrics; the portal side contributed the
-- site, the access rules and the layout. Migrating the richer model into the
-- poorer one would have meant reimplementing six features to keep them.

-- ── 1. Adopt the page-builder tables ────────────────────────────────────────
--
-- Verbatim from `content/page-builder/engine/migrations/001_initial.sql`, so a
-- fresh install gets them from here and an existing one sees a no-op. `zv_pages`
-- itself is also created by the engine's own `001_initial.sql` (migration 020's
-- CMS pages); that copy is residue to clear at the next baseline squash, not
-- something to fix here — see the note in the portals handoff about rewriting
-- applied migrations.

CREATE TABLE IF NOT EXISTS zv_pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'draft',
  template    TEXT NOT NULL DEFAULT 'default',
  blocks      JSONB NOT NULL DEFAULT '[]',
  meta        JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_by  TEXT,
  updated_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'default';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS blocks JSONB NOT NULL DEFAULT '[]';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS updated_by TEXT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'ro';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS is_noindex BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS reading_time_minutes INT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS canonical_page_id UUID REFERENCES zv_pages(id) ON DELETE SET NULL;

-- A user id is a 32-character nanoid, not a uuid. The engine's copy of the table
-- declares these TEXT; page-builder's declared them UUID and repaired it in its
-- own 006. Restated so a fresh install from this file is correct on day one.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'zv_pages' AND column_name = 'created_by' AND data_type = 'uuid') THEN
    ALTER TABLE zv_pages ALTER COLUMN created_by TYPE TEXT;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'zv_pages' AND column_name = 'updated_by' AND data_type = 'uuid') THEN
    ALTER TABLE zv_pages ALTER COLUMN updated_by TYPE TEXT;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS zv_page_block_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,
  schema       JSONB NOT NULL DEFAULT '{}',
  default_props JSONB NOT NULL DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_page_revisions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id    UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE,
  blocks     JSONB NOT NULL,
  meta       JSONB NOT NULL DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_page_seo_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE,
  overall_score INT NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  title_score INT NOT NULL DEFAULT 0,
  meta_description_score INT NOT NULL DEFAULT 0,
  heading_score INT NOT NULL DEFAULT 0,
  image_alt_score INT NOT NULL DEFAULT 0,
  issues JSONB NOT NULL DEFAULT '[]',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_page_ab_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  traffic_pct INT NOT NULL DEFAULT 50 CHECK (traffic_pct BETWEEN 1 AND 99),
  is_active BOOLEAN NOT NULL DEFAULT true,
  views INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_page_metrics (
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  avg_time_on_page_seconds INT NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (page_id, date)
);

CREATE TABLE IF NOT EXISTS zv_page_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT NOT NULL,
  to_path TEXT NOT NULL,
  redirect_type INT NOT NULL DEFAULT 301 CHECK (redirect_type IN (301, 302)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  hit_count INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_page_sitemap_config (
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE UNIQUE,
  include_in_sitemap BOOLEAN NOT NULL DEFAULT true,
  change_freq TEXT NOT NULL DEFAULT 'weekly' CHECK (change_freq IN ('always','hourly','daily','weekly','monthly','yearly','never')),
  priority NUMERIC(2,1) NOT NULL DEFAULT 0.5 CHECK (priority BETWEEN 0 AND 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_page_menus (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_key   TEXT NOT NULL,
  items      JSONB NOT NULL DEFAULT '[]',
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON zv_pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON zv_pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_locale ON zv_pages(locale, status);
CREATE INDEX IF NOT EXISTS idx_page_revisions_page ON zv_page_revisions(page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_redirects_active ON zv_page_redirects(from_path) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_page_metrics_date ON zv_page_metrics(date DESC);

-- ── 2. Sites ────────────────────────────────────────────────────────────────
--
-- Was `zvd_zones`. A site owns a base path, its navigation, its branding and the
-- roles that may enter. `is_public` is the one genuinely new column and it is
-- the distinction the merge creates: a public marketing site and an
-- authenticated client portal are now the same object with one flag different.

CREATE TABLE IF NOT EXISTS zv_page_sites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL,
  description      TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT false,
  -- A public site serves anonymous visitors; access_roles must be empty for one.
  is_public        BOOLEAN NOT NULL DEFAULT false,
  access_roles     TEXT[] NOT NULL DEFAULT '{}',
  -- Collections this site may render to an ANONYMOUS visitor, named one by one.
  --
  -- Default empty means default deny, and that is the point. A `collection_list`
  -- block on a public page used to run whatever query its author wrote, with no
  -- permission check of any kind: the block named a table and the render path
  -- read it. Proved by execution on 2026-08-16 — an unauthenticated GET of a
  -- published page returned the whole `user` table, every account on the
  -- instance across every tenant, because `user` carries no tenant_id and no
  -- RLS. Credentials themselves held (migration 044 revoked `session`,
  -- `account`, `verification` and `twoFactor` from `zveltio_rls`), but nothing
  -- else did.
  --
  -- The authenticated portal path never had this hole: it called `checkAccess`
  -- and resolved the table as `zvd_<collection>`. Anonymous requests have no
  -- user for `checkAccess` to judge, so a public site needs a positive,
  -- operator-written list instead. Deliberately NOT reusing
  -- `zvd_collections.route_group`: that column is decorative today (a badge in
  -- the collections list, enforced nowhere), and giving it authorisation meaning
  -- would expose data on any install that set it for its own reasons.
  public_collections TEXT[] NOT NULL DEFAULT '{}',
  base_path        TEXT NOT NULL,
  site_name        TEXT,
  site_logo_url    TEXT,
  primary_color    TEXT DEFAULT '#069494',
  secondary_color  TEXT,
  custom_css       TEXT,
  nav_position     TEXT DEFAULT 'sidebar' CHECK (nav_position IN ('sidebar','topbar','both')),
  show_breadcrumbs BOOLEAN NOT NULL DEFAULT true,
  -- Provenance for the zone this site came from. Also what makes the data
  -- migration below idempotent: re-running it finds the row already here.
  legacy_zone_id   UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zv_page_sites_tenant ON zv_page_sites(tenant_id);

-- ── 3. Pages gain what a portal page had ────────────────────────────────────

ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES zv_page_sites(id) ON DELETE CASCADE;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES zv_pages(id) ON DELETE SET NULL;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS is_homepage BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS auth_required BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS legacy_zone_page_id UUID;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS layout TEXT NOT NULL DEFAULT 'default';

CREATE INDEX IF NOT EXISTS idx_zv_pages_site ON zv_pages(site_id, sort_order);

-- ── 4. Tenant defaults and RLS on everything this extension owns ────────────

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'zv_pages','zv_page_sites','zv_page_block_types','zv_page_revisions',
    'zv_page_seo_scores','zv_page_ab_variants','zv_page_metrics',
    'zv_page_redirects','zv_page_sitemap_config','zv_page_menus'
  ] LOOP
    IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS tenant_id UUID', t);
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN tenant_id SET DEFAULT '
      'COALESCE(NULLIF(current_setting(''zveltio.current_tenant'', true), '''')::uuid, '
      '''00000000-0000-0000-0000-000000000001''::uuid)', t);
    EXECUTE format(
      'UPDATE %I SET tenant_id = ''00000000-0000-0000-0000-000000000001'' WHERE tenant_id IS NULL', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'tenant_isolation_' || t, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (zveltio_tenant_scope_ok(tenant_id)) '
      'WITH CHECK (zveltio_tenant_scope_ok(tenant_id))', 'tenant_isolation_' || t, t);
  END LOOP;
END
$$;

-- ── 5. Unique keys that predate both multi-tenancy AND sites ────────────────
--
-- `zv_pages.slug` carried THREE overlapping unique objects, and page-builder's
-- 005 only widened one of them:
--
--   * `zv_pages_slug_key`   — the constraint from page-builder's own CREATE.
--     005 widened this to (tenant_id, slug).
--   * `idx_zv_pages_slug`   — a UNIQUE INDEX the ENGINE creates in its
--     001_initial.sql. A different object with a different name, so 005's
--     DROP CONSTRAINT never touched it, and on any install where the engine
--     created the table first this one is the one actually in force. Slug stayed
--     globally unique across every tenant, which is the bug 005 was written to
--     fix and did not.
--   * `idx_zv_pages_homepage` — UNIQUE on (is_homepage) WHERE is_homepage, i.e.
--     ONE homepage per INSTANCE. Fine when there was one CMS; wrong the moment
--     a second site exists, and wrong for a second tenant either way.
--
-- With sites, the correct key is (tenant_id, site_id, slug): two sites may both
-- have `/contact`, and two tenants may both have both sites.
DROP INDEX IF EXISTS idx_zv_pages_slug;
DROP INDEX IF EXISTS idx_zv_pages_homepage;
ALTER TABLE zv_pages DROP CONSTRAINT IF EXISTS zv_pages_slug_key;

-- site_id is NULL for a page that predates sites; `NULLS NOT DISTINCT` keeps the
-- key meaningful for those rows instead of letting duplicates through.
CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_pages_site_slug
  ON zv_pages (tenant_id, site_id, slug) NULLS NOT DISTINCT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_pages_site_homepage
  ON zv_pages (tenant_id, site_id) NULLS NOT DISTINCT WHERE is_homepage = true;

UPDATE zv_page_block_types SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zv_page_block_types DROP CONSTRAINT IF EXISTS zv_page_block_types_name_key;
ALTER TABLE zv_page_block_types ADD CONSTRAINT zv_page_block_types_name_key UNIQUE (tenant_id, name);

UPDATE zv_page_redirects SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
ALTER TABLE zv_page_redirects DROP CONSTRAINT IF EXISTS zv_page_redirects_from_path_key;
ALTER TABLE zv_page_redirects ADD CONSTRAINT zv_page_redirects_from_path_key UNIQUE (tenant_id, from_path);

CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_page_menus_tenant ON zv_page_menus (tenant_id, menu_key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_page_sites_tenant_slug ON zv_page_sites (tenant_id, slug);

-- ── 6. Seed the block type library ──────────────────────────────────────────
--
-- `collection_list` joins the library here. It was a block type page-builder
-- rendered but never listed, so it could not be added from the block picker —
-- the only way to get one was to write the JSON by hand.

INSERT INTO zv_page_block_types (name, display_name, description, icon, schema, default_props, tenant_id) VALUES
  ('hero', 'Hero', 'Full-width hero section with heading and CTA', 'Image', '{"title": "string", "subtitle": "string", "image_url": "string", "cta_text": "string", "cta_url": "string", "align": "string"}', '{"title": "Welcome", "subtitle": "", "align": "center", "cta_text": "Get Started", "cta_url": "/"}', '00000000-0000-0000-0000-000000000001'),
  ('richtext', 'Rich Text', 'WYSIWYG text content block', 'Type', '{"content": "string"}', '{"content": "<p>Start writing...</p>"}', '00000000-0000-0000-0000-000000000001'),
  ('image', 'Image', 'Single image with caption', 'ImageIcon', '{"url": "string", "alt": "string", "caption": "string", "width": "string"}', '{"url": "", "alt": "", "caption": "", "width": "100%"}', '00000000-0000-0000-0000-000000000001'),
  ('container', 'Container', 'Holds other blocks side by side', 'Columns', '{"children": "array", "gap": "string"}', '{"children": [], "gap": "md"}', '00000000-0000-0000-0000-000000000001'),
  ('cta', 'Call to Action', 'Highlighted call-to-action section', 'Megaphone', '{"heading": "string", "text": "string", "button_text": "string", "button_url": "string", "style": "string"}', '{"heading": "Ready to get started?", "text": "", "button_text": "Contact Us", "button_url": "/contact", "style": "primary"}', '00000000-0000-0000-0000-000000000001'),
  ('embed', 'Embed', 'Arbitrary HTML or iframe embed', 'Code', '{"html": "string"}', '{"html": ""}', '00000000-0000-0000-0000-000000000001'),
  ('spacer', 'Spacer', 'Vertical whitespace', 'Minus', '{"height": "number"}', '{"height": 48}', '00000000-0000-0000-0000-000000000001'),
  ('collection_list', 'Collection Data', 'Live rows from one of your collections, filtered and sorted', 'Table', '{"collection": "string", "view_type": "string", "display_fields": "string", "filters": "array", "sort_field": "string", "sort_dir": "string", "limit": "number"}', '{"collection": "", "view_type": "list", "display_fields": "", "filters": [], "sort_dir": "desc", "limit": 10}', '00000000-0000-0000-0000-000000000001'),
  ('divider', 'Divider', 'Horizontal separator', 'Minus', '{"color": "string", "thickness": "number", "line_style": "string"}', '{"color": "#e5e7eb", "thickness": 1, "line_style": "solid"}', '00000000-0000-0000-0000-000000000001'),
  ('stats', 'Stats', 'Key metrics display', 'BarChart', '{"items": "array", "columns": "number"}', '{"items": [{"value": "100+", "label": "Users"}], "columns": 4}', '00000000-0000-0000-0000-000000000001'),
  ('video', 'Video', 'YouTube / Vimeo embed', 'Play', '{"url": "string", "caption": "string"}', '{"url": "", "caption": ""}', '00000000-0000-0000-0000-000000000001'),
  ('gallery', 'Gallery', 'Image grid', 'Grid', '{"images": "array", "columns": "number"}', '{"images": [], "columns": 3}', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (tenant_id, name) DO NOTHING;

-- ── 7. Migrate zones, zone pages and views ──────────────────────────────────
--
-- PER TENANT, EXPLICITLY, and that is not decoration.
--
-- `zvd_zones/pages/views` carry FORCE ROW LEVEL SECURITY, and
-- `zveltio_tenant_scope_ok` falls back to the DEFAULT tenant when
-- `zveltio.current_tenant` is unset — which it is inside a migration. FORCE
-- binds the table OWNER, so on an install where the engine runs as a plain role
-- (which the boot warning actively recommends) a flat
-- `INSERT ... SELECT FROM zvd_zones` reads ONLY the default tenant's rows and
-- silently leaves every other company's portal behind. On an install running as
-- a superuser the same statement sees everything, because superusers bypass RLS
-- even under FORCE. Same migration, same database contents, different outcome
-- depending on how the operator configured their role — and the failure is
-- silent in the direction that loses data.
--
-- Setting the GUC per tenant makes both postures agree. `zv_tenants` has no RLS,
-- so the driving loop can see the whole list either way.

DO $$
DECLARE
  tn   record;
  z    record;
  zp   record;
  new_site_id UUID;
  new_page_id UUID;
  blocks_json JSONB;
BEGIN
  -- Nothing to do when portals was never installed.
  IF to_regclass('public.zvd_zones') IS NULL THEN RETURN; END IF;

  FOR tn IN SELECT id FROM zv_tenants LOOP
    PERFORM set_config('zveltio.current_tenant', tn.id::text, true);

    -- 7a. zones → sites
    FOR z IN SELECT * FROM zvd_zones WHERE tenant_id = tn.id LOOP
      SELECT id INTO new_site_id FROM zv_page_sites
        WHERE legacy_zone_id = z.id AND tenant_id = tn.id;

      IF new_site_id IS NULL THEN
        INSERT INTO zv_page_sites (
          tenant_id, name, slug, description, is_active, is_public, access_roles,
          base_path, site_name, site_logo_url, primary_color, secondary_color,
          custom_css, nav_position, show_breadcrumbs, legacy_zone_id,
          created_at, updated_at)
        VALUES (
          tn.id, z.name,
          -- A zone slug and a site slug share a namespace now. Collisions are
          -- possible only against a site this migration created earlier in the
          -- same run, so suffixing on conflict is enough and never renames a
          -- zone that had the field to itself.
          z.slug, z.description, z.is_active,
          -- A zone with no access_roles admitted anyone who could reach it,
          -- which is what a public site is. One with roles becomes a portal.
          (COALESCE(array_length(z.access_roles, 1), 0) = 0),
          z.access_roles, z.base_path, z.site_name, z.site_logo_url,
          COALESCE(z.primary_color, '#069494'), z.secondary_color, z.custom_css,
          COALESCE(z.nav_position, 'sidebar'), z.show_breadcrumbs, z.id,
          z.created_at, z.updated_at)
        ON CONFLICT (tenant_id, slug) DO UPDATE SET legacy_zone_id = EXCLUDED.legacy_zone_id
        RETURNING id INTO new_site_id;
      END IF;

      -- 7b. zone pages → pages, with their views folded into blocks
      FOR zp IN SELECT * FROM zvd_pages WHERE zone_id = z.id AND tenant_id = tn.id
                ORDER BY sort_order, created_at LOOP

        -- Each zvd_page_views row becomes ONE collection_list block. This is
        -- the join table the handoff warned about: it is a foreign key, not a
        -- bag of links, and `col_span` / `sort_order` / `config_override` /
        -- `title_override` are the layout. Every one of them lands here.
        SELECT COALESCE(jsonb_agg(blk ORDER BY sort_order), '[]'::jsonb)
        INTO blocks_json
        FROM (
          SELECT pv.sort_order,
                 jsonb_build_object(
                   'id',   pv.id,
                   'type', 'collection_list',
                   'col_span', pv.col_span,
                   'content', jsonb_build_object(
                     'collection',     v.collection,
                     'view_type',      v.view_type,
                     'title',          COALESCE(pv.title_override, v.name),
                     'description',    v.description,
                     'fields',         v.fields,
                     'filters',        v.filters,
                     'sort_field',     v.sort_field,
                     'sort_dir',       COALESCE(v.sort_dir, 'desc'),
                     'limit',          COALESCE(v.page_size, 20),
                     -- The view's config with the per-placement override on top,
                     -- which is the precedence the render path applied.
                     'config',         COALESCE(v.config, '{}'::jsonb)
                                         || COALESCE(pv.config_override, '{}'::jsonb)
                   )
                 ) AS blk
          FROM zvd_page_views pv
          JOIN zvd_views v ON v.id = pv.view_id
          WHERE pv.page_id = zp.id
        ) s;

        SELECT id INTO new_page_id FROM zv_pages
          WHERE legacy_zone_page_id = zp.id AND tenant_id = tn.id;

        IF new_page_id IS NULL THEN
          INSERT INTO zv_pages (
            tenant_id, site_id, title, slug, description, icon, status,
            blocks, meta, is_active, is_homepage, auth_required, allowed_roles,
            sort_order, legacy_zone_page_id, created_at, updated_at)
          VALUES (
            tn.id, new_site_id, zp.title, zp.slug, zp.description, zp.icon,
            -- A zone page had no draft/published axis; it had is_active. An
            -- active page is a published one, so the portal keeps working.
            CASE WHEN zp.is_active THEN 'published' ELSE 'draft' END,
            blocks_json, '{}'::jsonb, zp.is_active, zp.is_homepage,
            zp.auth_required, zp.allowed_roles, zp.sort_order, zp.id,
            zp.created_at, zp.updated_at)
          RETURNING id INTO new_page_id;
        END IF;
      END LOOP;
    END LOOP;

    -- 7c. parent_id, in a second pass — a child may migrate before its parent.
    UPDATE zv_pages child
    SET parent_id = parent.id
    FROM zvd_pages old_child
    JOIN zvd_pages old_parent ON old_parent.id = old_child.parent_id
    JOIN zv_pages parent ON parent.legacy_zone_page_id = old_parent.id
    WHERE child.legacy_zone_page_id = old_child.id
      AND child.tenant_id = tn.id
      AND parent.tenant_id = tn.id
      AND child.parent_id IS DISTINCT FROM parent.id;

    -- 7d. Existing CMS pages predate sites. Give them one so every page has a
    -- home and the editor has something to list them under.
    IF EXISTS (SELECT 1 FROM zv_pages WHERE tenant_id = tn.id AND site_id IS NULL) THEN
      SELECT id INTO new_site_id FROM zv_page_sites
        WHERE tenant_id = tn.id AND slug = 'website';

      IF new_site_id IS NULL THEN
        INSERT INTO zv_page_sites (
          tenant_id, name, slug, description, is_active, is_public,
          access_roles, base_path, nav_position)
        VALUES (
          tn.id, 'Website', 'website',
          'The public website. Created when CMS pages were adopted into the site model.',
          true, true, '{}', '/', 'topbar')
        RETURNING id INTO new_site_id;
      END IF;

      UPDATE zv_pages SET site_id = new_site_id
      WHERE tenant_id = tn.id AND site_id IS NULL;
    END IF;
  END LOOP;
END
$$;

-- DOWN
--
-- The tables are NOT dropped and the migrated rows are NOT deleted. This runs on
-- `purgeData=true`, and uninstalling the extension that PRESENTS pages is not a
-- statement that the pages should be destroyed — the same rule portals set for
-- its own DOWN, for the same reason. Releasing the policies hands the data back
-- intact; `legacy_zone_id` / `legacy_zone_page_id` still record where each row
-- came from, so the predecessors' tables and these can be told apart afterwards.
DROP POLICY IF EXISTS tenant_isolation_zv_page_sites ON zv_page_sites;
DROP POLICY IF EXISTS tenant_isolation_zv_pages ON zv_pages;
DROP POLICY IF EXISTS tenant_isolation_zv_page_block_types ON zv_page_block_types;
DROP POLICY IF EXISTS tenant_isolation_zv_page_revisions ON zv_page_revisions;
DROP POLICY IF EXISTS tenant_isolation_zv_page_seo_scores ON zv_page_seo_scores;
DROP POLICY IF EXISTS tenant_isolation_zv_page_ab_variants ON zv_page_ab_variants;
DROP POLICY IF EXISTS tenant_isolation_zv_page_metrics ON zv_page_metrics;
DROP POLICY IF EXISTS tenant_isolation_zv_page_redirects ON zv_page_redirects;
DROP POLICY IF EXISTS tenant_isolation_zv_page_sitemap_config ON zv_page_sitemap_config;
DROP POLICY IF EXISTS tenant_isolation_zv_page_menus ON zv_page_menus;
