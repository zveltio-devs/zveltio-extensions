-- 001_initial.sql
--
-- Consolidated initial schema for the `content/page-builder` extension.
--
-- Squashed from the per-version migration files that lived in this
-- folder during alpha. The project is pre-1.0 and no extension has
-- shipped to production, so collapsing the history into one file is
-- safe — there is no installed base whose `zv_migrations` table
-- already records versions 002+. New deployments install the full
-- extension schema in a single migration; further schema changes
-- ship as `002_*.sql`, `003_*.sql`, ... going forward.
--
-- Source files (applied in this order):
--   • 001_pages.sql
--   • 002_enterprise.sql

-- ── from 001_pages.sql ──
-- Pages (public-facing)
CREATE TABLE IF NOT EXISTS zv_pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'draft',
  template    TEXT NOT NULL DEFAULT 'default',
  blocks      JSONB NOT NULL DEFAULT '[]',
  meta        JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_by  UUID,
  updated_by  UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade: add columns missing from pre-extension zv_pages schema
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'default';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS blocks JSONB NOT NULL DEFAULT '[]';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS meta JSONB NOT NULL DEFAULT '{}';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Page block type library
CREATE TABLE IF NOT EXISTS zv_page_block_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,   -- hero, text, image, gallery, cta, form, embed
  display_name TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,
  schema       JSONB NOT NULL DEFAULT '{}',  -- JSON schema for block props
  default_props JSONB NOT NULL DEFAULT '{}',
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Page revisions
CREATE TABLE IF NOT EXISTS zv_page_revisions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id    UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE,
  blocks     JSONB NOT NULL,
  meta       JSONB NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON zv_pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON zv_pages(status);
CREATE INDEX IF NOT EXISTS idx_page_revisions_page ON zv_page_revisions(page_id, created_at DESC);

-- Seed core block types
INSERT INTO zv_page_block_types (name, display_name, description, icon, schema, default_props) VALUES
  ('hero', 'Hero', 'Full-width hero section with heading and CTA', 'Image', '{"title": "string", "subtitle": "string", "image_url": "string", "cta_text": "string", "cta_url": "string", "align": "string"}', '{"title": "Welcome", "subtitle": "", "align": "center", "cta_text": "Get Started", "cta_url": "/"}'),
  ('richtext', 'Rich Text', 'WYSIWYG text content block', 'Type', '{"content": "string"}', '{"content": "<p>Start writing...</p>"}'),
  ('image', 'Image', 'Single image with caption', 'ImageIcon', '{"url": "string", "alt": "string", "caption": "string", "width": "string"}', '{"url": "", "alt": "", "caption": "", "width": "100%"}'),
  ('columns', 'Columns', 'Multi-column layout', 'Columns', '{"columns": "number", "blocks": "array"}', '{"columns": 2, "blocks": [[], []]}'),
  ('cta', 'Call to Action', 'Highlighted call-to-action section', 'Megaphone', '{"heading": "string", "text": "string", "button_text": "string", "button_url": "string", "style": "string"}', '{"heading": "Ready to get started?", "text": "", "button_text": "Contact Us", "button_url": "/contact", "style": "primary"}'),
  ('embed', 'Embed', 'Arbitrary HTML or iframe embed', 'Code', '{"html": "string"}', '{"html": ""}'),
  ('spacer', 'Spacer', 'Vertical whitespace', 'Minus', '{"height": "number"}', '{"height": 48}')
ON CONFLICT (name) DO NOTHING;

-- ── from 002_enterprise.sql ──
-- SEO analysis scores
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

-- A/B test variants
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

-- Page performance metrics (daily aggregates)
CREATE TABLE IF NOT EXISTS zv_page_metrics (
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  avg_time_on_page_seconds INT NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (page_id, date)
);

-- URL redirects
CREATE TABLE IF NOT EXISTS zv_page_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  redirect_type INT NOT NULL DEFAULT 301 CHECK (redirect_type IN (301, 302)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  hit_count INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sitemap config per page
CREATE TABLE IF NOT EXISTS zv_page_sitemap_config (
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE UNIQUE,
  include_in_sitemap BOOLEAN NOT NULL DEFAULT true,
  change_freq TEXT NOT NULL DEFAULT 'weekly' CHECK (change_freq IN ('always','hourly','daily','weekly','monthly','yearly','never')),
  priority NUMERIC(2,1) NOT NULL DEFAULT 0.5 CHECK (priority BETWEEN 0 AND 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns to pages
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'ro';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS is_noindex BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS reading_time_minutes INT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS canonical_page_id UUID REFERENCES zv_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pages_locale ON zv_pages(locale, status);
CREATE INDEX IF NOT EXISTS idx_page_redirects_active ON zv_page_redirects(from_path) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_page_metrics_date ON zv_page_metrics(date DESC);

