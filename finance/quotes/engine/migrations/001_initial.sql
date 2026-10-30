-- 001_initial.sql
--
-- Consolidated initial schema for the `finance/quotes` extension.
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
-- Quotes & Proposals extension schema

CREATE TABLE IF NOT EXISTS zvd_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  contact_id TEXT,
  organization_id TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  notes TEXT,
  terms TEXT,
  converted_to_invoice_id TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_quotes_status ON zvd_quotes(status);
CREATE INDEX IF NOT EXISTS idx_zvd_quotes_client ON zvd_quotes(contact_id, organization_id);

CREATE TABLE IF NOT EXISTS zvd_quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES zvd_quotes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  discount NUMERIC(5,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_zvd_quote_lines_quote ON zvd_quote_lines(quote_id);

-- ── from 002_enterprise.sql ──
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Quote revisions
CREATE TABLE IF NOT EXISTS zvd_quote_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES zvd_quotes(id) ON DELETE CASCADE,
  revision_number INT NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  change_note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public access tokens for client-facing quote view
CREATE TABLE IF NOT EXISTS zvd_quote_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES zvd_quotes(id) ON DELETE CASCADE UNIQUE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Internal approval workflow
CREATE TABLE IF NOT EXISTS zvd_quote_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES zvd_quotes(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'))
);

-- Add revision tracking to quotes
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS revision INT NOT NULL DEFAULT 1;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT NULL CHECK (approval_status IS NULL OR approval_status IN ('pending','approved','rejected'));
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS footer_notes TEXT;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS public_token TEXT;

