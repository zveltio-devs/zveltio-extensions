-- 001_initial.sql
--
-- Consolidated initial schema for the `content/document-templates` extension.
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
--   • 001_document_templates.sql
--   • 002_enterprise.sql

-- ── from 001_document_templates.sql ──
-- Document Templates Extension
-- HTML/PDF template management with variable interpolation

CREATE TABLE IF NOT EXISTS zv_document_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT,
  description   TEXT,
  category      TEXT,
  html_body     TEXT NOT NULL DEFAULT '',
  css_styles    TEXT,
  variables     JSONB NOT NULL DEFAULT '[]',
  pdf_options   JSONB DEFAULT '{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"20mm","right":"20mm"}}',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade: add columns that may be missing when table was created by an older schema
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS html_body TEXT NOT NULL DEFAULT '';
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS css_styles TEXT;
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS variables JSONB NOT NULL DEFAULT '[]';
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS pdf_options JSONB DEFAULT '{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"20mm","right":"20mm"}}';
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Backfill slug for any rows that don't have one (upgrade from legacy)
UPDATE zv_document_templates
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(id::text, 1, 8)
WHERE slug IS NULL;

CREATE TABLE IF NOT EXISTS zv_document_renders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID NOT NULL REFERENCES zv_document_templates(id) ON DELETE CASCADE,
  variables     JSONB NOT NULL DEFAULT '{}',
  output_format TEXT NOT NULL DEFAULT 'pdf' CHECK (output_format IN ('pdf', 'html')),
  file_key      TEXT,
  file_size     INTEGER,
  rendered_by   TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  rendered_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_templates_slug ON zv_document_templates(slug);
CREATE INDEX IF NOT EXISTS idx_doc_renders_template ON zv_document_renders(template_id);

-- ── from 002_enterprise.sql ──
-- Template versioning
CREATE TABLE IF NOT EXISTS zv_document_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES zv_document_templates(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  html_body TEXT NOT NULL,
  css_styles TEXT,
  variables JSONB NOT NULL DEFAULT '{}',
  change_notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (template_id, version_number)
);

-- Template sharing/permissions
CREATE TABLE IF NOT EXISTS zv_document_template_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES zv_document_templates(id) ON DELETE CASCADE,
  user_id TEXT,
  role_name TEXT,
  permission TEXT NOT NULL DEFAULT 'use' CHECK (permission IN ('use','edit','admin')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR role_name IS NOT NULL)
);

-- Scheduled rendering (batch generation)
CREATE TABLE IF NOT EXISTS zv_document_render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES zv_document_templates(id) ON DELETE CASCADE,
  job_name TEXT NOT NULL,
  data_source TEXT NOT NULL,
  filter_config JSONB NOT NULL DEFAULT '{}',
  output_format TEXT NOT NULL DEFAULT 'pdf' CHECK (output_format IN ('pdf','html','zip')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  total_records INT,
  processed_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  output_zip_key TEXT,
  error TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add columns to templates
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS version_number INT NOT NULL DEFAULT 1;
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS usage_count INT NOT NULL DEFAULT 0;
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

