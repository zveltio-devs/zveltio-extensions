-- Who issues the invoice, who receives it, and under what number.
--
-- Three things were missing, and they are the difference between a document
-- that looks like an invoice and one that is a legal invoice in Romania.
--
-- 1. THE ISSUER DID NOT EXIST ANYWHERE
--
-- No table, no setting, nothing held the company's own name, tax code,
-- registration number, address or bank account. `compliance/ro/efactura` reads
-- `invoice.seller_cui` and falls back to the literal string
-- "Set in e-Factura settings" for the name, because there were no settings to
-- read from — the fallback WAS the behaviour, on every document.
--
-- 2. THE BUYER'S TAX CODE DID NOT EXIST EITHER
--
-- The same generator reads `invoice.client_tax_id`, and that column was never
-- added, so `buyer_cui` went out as NULL every time. Cod fiscal art. 319
-- alin. (20) lit. e) requires the buyer's code when the buyer is a taxable
-- person, and ANAF rejects an e-Factura without it. So the entire e-invoicing
-- path could not produce a valid document — not "rarely", not "if
-- misconfigured": never.
--
-- 3. NUMBERING WAS ONE GLOBAL SEQUENCE, SHARED BY EVERY TENANT
--
-- `nextval('zvd_invoice_seq')` is not tenant-scoped, so two companies on one
-- instance interleave: the first gets 1, 3, 7, the second 2, 4, 5, and each
-- sees permanent gaps in its own numbering. Art. 319 alin. (20) lit. a) asks
-- for a sequential number "based on one or more series", continuous per
-- issuer. Gaps are what an inspection asks about.
--
-- The prefix was also hardcoded to 'INV' — the `prefix` parameter existed and
-- no caller ever passed one — so the series the law talks about could not be
-- chosen at all.
--
-- Snapshot, not reference: the seller columns copy the profile onto the
-- invoice at issue time. A company changes address or bank; a document already
-- issued must keep showing what was printed on it, and a foreign key would
-- rewrite history every time the profile is edited.

-- ── The issuing company ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zvd_company_profile (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  legal_name      TEXT,
  tax_id          TEXT,                 -- CUI / CIF
  reg_no          TEXT,                 -- Nr. Reg. Com.
  vat_payer       BOOLEAN NOT NULL DEFAULT TRUE,
  -- Cash-accounting VAT ("TVA la încasare") changes the wording that must
  -- appear on the invoice, so it belongs to the issuer, not to each document.
  vat_on_collection BOOLEAN NOT NULL DEFAULT FALSE,
  address         TEXT,
  city            TEXT,
  county          TEXT,
  country         TEXT NOT NULL DEFAULT 'RO',
  iban            TEXT,
  bank            TEXT,
  share_capital   TEXT,
  email           TEXT,
  phone           TEXT,
  website         TEXT,
  logo_url        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Document series ──────────────────────────────────────────────────────
-- One row per (tenant, document type, series). `next_number` is claimed with
-- UPDATE ... RETURNING so two concurrent issues cannot take the same number.
CREATE TABLE IF NOT EXISTS zvd_document_series (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_type      TEXT NOT NULL DEFAULT 'invoice'
                CHECK (doc_type IN ('invoice', 'proforma', 'credit_note', 'receipt', 'delivery_note')),
  series        TEXT NOT NULL,
  next_number   BIGINT NOT NULL DEFAULT 1 CHECK (next_number > 0),
  -- Width of the zero padding: "FCT-0001" vs "FCT-00001". Cosmetic, but it is
  -- the kind of thing an accountant asks to match the previous software.
  padding       INT NOT NULL DEFAULT 4 CHECK (padding BETWEEN 1 AND 10),
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Identification on the invoice itself ─────────────────────────────────
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS series          TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS client_tax_id   TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS client_reg_no   TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS client_country  TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS seller_name     TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS seller_tax_id   TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS seller_reg_no   TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS seller_address  TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS seller_iban     TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS seller_bank     TEXT;

-- ── Tenant isolation, same template as 002 ───────────────────────────────
ALTER TABLE zvd_company_profile  ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_document_series  ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zvd_company_profile  ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
ALTER TABLE zvd_document_series  ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);

-- One profile per tenant, and a series name that cannot repeat within a
-- tenant and document type — the uniqueness IS the numbering guarantee.
CREATE UNIQUE INDEX IF NOT EXISTS uq_zvd_company_profile_tenant  ON zvd_company_profile (tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_zvd_document_series_tenant  ON zvd_document_series (tenant_id, doc_type, series);
CREATE INDEX        IF NOT EXISTS idx_zvd_document_series_tenant ON zvd_document_series (tenant_id, doc_type);

ALTER TABLE zvd_company_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_company_profile FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_document_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_document_series FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['zvd_company_profile', 'zvd_document_series'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation_%I ON %I
      USING (zveltio_tenant_scope_ok(tenant_id))
      WITH CHECK (zveltio_tenant_scope_ok(tenant_id))
    $pol$, tbl, tbl);
  END LOOP;
END $$;

-- The RLS role must be able to read and write these like every other table
-- the engine touches inside a request; 030_rls_enforcement_role.sql grants
-- what exists at ITS run time, and these two did not exist yet.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zveltio_rls') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON zvd_company_profile TO zveltio_rls;
    GRANT SELECT, INSERT, UPDATE, DELETE ON zvd_document_series TO zveltio_rls;
  END IF;
END $$;

-- Carry the existing numbering forward.
--
-- The old global sequence has already handed out numbers, and a fresh series
-- starting at 1 would reissue them. Start the default series above the highest
-- number this tenant actually used, so nothing repeats and the change is
-- invisible to anyone mid-year.
INSERT INTO zvd_document_series (tenant_id, doc_type, series, next_number, padding, is_default)
SELECT i.tenant_id,
       'invoice',
       'INV',
       COALESCE(MAX(NULLIF(regexp_replace(i.number, '\D', '', 'g'), ''))::BIGINT, 0) + 1,
       5,
       TRUE
  FROM zvd_invoices i
 WHERE i.number IS NOT NULL
 GROUP BY i.tenant_id
ON CONFLICT (tenant_id, doc_type, series) DO NOTHING;
