-- Generated documents
CREATE TABLE IF NOT EXISTS zv_generated_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID, -- soft ref to zv_document_templates (content/document-templates ext)
  template_name TEXT NOT NULL,
  source_collection TEXT,
  source_record_id UUID,
  variables_used JSONB NOT NULL DEFAULT '{}',
  output_format TEXT NOT NULL DEFAULT 'pdf' CHECK (output_format IN ('pdf','html')),
  file_key TEXT,
  file_size BIGINT,
  document_number TEXT,
  generated_by TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generated_docs_template ON zv_generated_docs(template_id);
CREATE INDEX idx_generated_docs_source ON zv_generated_docs(source_collection, source_record_id);
