-- A catalogue to pick from, and documents other than the invoice.
--
-- THE CATALOGUE
--
-- Every line was typed from scratch, every time. A company sells the same
-- twenty things all year, so the same description gets retyped with a different
-- spelling each month, the price drifts between invoices nobody compares, and
-- the VAT rate is whatever was remembered that morning. Wrong rate on a line is
-- not a typo, it is a tax error.
--
-- `code` is what an accountant reconciles against, so it is unique per tenant —
-- but only where present, because plenty of services never get one and forcing
-- an invented code is worse than allowing none.
CREATE TABLE IF NOT EXISTS zvd_catalogue_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT,
  name          TEXT NOT NULL,
  description   TEXT,
  kind          TEXT NOT NULL DEFAULT 'service' CHECK (kind IN ('product', 'service')),
  unit          TEXT NOT NULL DEFAULT 'buc',
  unit_price    NUMERIC(14, 4) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'RON',
  tax_rate      NUMERIC(5, 2) NOT NULL DEFAULT 19,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- THE DELIVERY NOTE'S DELEGATE
--
-- An "aviz de însoțire a mărfii" travels with the goods and must name who is
-- carrying them: person, identity document, vehicle. Without these columns the
-- document type in 005 could be numbered but never legally issued, so the
-- series would have been an empty promise.
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS doc_type          TEXT NOT NULL DEFAULT 'invoice';
ALTER TABLE zvd_invoices DROP CONSTRAINT IF EXISTS zvd_invoices_doc_type_check;
ALTER TABLE zvd_invoices ADD CONSTRAINT zvd_invoices_doc_type_check
  CHECK (doc_type IN ('invoice', 'proforma', 'delivery_note'));

ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS delegate_name     TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS delegate_id_card  TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS delegate_vehicle  TEXT;

-- A proforma is not a fiscal document: it requests payment, it does not record
-- a supply. Linking the invoice back to the proforma it came from is what lets
-- someone answer "did we ever invoice that quote" without matching by eye.
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS converted_from_id UUID;

CREATE INDEX IF NOT EXISTS idx_zvd_invoices_doc_type  ON zvd_invoices (doc_type, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_invoices_converted ON zvd_invoices (converted_from_id);

-- ── Tenant isolation, same template as 002 ───────────────────────────────
ALTER TABLE zvd_catalogue_items ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_catalogue_items ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);

CREATE UNIQUE INDEX IF NOT EXISTS uq_zvd_catalogue_code   ON zvd_catalogue_items (tenant_id, code) WHERE code IS NOT NULL;
CREATE INDEX        IF NOT EXISTS idx_zvd_catalogue_tenant ON zvd_catalogue_items (tenant_id, is_active);

ALTER TABLE zvd_catalogue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_catalogue_items FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zvd_catalogue_items ON zvd_catalogue_items;
CREATE POLICY tenant_isolation_zvd_catalogue_items ON zvd_catalogue_items
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zveltio_rls') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON zvd_catalogue_items TO zveltio_rls;
  END IF;
END $$;
