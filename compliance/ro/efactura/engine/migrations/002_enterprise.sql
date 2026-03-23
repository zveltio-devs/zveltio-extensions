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
