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
