-- Emergency contacts (replaces single-field on employees table)
CREATE TABLE IF NOT EXISTS zvd_employee_emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES zvd_employees(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Salary history (audit trail)
CREATE TABLE IF NOT EXISTS zvd_salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES zvd_employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  salary NUMERIC(12,2) NOT NULL,
  salary_type TEXT NOT NULL DEFAULT 'gross' CHECK (salary_type IN ('gross','net')),
  currency TEXT NOT NULL DEFAULT 'RON',
  reason TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance review cycles
CREATE TABLE IF NOT EXISTS zvd_performance_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance reviews
CREATE TABLE IF NOT EXISTS zvd_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES zvd_performance_cycles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES zvd_employees(id) ON DELETE CASCADE,
  reviewer_id UUID,
  overall_rating NUMERIC(3,1) CHECK (overall_rating BETWEEN 1 AND 5),
  goals_rating NUMERIC(3,1) CHECK (goals_rating BETWEEN 1 AND 5),
  competency_rating NUMERIC(3,1) CHECK (competency_rating BETWEEN 1 AND 5),
  strengths TEXT,
  improvements TEXT,
  comments TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','submitted','acknowledged')),
  submitted_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id, employee_id)
);

-- Employee benefits
CREATE TABLE IF NOT EXISTS zvd_employee_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES zvd_employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT,
  value NUMERIC(12,2),
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add enterprise columns to employees
ALTER TABLE zvd_employees ADD COLUMN IF NOT EXISTS probation_end_date DATE;
ALTER TABLE zvd_employees ADD COLUMN IF NOT EXISTS work_email TEXT;
ALTER TABLE zvd_employees ADD COLUMN IF NOT EXISTS tax_id TEXT;
-- Add description and min/max salary to job positions
ALTER TABLE zvd_job_positions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE zvd_job_positions ADD COLUMN IF NOT EXISTS min_salary NUMERIC(12,2);
ALTER TABLE zvd_job_positions ADD COLUMN IF NOT EXISTS max_salary NUMERIC(12,2);
-- Add description to departments
ALTER TABLE zvd_departments ADD COLUMN IF NOT EXISTS description TEXT;
