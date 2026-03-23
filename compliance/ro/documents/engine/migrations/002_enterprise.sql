-- Document version history
CREATE TABLE IF NOT EXISTS zv_ro_document_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES zv_ro_documents(id) ON DELETE CASCADE,
  version     INT NOT NULL,
  content     TEXT,
  metadata    JSONB NOT NULL DEFAULT '{}',
  changed_by  TEXT NOT NULL,
  change_note TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document auto-numbering sequences
CREATE TABLE IF NOT EXISTS zv_ro_doc_number_sequences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL UNIQUE,
  prefix      TEXT NOT NULL DEFAULT '',
  year        INT NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
  last_seq    INT NOT NULL DEFAULT 0,
  format      TEXT NOT NULL DEFAULT '{prefix}{year}/{seq:04d}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document signatories tracking
CREATE TABLE IF NOT EXISTS zv_ro_document_signatories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES zv_ro_documents(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'semnatar',
  email       TEXT,
  signed_at   TIMESTAMPTZ,
  sign_order  INT NOT NULL DEFAULT 0,
  token       TEXT UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zv_ro_documents ADD COLUMN IF NOT EXISTS version_number INT NOT NULL DEFAULT 1;
ALTER TABLE zv_ro_documents ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE zv_ro_documents ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE zv_ro_documents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_ro_doc_versions ON zv_ro_document_versions(document_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_ro_doc_signatories ON zv_ro_document_signatories(document_id, signed_at);

-- Seed number sequences
INSERT INTO zv_ro_doc_number_sequences (type, prefix, format) VALUES
  ('contract', 'CTR', '{prefix}-{year}/{seq:04d}'),
  ('pv', 'PV', '{prefix}-{year}/{seq:04d}'),
  ('nir', 'NIR', '{prefix}-{year}/{seq:04d}')
ON CONFLICT (type) DO NOTHING;
