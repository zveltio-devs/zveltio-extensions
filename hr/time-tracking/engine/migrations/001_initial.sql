-- 001_initial.sql
--
-- Consolidated initial schema for the `hr/time-tracking` extension.
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

-- ── from 002_enterprise.sql ──
-- Active timer (one per employee at a time)
CREATE TABLE IF NOT EXISTS zvd_active_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES zvd_time_projects(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL DEFAULT '',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_billable BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  UNIQUE (employee_id)
);

-- Entry tags for filtering/grouping
CREATE TABLE IF NOT EXISTS zvd_time_entry_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Many-to-many entries <-> tags
CREATE TABLE IF NOT EXISTS zvd_time_entry_tag_map (
  entry_id UUID NOT NULL REFERENCES zvd_time_entries(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES zvd_time_entry_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, tag_id)
);

-- Add enterprise columns to entries
ALTER TABLE zvd_time_entries ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE zvd_time_entries ADD COLUMN IF NOT EXISTS invoice_id UUID;
-- Add budget columns to projects
ALTER TABLE zvd_time_projects ADD COLUMN IF NOT EXISTS budget_amount NUMERIC(15,2);
ALTER TABLE zvd_time_projects ADD COLUMN IF NOT EXISTS description TEXT;

