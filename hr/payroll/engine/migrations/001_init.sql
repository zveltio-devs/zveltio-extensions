-- Payroll RO extension schema

CREATE TABLE IF NOT EXISTS zvd_payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','calculated','closed')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (year, month)
);

CREATE TABLE IF NOT EXISTS zvd_payroll_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES zvd_payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  gross_salary NUMERIC(15,2) NOT NULL DEFAULT 0,
  meal_vouchers NUMERIC(15,2) NOT NULL DEFAULT 0,
  other_benefits NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Employee contributions (2024 RO rates)
  cas_employee_rate NUMERIC(5,4) NOT NULL DEFAULT 0.25,
  cass_employee_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  income_tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  cas_employee NUMERIC(15,2) NOT NULL DEFAULT 0,
  cass_employee NUMERIC(15,2) NOT NULL DEFAULT 0,
  personal_deduction NUMERIC(15,2) NOT NULL DEFAULT 0,
  taxable_income NUMERIC(15,2) NOT NULL DEFAULT 0,
  income_tax NUMERIC(15,2) NOT NULL DEFAULT 0,
  net_salary NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Employer contributions
  cas_employer_rate NUMERIC(5,4) NOT NULL DEFAULT 0.04,
  cass_employer_rate NUMERIC(5,4) NOT NULL DEFAULT 0.00,
  cam_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0225,
  cas_employer NUMERIC(15,2) NOT NULL DEFAULT 0,
  cass_employer NUMERIC(15,2) NOT NULL DEFAULT 0,
  cam NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_employer_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (period_id, employee_id)
);

CREATE INDEX idx_zvd_payroll_entries_period ON zvd_payroll_entries(period_id);
CREATE INDEX idx_zvd_payroll_entries_employee ON zvd_payroll_entries(employee_id);

CREATE TABLE IF NOT EXISTS zvd_payroll_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES zvd_payroll_entries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bonus','deduction','advance','meal_vouchers','other')),
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
