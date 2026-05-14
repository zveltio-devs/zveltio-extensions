-- Add missing columns and tables for document versioning and number sequences
ALTER TABLE zv_ro_documents
  ADD COLUMN IF NOT EXISTS category        TEXT,
  ADD COLUMN IF NOT EXISTS internal_notes  TEXT,
  ADD COLUMN IF NOT EXISTS version_number  INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS archived_at     TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS zv_ro_document_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  version     INT NOT NULL,
  content     TEXT,
  changed_by  UUID,
  change_note TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_ro_doc_number_sequences (
  type       TEXT PRIMARY KEY,
  prefix     TEXT NOT NULL DEFAULT '',
  year       INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::int,
  last_seq   INT NOT NULL DEFAULT 0,
  format     TEXT NOT NULL DEFAULT '{prefix}{year}-{seq:4d}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default sequences for each document type
INSERT INTO zv_ro_doc_number_sequences (type, prefix, format) VALUES
  ('contract',       'CTR', '{prefix}-{year}-{seq:4d}'),
  ('pv',             'PV',  '{prefix}-{year}-{seq:4d}'),
  ('nir',            'NIR', '{prefix}-{year}-{seq:4d}'),
  ('dispozitie_plata','DP', '{prefix}-{year}-{seq:4d}'),
  ('proces_verbal',  'PVG', '{prefix}-{year}-{seq:4d}'),
  ('notificare',     'NOT', '{prefix}-{year}-{seq:4d}'),
  ('other',          'DOC', '{prefix}-{year}-{seq:4d}')
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_ro_doc_versions_doc ON zv_ro_document_versions(document_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_ro_docs_category ON zv_ro_documents(category) WHERE category IS NOT NULL;
