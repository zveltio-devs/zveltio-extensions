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
