-- 001_initial.sql
--
-- Consolidated initial schema for the `finance/invoicing` extension.
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
--   • 003_line_metadata.sql
--   • 004_invoice_sequences.sql
--   • 005_client_fk.sql

-- ── from 001_init.sql ──
-- Invoicing extension schema

CREATE TABLE IF NOT EXISTS zvd_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  client_id TEXT,
  client_type TEXT CHECK (client_type IN ('contact','organization')),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  notes TEXT,
  recurring_interval TEXT CHECK (recurring_interval IN ('monthly','quarterly','yearly')),
  next_issue_date DATE,
  paid_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_invoices_status ON zvd_invoices(status);
CREATE INDEX IF NOT EXISTS idx_zvd_invoices_due_date ON zvd_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_zvd_invoices_client ON zvd_invoices(client_id);

CREATE TABLE IF NOT EXISTS zvd_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES zvd_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_zvd_invoice_lines_invoice ON zvd_invoice_lines(invoice_id);

-- ── from 002_enterprise.sql ──
-- Partial payments tracking
CREATE TABLE IF NOT EXISTS zvd_invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES zvd_invoices(id) ON DELETE CASCADE,
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'transfer' CHECK (payment_method IN ('cash','card','transfer','check','other')),
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit notes (reverse invoices)
CREATE TABLE IF NOT EXISTS zvd_credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  original_invoice_id UUID REFERENCES zvd_invoices(id),
  client_id UUID,
  client_name TEXT NOT NULL,
  client_email TEXT,
  reason TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency TEXT NOT NULL DEFAULT 'RON',
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','applied')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_credit_note_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID NOT NULL REFERENCES zvd_credit_notes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(18,4) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

-- Payment reminders
CREATE TABLE IF NOT EXISTS zvd_payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES zvd_invoices(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reminder_type TEXT NOT NULL DEFAULT 'gentle' CHECK (reminder_type IN ('gentle','firm','final')),
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','sms','manual')),
  notes TEXT
);

-- Add columns to invoices
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS amount_due NUMERIC(18,2);
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS footer_notes TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0;

-- ── from 003_line_metadata.sql ──
-- Generic metadata column on invoice lines — allows other extensions to store
-- extension-specific data (e.g. lot_id for traceability) without coupling invoicing.
ALTER TABLE zvd_invoice_lines ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
ALTER TABLE zvd_invoice_lines ADD COLUMN IF NOT EXISTS unit VARCHAR(20);

-- ── from 004_invoice_sequences.sql ──
-- Atomic sequences for invoice/credit note number generation.
-- Replaces the module-level counter that was unsafe across restarts and concurrent requests.
CREATE SEQUENCE IF NOT EXISTS zvd_invoice_seq START 1;
CREATE SEQUENCE IF NOT EXISTS zvd_credit_note_seq START 1;

-- Sync sequences to current table counts so existing numbers are not reused.
SELECT setval('zvd_invoice_seq', GREATEST((SELECT COUNT(*) FROM zvd_invoices), 1));
SELECT setval('zvd_credit_note_seq', GREATEST((SELECT COUNT(*) FROM zvd_credit_notes), 1));

-- ── from 005_client_fk.sql ──
-- Migration 005: invoicing.client_id → FK to zvd_contacts(id)
--
-- Rationale: invoicing previously stored client_id as TEXT/UUID without a foreign
-- key, so an invoice could reference a non-existent contact. After alpha.67 the
-- CRM extension is the canonical owner of zvd_contacts; this migration establishes
-- referential integrity.
--
-- Safety:
--   - Both columns are already UUID (002_enterprise) or TEXT (001_init); we
--     normalise to UUID and add the FK with ON DELETE SET NULL so deleting a
--     contact preserves historical invoices but disconnects them.
--   - The FK is added with NOT VALID, then VALIDATE CONSTRAINT separately, so
--     the table is not blocked while existing rows are checked.
--   - Adds an index for the FK to keep joins fast.
--
-- Rollback: ALTER TABLE zvd_invoices DROP CONSTRAINT zvd_invoices_client_fk;

DO $$
BEGIN
  -- Normalise client_id type to UUID if currently TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zvd_invoices'
      AND column_name = 'client_id'
      AND data_type = 'text'
  ) THEN
    -- Drop NULL/empty strings so the cast doesn't fail
    UPDATE zvd_invoices SET client_id = NULL WHERE client_id = '' OR client_id IS NULL;
    ALTER TABLE zvd_invoices ALTER COLUMN client_id TYPE UUID USING client_id::uuid;
  END IF;
END$$;

-- Only attach the FK if zvd_contacts exists. If CRM is not installed, skip silently —
-- invoicing still works, but referential integrity is unenforced until CRM is added.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zvd_contacts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'zvd_invoices' AND constraint_name = 'zvd_invoices_client_fk'
    ) THEN
      ALTER TABLE zvd_invoices
        ADD CONSTRAINT zvd_invoices_client_fk
        FOREIGN KEY (client_id) REFERENCES zvd_contacts(id) ON DELETE SET NULL NOT VALID;

      -- Validate after add — if existing data violates, this fails loudly and
      -- the user is informed rather than silently corrupting data.
      ALTER TABLE zvd_invoices VALIDATE CONSTRAINT zvd_invoices_client_fk;
    END IF;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_zvd_invoices_client_fk ON zvd_invoices(client_id);

