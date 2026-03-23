-- Mileage tracking
CREATE TABLE IF NOT EXISTS zvd_mileage_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES zvd_expense_reports(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  date DATE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  distance_km NUMERIC(10,2) NOT NULL,
  rate_per_km NUMERIC(10,4) NOT NULL DEFAULT 0.25,
  amount NUMERIC(18,2) GENERATED ALWAYS AS (distance_km * rate_per_km) STORED,
  purpose TEXT,
  vehicle_type TEXT DEFAULT 'personal' CHECK (vehicle_type IN ('personal','company','rental')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-diem allowances
CREATE TABLE IF NOT EXISTS zvd_per_diem_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES zvd_expense_reports(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  date DATE NOT NULL,
  destination TEXT NOT NULL,
  rate NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  is_domestic BOOLEAN NOT NULL DEFAULT true,
  partial_day BOOLEAN NOT NULL DEFAULT false,
  meals_deducted NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reimbursements
CREATE TABLE IF NOT EXISTS zvd_expense_reimbursements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES zvd_expense_reports(id),
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  payment_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'transfer',
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns to expense reports
ALTER TABLE zvd_expense_reports ADD COLUMN IF NOT EXISTS reimbursed_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_expense_reports ADD COLUMN IF NOT EXISTS reimbursed_at TIMESTAMPTZ;
ALTER TABLE zvd_expense_reports ADD COLUMN IF NOT EXISTS mileage_total NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_expense_reports ADD COLUMN IF NOT EXISTS per_diem_total NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_expense_reports ADD COLUMN IF NOT EXISTS grand_total NUMERIC(18,2) NOT NULL DEFAULT 0;

-- Add exchange rate to expenses
ALTER TABLE zvd_expenses ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18,6) DEFAULT 1;
ALTER TABLE zvd_expenses ADD COLUMN IF NOT EXISTS amount_local NUMERIC(18,2);
ALTER TABLE zvd_expenses ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(18,2) DEFAULT 0;
ALTER TABLE zvd_expenses ADD COLUMN IF NOT EXISTS is_reimbursable BOOLEAN NOT NULL DEFAULT true;
