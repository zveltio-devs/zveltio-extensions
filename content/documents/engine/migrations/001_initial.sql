-- 001_initial.sql
--
-- Consolidated initial schema for the `content/documents` extension.
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
--   • 001_init.sql
--   • 002_enterprise.sql

-- ── from 001_init.sql ──
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

CREATE INDEX IF NOT EXISTS idx_generated_docs_template ON zv_generated_docs(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_source ON zv_generated_docs(source_collection, source_record_id);

-- ── from 002_enterprise.sql ──
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Document signing requests
CREATE TABLE IF NOT EXISTS zv_document_sign_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES zv_generated_docs(id) ON DELETE CASCADE,
  signer_email TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  sign_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  signed_at TIMESTAMPTZ,
  ip_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed','declined','expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  message TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document access tracking
CREATE TABLE IF NOT EXISTS zv_document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES zv_generated_docs(id) ON DELETE CASCADE,
  user_id TEXT,
  ip TEXT,
  action TEXT NOT NULL CHECK (action IN ('view','download','sign','share')),
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document number sequences (per template prefix)
CREATE TABLE IF NOT EXISTS zv_document_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL UNIQUE, -- soft ref to zv_document_templates (content/document-templates ext)
  prefix TEXT NOT NULL DEFAULT 'DOC',
  next_number INT NOT NULL DEFAULT 1,
  year_reset BOOLEAN NOT NULL DEFAULT true,
  reset_year INT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add expiry and sharing to generated docs
ALTER TABLE zv_generated_docs ADD COLUMN IF NOT EXISTS is_signed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zv_generated_docs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE zv_generated_docs ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
ALTER TABLE zv_generated_docs ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','revoked'));

CREATE INDEX IF NOT EXISTS idx_doc_sign_requests_token ON zv_document_sign_requests(sign_token);
CREATE INDEX IF NOT EXISTS idx_doc_sign_requests_doc ON zv_document_sign_requests(document_id);

