-- Approval delegation (delegate your approval rights to another user)
CREATE TABLE IF NOT EXISTS zv_approval_delegates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id TEXT NOT NULL,
  delegate_id TEXT NOT NULL,
  workflow_id UUID REFERENCES zv_approval_workflows(id) ON DELETE CASCADE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (delegator_id, delegate_id, workflow_id)
);

-- SLA breach alerts
CREATE TABLE IF NOT EXISTS zv_approval_sla_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES zv_approval_requests(id) ON DELETE CASCADE,
  step_id UUID REFERENCES zv_approval_steps(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL DEFAULT 'overdue' CHECK (alert_type IN ('reminder','overdue','escalated')),
  sent_to TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Approval templates (pre-configured request payloads)
CREATE TABLE IF NOT EXISTS zv_approval_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  workflow_id UUID NOT NULL REFERENCES zv_approval_workflows(id) ON DELETE CASCADE,
  default_metadata JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add to steps: condition, parallel approvers, escalation
ALTER TABLE zv_approval_steps ADD COLUMN IF NOT EXISTS condition_field TEXT;
ALTER TABLE zv_approval_steps ADD COLUMN IF NOT EXISTS condition_value TEXT;
ALTER TABLE zv_approval_steps ADD COLUMN IF NOT EXISTS allow_parallel BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zv_approval_steps ADD COLUMN IF NOT EXISTS escalation_user_id TEXT;
ALTER TABLE zv_approval_steps ADD COLUMN IF NOT EXISTS escalation_hours INT;

-- Add to requests: priority, sla_due_at, sla_breached, reminder_sent_at
ALTER TABLE zv_approval_requests ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent'));
ALTER TABLE zv_approval_requests ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMPTZ;
ALTER TABLE zv_approval_requests ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zv_approval_requests ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
ALTER TABLE zv_approval_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_approval_sla ON zv_approval_requests(sla_due_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_approval_delegates ON zv_approval_delegates(delegate_id) WHERE is_active = true;
