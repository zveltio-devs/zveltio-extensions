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
