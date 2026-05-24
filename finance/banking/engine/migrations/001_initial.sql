-- 001_initial.sql
--
-- Consolidated initial schema for the `finance/banking` extension.
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
-- Banking Sync extension schema

CREATE TABLE IF NOT EXISTS zvd_bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  iban TEXT,
  currency TEXT NOT NULL DEFAULT 'RON',
  current_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  type TEXT NOT NULL DEFAULT 'checking' CHECK (type IN ('checking','savings','credit','cash')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  color TEXT DEFAULT '#069494',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES zvd_bank_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  value_date DATE,
  description TEXT NOT NULL,
  reference TEXT,
  amount NUMERIC(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debit','credit')),
  balance_after NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'unreconciled' CHECK (status IN ('unreconciled','reconciled','excluded')),
  reconciled_with_id TEXT,
  reconciled_with_type TEXT,
  category TEXT,
  notes TEXT,
  import_hash TEXT UNIQUE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_bank_txn_account ON zvd_bank_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_zvd_bank_txn_date ON zvd_bank_transactions(date);
CREATE INDEX IF NOT EXISTS idx_zvd_bank_txn_status ON zvd_bank_transactions(status);

CREATE TABLE IF NOT EXISTS zvd_bank_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES zvd_bank_accounts(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  rows_imported INT NOT NULL DEFAULT 0,
  rows_skipped INT NOT NULL DEFAULT 0,
  imported_by TEXT NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── from 002_enterprise.sql ──
-- Auto-categorization rules
CREATE TABLE IF NOT EXISTS zvd_bank_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES zvd_bank_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  match_field TEXT NOT NULL DEFAULT 'description' CHECK (match_field IN ('description','counterparty_name','reference','amount')),
  match_operator TEXT NOT NULL DEFAULT 'contains' CHECK (match_operator IN ('contains','equals','starts_with','ends_with','regex','gt','lt')),
  match_value TEXT NOT NULL,
  category TEXT NOT NULL,
  type_override TEXT CHECK (type_override IN ('credit','debit')),
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reconciliation links (transaction ↔ invoice/expense)
CREATE TABLE IF NOT EXISTS zvd_bank_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES zvd_bank_transactions(id) ON DELETE CASCADE UNIQUE,
  linked_type TEXT NOT NULL CHECK (linked_type IN ('invoice','expense','manual')),
  linked_id UUID,
  matched_amount NUMERIC(18,2) NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Balance history snapshots (daily)
CREATE TABLE IF NOT EXISTS zvd_bank_balance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES zvd_bank_accounts(id),
  snapshot_date DATE NOT NULL,
  balance NUMERIC(18,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, snapshot_date)
);

-- Cash flow forecasts
CREATE TABLE IF NOT EXISTS zvd_cash_flow_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES zvd_bank_accounts(id),
  expected_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('inflow','outflow')),
  amount NUMERIC(18,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  probability INT NOT NULL DEFAULT 100 CHECK (probability BETWEEN 0 AND 100),
  actual_transaction_id UUID REFERENCES zvd_bank_transactions(id),
  is_realized BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zvd_bank_transactions ADD COLUMN IF NOT EXISTS matched_invoice_id UUID;
ALTER TABLE zvd_bank_transactions ADD COLUMN IF NOT EXISTS matched_expense_id UUID;
ALTER TABLE zvd_bank_transactions ADD COLUMN IF NOT EXISTS auto_categorized BOOLEAN NOT NULL DEFAULT false;

