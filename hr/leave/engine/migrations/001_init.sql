-- Leave Management extension schema

CREATE TABLE IF NOT EXISTS zvd_leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  days_per_year NUMERIC(5,1) NOT NULL DEFAULT 21,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  color TEXT DEFAULT '#069494',
  requires_approval BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO zvd_leave_types (id, name, code, days_per_year, is_paid, color, requires_approval, created_by)
VALUES
  (gen_random_uuid(), 'Annual Leave', 'CO', 21, true, '#069494', true, 'system'),
  (gen_random_uuid(), 'Sick Leave', 'CM', 30, true, '#ef4444', false, 'system'),
  (gen_random_uuid(), 'Unpaid Leave', 'CFP', 30, false, '#94a3b8', true, 'system')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS zvd_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  leave_type_id UUID NOT NULL REFERENCES zvd_leave_types(id) ON DELETE CASCADE,
  year INT NOT NULL,
  allocated_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  used_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  pending_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employee_id, leave_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_zvd_leave_balances_employee ON zvd_leave_balances(employee_id);

CREATE TABLE IF NOT EXISTS zvd_leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  leave_type_id UUID NOT NULL REFERENCES zvd_leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  working_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft','pending','approved','rejected','cancelled')),
  reason TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_leave_requests_employee ON zvd_leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_zvd_leave_requests_status ON zvd_leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_zvd_leave_requests_dates ON zvd_leave_requests(start_date, end_date);
