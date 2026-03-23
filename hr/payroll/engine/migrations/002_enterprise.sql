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
