-- Time Tracking extension schema

CREATE TABLE IF NOT EXISTS zvd_time_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT,
  client_id TEXT,
  code TEXT,
  is_billable BOOLEAN NOT NULL DEFAULT true,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RON',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  budget_hours NUMERIC(10,2),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES zvd_time_projects(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_minutes INT NOT NULL DEFAULT 0,
  is_billable BOOLEAN NOT NULL DEFAULT true,
  is_billed BOOLEAN NOT NULL DEFAULT false,
  hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_time_entries_employee ON zvd_time_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_zvd_time_entries_project ON zvd_time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_zvd_time_entries_date ON zvd_time_entries(date);

CREATE TABLE IF NOT EXISTS zvd_timesheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected')),
  total_hours NUMERIC(10,2) NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  UNIQUE (employee_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_zvd_timesheets_employee ON zvd_timesheets(employee_id);
CREATE INDEX IF NOT EXISTS idx_zvd_timesheets_status ON zvd_timesheets(status);
