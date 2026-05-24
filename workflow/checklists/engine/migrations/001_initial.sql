-- 001_initial.sql
--
-- Consolidated initial schema for the `workflow/checklists` extension.
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
--   • 001_checklists.sql
--   • 002_enterprise.sql

-- ── from 001_checklists.sql ──
-- Checklist templates (reusable definitions)
CREATE TABLE IF NOT EXISTS zv_checklist_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  collection  TEXT, -- null = global template
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items within a template
CREATE TABLE IF NOT EXISTS zv_checklist_template_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES zv_checklist_templates(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  description TEXT,
  required    BOOLEAN NOT NULL DEFAULT false,
  order_idx   INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Checklist instances attached to records
CREATE TABLE IF NOT EXISTS zv_checklists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  UUID REFERENCES zv_checklist_templates(id) ON DELETE SET NULL,
  collection   TEXT NOT NULL,
  record_id    UUID NOT NULL,
  name         TEXT NOT NULL,
  created_by   UUID,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Individual check items on a checklist instance
CREATE TABLE IF NOT EXISTS zv_checklist_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES zv_checklists(id) ON DELETE CASCADE,
  label        TEXT NOT NULL,
  description  TEXT,
  required     BOOLEAN NOT NULL DEFAULT false,
  order_idx    INTEGER NOT NULL DEFAULT 0,
  checked      BOOLEAN NOT NULL DEFAULT false,
  checked_by   UUID,
  checked_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklists_record ON zv_checklists(collection, record_id);
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON zv_checklist_items(checklist_id);

-- ── from 002_enterprise.sql ──
-- Conditional items (show item only when another item is checked)
ALTER TABLE zv_checklist_template_items ADD COLUMN IF NOT EXISTS condition_item_label TEXT;
ALTER TABLE zv_checklist_template_items ADD COLUMN IF NOT EXISTS condition_checked BOOLEAN;
ALTER TABLE zv_checklist_template_items ADD COLUMN IF NOT EXISTS time_estimate_minutes INT;
ALTER TABLE zv_checklist_template_items ADD COLUMN IF NOT EXISTS assignee_role TEXT;

-- Actual time spent on checklist items
ALTER TABLE zv_checklist_items ADD COLUMN IF NOT EXISTS time_spent_minutes INT;
ALTER TABLE zv_checklist_items ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
ALTER TABLE zv_checklist_items ADD COLUMN IF NOT EXISTS assignee_user_id TEXT;
ALTER TABLE zv_checklist_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- Recurrence schedules for checklists
CREATE TABLE IF NOT EXISTS zv_checklist_recurrence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES zv_checklist_templates(id) ON DELETE CASCADE,
  collection TEXT NOT NULL,
  record_id UUID NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily','weekly','monthly','quarterly')),
  next_run_at TIMESTAMPTZ NOT NULL,
  last_run_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Checklist completion history (for analytics)
ALTER TABLE zv_checklists ADD COLUMN IF NOT EXISTS time_to_complete_minutes INT;
ALTER TABLE zv_checklists ADD COLUMN IF NOT EXISTS completed_by UUID;

