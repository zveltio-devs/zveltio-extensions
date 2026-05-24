-- 001_initial.sql
--
-- Consolidated initial schema for the `compliance/ro/documents` extension.
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
--   • 001_documents.sql
--   • 002_documents_extend.sql
--   • 002_enterprise.sql

-- ── from 001_documents.sql ──
-- Romanian compliance documents
CREATE TABLE IF NOT EXISTS zv_ro_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT NOT NULL,  -- contract, pv, nir, dispozitie_plata, proces_verbal, notificare
  number       TEXT NOT NULL,
  date         DATE NOT NULL,
  title        TEXT NOT NULL,
  parties      JSONB NOT NULL DEFAULT '[]',  -- [{name, cui, role}]
  content      TEXT,           -- document body / template rendered
  template_id  TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'draft',  -- draft, signed, archived
  file_url     TEXT,           -- uploaded PDF/DOCX
  signed_at    TIMESTAMPTZ,
  created_by   UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_ro_document_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  description TEXT,
  template    TEXT NOT NULL,  -- Handlebars/Mustache template
  variables   JSONB NOT NULL DEFAULT '[]',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ro_docs_type ON zv_ro_documents(type, date DESC);
CREATE INDEX IF NOT EXISTS idx_ro_docs_status ON zv_ro_documents(status);

-- Seed document templates
INSERT INTO zv_ro_document_templates (name, type, description, template) VALUES
  ('Contract de prestari servicii', 'contract', 'Standard service agreement', '...template...'),
  ('Proces verbal de receptie', 'pv', 'Reception protocol', '...template...'),
  ('NIR - Nota de intrare receptie', 'nir', 'Goods receipt note', '...template...')
ON CONFLICT DO NOTHING;

-- ── from 002_documents_extend.sql ──
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

-- ── from 002_enterprise.sql ──
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

