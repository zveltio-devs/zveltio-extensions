-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for finance/invoicing. Same pattern as
-- crm/engine/migrations/002_tenant_rls.sql (PR #1 — the rollout
-- template documented in AUDIT-2026-05-24.md §6.1). Invoicing holds
-- financial PII (amounts, tax ids, payment data) — without
-- tenant_id + FORCE RLS, a tenant could list every other tenant's
-- invoices via the existing route handlers (which filter only on
-- owner/created_by, not on tenant).
--
-- For the rationale + per-step explanation, see CRM's 002_tenant_rls.sql.
-- This file only differs in the table list.

ALTER TABLE zvd_invoices            ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_invoice_lines       ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_invoice_payments    ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_credit_notes        ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_credit_note_lines   ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_payment_reminders   ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zvd_invoices          ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_invoice_lines     ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_invoice_payments  ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_credit_notes      ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_credit_note_lines ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zvd_payment_reminders ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zvd_invoices_tenant            ON zvd_invoices            (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_invoice_lines_tenant       ON zvd_invoice_lines       (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_invoice_payments_tenant    ON zvd_invoice_payments    (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_credit_notes_tenant        ON zvd_credit_notes        (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_credit_note_lines_tenant   ON zvd_credit_note_lines   (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zvd_payment_reminders_tenant   ON zvd_payment_reminders   (tenant_id);

ALTER TABLE zvd_invoices          ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_invoices          FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_invoice_lines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_invoice_lines     FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_invoice_payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_invoice_payments  FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_credit_notes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_credit_notes      FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_credit_note_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_credit_note_lines FORCE  ROW LEVEL SECURITY;
ALTER TABLE zvd_payment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_payment_reminders FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_invoices',
    'zvd_invoice_lines',
    'zvd_invoice_payments',
    'zvd_credit_notes',
    'zvd_credit_note_lines',
    'zvd_payment_reminders'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation_%I ON %I
      USING (
        NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
        OR tenant_id IS NULL
        OR tenant_id::text = current_setting('zveltio.current_tenant', true)
      )
      WITH CHECK (
        NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
        OR tenant_id IS NULL
        OR tenant_id::text = current_setting('zveltio.current_tenant', true)
      )
    $pol$, tbl, tbl);
  END LOOP;
END $$;

DO $$
DECLARE
  has_tenants BOOLEAN;
  null_count BIGINT;
  rec RECORD;
BEGIN
  SELECT EXISTS(SELECT 1 FROM zv_tenants) INTO has_tenants;
  IF NOT has_tenants THEN RETURN; END IF;

  FOR rec IN
    SELECT unnest(ARRAY[
      'zvd_invoices',
      'zvd_invoice_lines',
      'zvd_invoice_payments',
      'zvd_credit_notes',
      'zvd_credit_note_lines',
      'zvd_payment_reminders'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[finance/invoicing tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
        'These rows are visible to ALL tenants. Backfill with: '
        'UPDATE % SET tenant_id = ''<correct-tenant-id>'' WHERE tenant_id IS NULL',
        null_count, rec.t, rec.t;
    END IF;
  END LOOP;
END $$;

-- DOWN
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zvd_invoices',
    'zvd_invoice_lines',
    'zvd_invoice_payments',
    'zvd_credit_notes',
    'zvd_credit_note_lines',
    'zvd_payment_reminders'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP INDEX IF EXISTS idx_%I_tenant', tbl);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS tenant_id', tbl);
  END LOOP;
END $$;
