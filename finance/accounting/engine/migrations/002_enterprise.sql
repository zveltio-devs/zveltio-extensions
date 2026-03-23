-- Fiscal Years
CREATE TABLE IF NOT EXISTS zvd_fiscal_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS zvd_exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(18,6) NOT NULL,
  date DATE NOT NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, date)
);

-- Budgets
CREATE TABLE IF NOT EXISTS zvd_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year_id UUID NOT NULL REFERENCES zvd_fiscal_years(id),
  account_id UUID NOT NULL REFERENCES zvd_accounts(id),
  month INT CHECK (month BETWEEN 1 AND 12),
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fiscal_year_id, account_id, month)
);

-- Recurring Journal Templates
CREATE TABLE IF NOT EXISTS zvd_recurring_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  reference TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','quarterly','yearly')),
  next_run_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_recurring_journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_id UUID NOT NULL REFERENCES zvd_recurring_journals(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES zvd_accounts(id),
  debit NUMERIC(18,2) NOT NULL DEFAULT 0,
  credit NUMERIC(18,2) NOT NULL DEFAULT 0,
  description TEXT
);

-- Cost Centers
CREATE TABLE IF NOT EXISTS zvd_cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES zvd_cost_centers(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add cost_center_id to journal lines
ALTER TABLE zvd_journal_lines ADD COLUMN IF NOT EXISTS cost_center_id UUID REFERENCES zvd_cost_centers(id);
ALTER TABLE zvd_journal_lines ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'RON';
ALTER TABLE zvd_journal_lines ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18,6) DEFAULT 1;
ALTER TABLE zvd_journal_lines ADD COLUMN IF NOT EXISTS amount_foreign NUMERIC(18,2);

-- Add fiscal_year_id to journal entries
ALTER TABLE zvd_journal_entries ADD COLUMN IF NOT EXISTS fiscal_year_id UUID REFERENCES zvd_fiscal_years(id);

-- Tax Report Runs
CREATE TABLE IF NOT EXISTS zvd_tax_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('D300','D394','D390')),
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','accepted','rejected')),
  xml_content TEXT,
  submitted_at TIMESTAMPTZ,
  anaf_ref TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
