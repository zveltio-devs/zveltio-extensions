-- Accounting extension schema

CREATE TABLE IF NOT EXISTS zvd_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense')),
  parent_id UUID REFERENCES zvd_accounts(id) ON DELETE SET NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_accounts_type ON zvd_accounts(type);
CREATE INDEX IF NOT EXISTS idx_zvd_accounts_parent ON zvd_accounts(parent_id);

CREATE TABLE IF NOT EXISTS zvd_journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','posted','voided')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_journal_entries_date ON zvd_journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_zvd_journal_entries_status ON zvd_journal_entries(status);

CREATE TABLE IF NOT EXISTS zvd_journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES zvd_journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES zvd_accounts(id),
  debit NUMERIC(15,2) NOT NULL DEFAULT 0,
  credit NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_journal_lines_entry ON zvd_journal_lines(entry_id);
CREATE INDEX IF NOT EXISTS idx_zvd_journal_lines_account ON zvd_journal_lines(account_id);
