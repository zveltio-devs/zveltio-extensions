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
