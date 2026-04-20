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
