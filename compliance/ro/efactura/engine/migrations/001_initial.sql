-- 001_initial.sql
--
-- Consolidated initial schema for the `compliance/ro/efactura` extension.
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
--   • 001_efactura.sql
--   • 002_enterprise.sql
--   • 003_canonical_link.sql

-- ── from 001_efactura.sql ──
-- e-Factura invoices
CREATE TABLE IF NOT EXISTS zv_efactura_invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL,
  invoice_date    DATE NOT NULL,
  due_date        DATE,

  -- Seller (emitent)
  seller_name     TEXT NOT NULL,
  seller_cui      TEXT NOT NULL,  -- CUI/CIF fiscal code
  seller_reg_com  TEXT,
  seller_address  TEXT,
  seller_iban     TEXT,
  seller_bank     TEXT,

  -- Buyer (beneficiar)
  buyer_name      TEXT NOT NULL,
  buyer_cui       TEXT,
  buyer_address   TEXT,

  -- Lines stored as JSONB array
  lines           JSONB NOT NULL DEFAULT '[]',
  -- [{description, quantity, unit, unit_price, vat_rate, vat_amount, line_total}]

  -- Totals
  subtotal        NUMERIC(14,2) NOT NULL DEFAULT 0,
  vat_total       NUMERIC(14,2) NOT NULL DEFAULT 0,
  total           NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'RON',

  -- e-Factura submission
  status          TEXT NOT NULL DEFAULT 'draft',  -- draft, xml_generated, submitted, accepted, rejected
  xml_content     TEXT,         -- UBL 2.1 XML
  anaf_index      TEXT,         -- ANAF upload index
  anaf_response   JSONB,        -- ANAF API response

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_efactura_status ON zv_efactura_invoices(status);
CREATE INDEX IF NOT EXISTS idx_efactura_seller ON zv_efactura_invoices(seller_cui);
CREATE INDEX IF NOT EXISTS idx_efactura_date ON zv_efactura_invoices(invoice_date DESC);

-- ── from 002_enterprise.sql ──
-- e-Factura status change log
CREATE TABLE IF NOT EXISTS zv_efactura_status_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES zv_efactura_invoices(id) ON DELETE CASCADE,
  old_status  TEXT NOT NULL,
  new_status  TEXT NOT NULL,
  changed_by  TEXT NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storno / credit notes
CREATE TABLE IF NOT EXISTS zv_efactura_storno (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id     UUID NOT NULL REFERENCES zv_efactura_invoices(id),
  storno_invoice_id UUID REFERENCES zv_efactura_invoices(id),
  reason          TEXT NOT NULL,
  requested_by    TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Daily submission statistics cache
CREATE TABLE IF NOT EXISTS zv_efactura_daily_stats (
  date            DATE NOT NULL,
  seller_cui      TEXT NOT NULL,
  submitted_count INT NOT NULL DEFAULT 0,
  accepted_count  INT NOT NULL DEFAULT 0,
  rejected_count  INT NOT NULL DEFAULT 0,
  total_amount    NUMERIC(18,2) NOT NULL DEFAULT 0,
  vat_amount      NUMERIC(18,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (date, seller_cui)
);

ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS buyer_cui_type TEXT DEFAULT 'RO' CHECK (buyer_cui_type IN ('RO','EU','OTHER'));
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS payment_reference TEXT;
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS reverse_charge BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS created_by TEXT;

CREATE INDEX IF NOT EXISTS idx_efactura_status_log ON zv_efactura_status_log(invoice_id, created_at DESC);

-- ── from 003_canonical_link.sql ──
-- Migration 003: link e-Factura submissions to canonical zvd_invoices.
--
-- Before alpha.67, e-Factura kept a full invoice copy in zv_efactura_invoices —
-- a duplicate of finance/invoicing's zvd_invoices. This forced users to enter
-- invoices twice: once in invoicing, once for e-Factura. Now we treat
-- zv_efactura_invoices as a *submissions log*: ANAF metadata only, the canonical
-- invoice lives in zvd_invoices.
--
-- Approach (non-destructive):
--   1. Add `source_invoice_id UUID` referencing zvd_invoices(id) so a submission
--      can be linked back to its origin.
--   2. Make legacy denormalised columns (seller_*, buyer_*, lines JSONB, totals)
--      nullable — they were NOT NULL before. New rows source these from
--      zvd_invoices at submit time; we only persist what the caller provided.
--   3. Keep ANAF metadata columns (status, xml_content, anaf_index, anaf_response)
--      unchanged — those are the actual reason this table exists.
--   4. Add an FK to zvd_invoices when CRM/invoicing is installed; otherwise leave
--      the column unenforced (e-Factura can still operate standalone for users
--      who want to upload manually-built invoices).

ALTER TABLE zv_efactura_invoices
  ADD COLUMN IF NOT EXISTS source_invoice_id UUID;

CREATE INDEX IF NOT EXISTS idx_zv_efactura_source ON zv_efactura_invoices(source_invoice_id);

-- Relax NOT NULL constraints on the denormalised mirror columns. Existing rows
-- keep their data; new rows can populate just source_invoice_id.
DO $$
DECLARE
  col text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'zv_efactura_invoices' AND column_name = 'invoice_number'
               AND is_nullable = 'NO') THEN
    ALTER TABLE zv_efactura_invoices ALTER COLUMN invoice_number DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'zv_efactura_invoices' AND column_name = 'invoice_date'
               AND is_nullable = 'NO') THEN
    ALTER TABLE zv_efactura_invoices ALTER COLUMN invoice_date DROP NOT NULL;
  END IF;
  FOR col IN SELECT unnest(ARRAY['seller_name','seller_cui','buyer_name']) LOOP
    EXECUTE format('ALTER TABLE zv_efactura_invoices ALTER COLUMN %I DROP NOT NULL', col);
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  -- Column may already be nullable on a fresh install — non-fatal
  NULL;
END$$;

-- Add FK to zvd_invoices if invoicing extension is installed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zvd_invoices') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'zv_efactura_invoices' AND constraint_name = 'zv_efactura_source_fk'
    ) THEN
      ALTER TABLE zv_efactura_invoices
        ADD CONSTRAINT zv_efactura_source_fk
        FOREIGN KEY (source_invoice_id) REFERENCES zvd_invoices(id) ON DELETE SET NULL NOT VALID;
      ALTER TABLE zv_efactura_invoices VALIDATE CONSTRAINT zv_efactura_source_fk;
    END IF;
  END IF;
END$$;

