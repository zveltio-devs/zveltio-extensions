-- Canned responses / macros
CREATE TABLE IF NOT EXISTS zvd_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shortcut TEXT UNIQUE,
  content TEXT NOT NULL,
  category_id UUID REFERENCES zvd_ticket_categories(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CSAT surveys
CREATE TABLE IF NOT EXISTS zvd_ticket_csat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES zvd_tickets(id) ON DELETE CASCADE UNIQUE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escalation rules
CREATE TABLE IF NOT EXISTS zvd_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low','medium','high','critical')),
  category_id UUID REFERENCES zvd_ticket_categories(id) ON DELETE SET NULL,
  condition_hours INT NOT NULL DEFAULT 4,
  condition_type TEXT NOT NULL DEFAULT 'no_response' CHECK (condition_type IN ('no_response','no_resolution','sla_breach')),
  action_assign_to TEXT,
  action_priority TEXT CHECK (action_priority IN ('low','medium','high','critical')),
  action_notify_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ticket escalation log
CREATE TABLE IF NOT EXISTS zvd_ticket_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES zvd_tickets(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES zvd_escalation_rules(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  escalated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Merge log (tracks which ticket was merged into which)
ALTER TABLE zvd_tickets ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES zvd_tickets(id);
ALTER TABLE zvd_tickets ADD COLUMN IF NOT EXISTS is_merged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zvd_tickets ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zvd_ticket_categories ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#6366f1';
ALTER TABLE zvd_ticket_categories ADD COLUMN IF NOT EXISTS sla_response_hours INT NOT NULL DEFAULT 4;
