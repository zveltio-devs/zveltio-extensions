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
