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
