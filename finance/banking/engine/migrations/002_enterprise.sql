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
