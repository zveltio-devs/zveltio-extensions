-- 001_initial.sql
--
-- Consolidated initial schema for the `workflow/approvals` extension.
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
--   • 001_approvals.sql
--   • 002_enterprise.sql

-- ── from 001_approvals.sql ──
-- Approval Workflows extension — initial schema

CREATE TABLE IF NOT EXISTS zv_approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  collection TEXT NOT NULL,
  trigger_field TEXT,
  trigger_value TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_approval_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES zv_approval_workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  approver_role TEXT,
  approver_user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  deadline_hours INTEGER,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES zv_approval_workflows(id),
  collection TEXT NOT NULL,
  record_id TEXT NOT NULL,
  current_step_id UUID REFERENCES zv_approval_steps(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS zv_approval_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES zv_approval_requests(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES zv_approval_steps(id),
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'skipped')),
  decided_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  comment TEXT,
  decided_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_collection ON zv_approval_workflows(collection);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_active ON zv_approval_workflows(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_approval_steps_workflow ON zv_approval_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_approval_requests_workflow ON zv_approval_requests(workflow_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_collection ON zv_approval_requests(collection, record_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON zv_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_by ON zv_approval_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_request ON zv_approval_decisions(request_id);
CREATE INDEX IF NOT EXISTS idx_approval_decisions_by ON zv_approval_decisions(decided_by);

CREATE OR REPLACE FUNCTION update_approval_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_approval_workflow_updated_at
  BEFORE UPDATE ON zv_approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_approval_workflow_updated_at();

-- ── from 002_enterprise.sql ──
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

