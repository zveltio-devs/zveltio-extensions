-- 001_initial.sql
--
-- Consolidated initial schema for the `hr/employees` extension.
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
-- HR Employees extension schema

CREATE TABLE IF NOT EXISTS zvd_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manager_id UUID,
  parent_id UUID REFERENCES zvd_departments(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_job_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department_id UUID REFERENCES zvd_departments(id) ON DELETE SET NULL,
  level TEXT NOT NULL DEFAULT 'mid' CHECK (level IN ('junior','mid','senior','lead','manager','director','executive')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  employee_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('m','f','other')),
  national_id TEXT,
  address TEXT,
  position_id UUID REFERENCES zvd_job_positions(id) ON DELETE SET NULL,
  department_id UUID REFERENCES zvd_departments(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES zvd_employees(id) ON DELETE SET NULL,
  hire_date DATE NOT NULL,
  end_date DATE,
  employment_type TEXT NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time','part_time','contractor','intern')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave','terminated')),
  salary NUMERIC(15,2),
  currency TEXT DEFAULT 'RON',
  iban TEXT,
  bank_name TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  avatar_url TEXT,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_employees_dept ON zvd_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_zvd_employees_status ON zvd_employees(status);
CREATE INDEX IF NOT EXISTS idx_zvd_employees_manager ON zvd_employees(manager_id);

CREATE TABLE IF NOT EXISTS zvd_employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES zvd_employees(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('contract','id_card','diploma','certificate','other')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  expires_at DATE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES zvd_employees(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  assigned_to TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_onboarding_employee ON zvd_onboarding_tasks(employee_id);

-- ── from 002_enterprise.sql ──
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

