-- 001_initial.sql
--
-- Consolidated initial schema for the `hr/leave` extension.
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

-- ── from 002_enterprise.sql ──
-- Public holidays table (Romanian calendar)
CREATE TABLE IF NOT EXISTS zvd_public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  year INT NOT NULL,
  UNIQUE (date)
);

-- Seed Romanian public holidays 2025
INSERT INTO zvd_public_holidays (date, name, year) VALUES
  ('2025-01-01', 'Anul Nou', 2025),
  ('2025-01-02', 'Ziua de după Anul Nou', 2025),
  ('2025-01-24', 'Ziua Unirii Principatelor', 2025),
  ('2025-04-18', 'Vinerea Mare', 2025),
  ('2025-04-20', 'Paștele ortodox', 2025),
  ('2025-04-21', 'A doua zi de Paști', 2025),
  ('2025-05-01', 'Ziua Muncii', 2025),
  ('2025-06-01', 'Ziua Copilului', 2025),
  ('2025-06-08', 'Rusalii', 2025),
  ('2025-06-09', 'A doua zi de Rusalii', 2025),
  ('2025-08-15', 'Adormirea Maicii Domnului', 2025),
  ('2025-11-30', 'Sf. Andrei', 2025),
  ('2025-12-01', 'Ziua Națională', 2025),
  ('2025-12-25', 'Crăciun', 2025),
  ('2025-12-26', 'A doua zi de Crăciun', 2025)
ON CONFLICT (date) DO NOTHING;

-- Leave carry-over rules
CREATE TABLE IF NOT EXISTS zvd_leave_carryover_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type_id UUID NOT NULL REFERENCES zvd_leave_types(id) ON DELETE CASCADE,
  max_carry_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  expiry_months INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (leave_type_id)
);

-- Leave carry-over log
CREATE TABLE IF NOT EXISTS zvd_leave_carryover_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  leave_type_id UUID NOT NULL REFERENCES zvd_leave_types(id),
  from_year INT NOT NULL,
  to_year INT NOT NULL,
  days_carried NUMERIC(5,1) NOT NULL,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add half-day support and overlap tracking to leave requests
ALTER TABLE zvd_leave_requests ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zvd_leave_requests ADD COLUMN IF NOT EXISTS half_day_period TEXT CHECK (half_day_period IN ('am','pm'));
ALTER TABLE zvd_leave_requests ADD COLUMN IF NOT EXISTS cover_employee_id UUID;
ALTER TABLE zvd_leave_requests ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]';
-- Add carry-over tracking to balances
ALTER TABLE zvd_leave_balances ADD COLUMN IF NOT EXISTS carried_over_days NUMERIC(5,1) NOT NULL DEFAULT 0;
ALTER TABLE zvd_leave_balances ADD COLUMN IF NOT EXISTS carryover_expires_at DATE;

