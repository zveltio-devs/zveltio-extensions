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

CREATE INDEX idx_zvd_employees_dept ON zvd_employees(department_id);
CREATE INDEX idx_zvd_employees_status ON zvd_employees(status);
CREATE INDEX idx_zvd_employees_manager ON zvd_employees(manager_id);

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

CREATE INDEX idx_zvd_onboarding_employee ON zvd_onboarding_tasks(employee_id);
