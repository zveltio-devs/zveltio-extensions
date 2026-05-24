-- 001_initial.sql
--
-- Consolidated initial schema for the `projects/management` extension.
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
-- Project Management extension schema

CREATE TABLE IF NOT EXISTS zvd_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  client_id TEXT,
  client_type TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','on_hold','completed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC(15,2),
  currency TEXT DEFAULT 'RON',
  progress_percent INT NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  color TEXT DEFAULT '#069494',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_projects_status ON zvd_projects(status);

CREATE TABLE IF NOT EXISTS zvd_project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES zvd_projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','manager','member','viewer')),
  UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS zvd_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES zvd_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_milestones_project ON zvd_milestones(project_id);

CREATE TABLE IF NOT EXISTS zvd_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES zvd_projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES zvd_milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','in_review','done','blocked')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  assignee_id TEXT,
  due_date DATE,
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2),
  tags TEXT[] DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_tasks_project ON zvd_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_zvd_tasks_status ON zvd_tasks(status);
CREATE INDEX IF NOT EXISTS idx_zvd_tasks_assignee ON zvd_tasks(assignee_id);

CREATE TABLE IF NOT EXISTS zvd_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES zvd_tasks(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_task_comments_task ON zvd_task_comments(task_id);

-- ── from 002_enterprise.sql ──
-- Task dependencies (blocking relationships)
CREATE TABLE IF NOT EXISTS zvd_task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES zvd_tasks(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES zvd_tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'finish_to_start' CHECK (type IN ('finish_to_start','start_to_start','finish_to_finish')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, depends_on_id),
  CHECK (task_id != depends_on_id)
);

-- Subtasks
CREATE TABLE IF NOT EXISTS zvd_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES zvd_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  assignee_id TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_subtasks_task ON zvd_subtasks(task_id);

-- File attachments
CREATE TABLE IF NOT EXISTS zvd_task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES zvd_tasks(id) ON DELETE CASCADE,
  project_id UUID REFERENCES zvd_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Custom field definitions
CREATE TABLE IF NOT EXISTS zvd_project_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES zvd_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text','number','date','select','boolean','url')),
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, name)
);

-- Custom field values on tasks
CREATE TABLE IF NOT EXISTS zvd_task_custom_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES zvd_tasks(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES zvd_project_custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  UNIQUE (task_id, field_id)
);

-- Add enterprise columns to projects and tasks
ALTER TABLE zvd_projects ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE zvd_tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES zvd_tasks(id) ON DELETE SET NULL;
ALTER TABLE zvd_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE zvd_tasks ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE zvd_tasks ADD COLUMN IF NOT EXISTS story_points INT;
ALTER TABLE zvd_milestones ADD COLUMN IF NOT EXISTS title TEXT;

