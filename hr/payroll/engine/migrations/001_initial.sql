-- 001_initial.sql
--
-- Consolidated initial schema for the `hr/payroll` extension.
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

CREATE INDEX IF NOT EXISTS idx_zvd_payroll_entries_period ON zvd_payroll_entries(period_id);
CREATE INDEX IF NOT EXISTS idx_zvd_payroll_entries_employee ON zvd_payroll_entries(employee_id);

CREATE TABLE IF NOT EXISTS zvd_payroll_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES zvd_payroll_entries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bonus','deduction','advance','meal_vouchers','other')),
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── from 002_enterprise.sql ──
-- Sick leave records (linked to leave requests)
CREATE TABLE IF NOT EXISTS zvd_payroll_sick_leave (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES zvd_payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  days INT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  leave_request_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Meal voucher allocations
CREATE TABLE IF NOT EXISTS zvd_payroll_meal_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES zvd_payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  face_value NUMERIC(8,2) NOT NULL DEFAULT 40.00,
  total_value NUMERIC(15,2) GENERATED ALWAYS AS (quantity * face_value) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (period_id, employee_id)
);

-- Overtime tracking
CREATE TABLE IF NOT EXISTS zvd_payroll_overtime (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES zvd_payroll_periods(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  hours NUMERIC(6,2) NOT NULL,
  rate_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.75,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  is_night_shift BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- D112/ReviSal export log
CREATE TABLE IF NOT EXISTS zvd_payroll_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES zvd_payroll_periods(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('d112','revisal','payslips')),
  file_content TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID
);

-- Add columns to payroll entries
ALTER TABLE zvd_payroll_entries ADD COLUMN IF NOT EXISTS sick_leave_days INT NOT NULL DEFAULT 0;
ALTER TABLE zvd_payroll_entries ADD COLUMN IF NOT EXISTS sick_leave_amount NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_payroll_entries ADD COLUMN IF NOT EXISTS meal_vouchers_amount NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_payroll_entries ADD COLUMN IF NOT EXISTS overtime_amount NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_payroll_entries ADD COLUMN IF NOT EXISTS night_shift_bonus NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_payroll_entries ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
-- Add approved_by, paid_at to periods
ALTER TABLE zvd_payroll_periods ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE zvd_payroll_periods ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE zvd_payroll_periods ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE zvd_payroll_periods ADD COLUMN IF NOT EXISTS notes TEXT;
-- Extend adjustment types
ALTER TABLE zvd_payroll_adjustments ADD COLUMN IF NOT EXISTS taxable BOOLEAN NOT NULL DEFAULT true;

