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
