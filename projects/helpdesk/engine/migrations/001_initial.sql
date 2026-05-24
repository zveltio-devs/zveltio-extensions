-- 001_initial.sql
--
-- Consolidated initial schema for the `projects/helpdesk` extension.
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
-- Helpdesk extension schema

CREATE TABLE IF NOT EXISTS zvd_ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  default_priority TEXT NOT NULL DEFAULT 'medium' CHECK (default_priority IN ('low','medium','high','critical')),
  sla_hours INT NOT NULL DEFAULT 24,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES zvd_ticket_categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','pending_customer','resolved','closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  requester_id TEXT,
  requester_email TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  assignee_id TEXT,
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('email','web','phone','api')),
  sla_due_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zvd_tickets_status ON zvd_tickets(status);
CREATE INDEX IF NOT EXISTS idx_zvd_tickets_priority ON zvd_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_zvd_tickets_assignee ON zvd_tickets(assignee_id);
CREATE INDEX IF NOT EXISTS idx_zvd_tickets_requester ON zvd_tickets(requester_id);
CREATE INDEX IF NOT EXISTS idx_zvd_tickets_sla ON zvd_tickets(sla_due_at);

CREATE TABLE IF NOT EXISTS zvd_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES zvd_tickets(id) ON DELETE CASCADE,
  author_id TEXT,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  attachments JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_ticket_messages_ticket ON zvd_ticket_messages(ticket_id);

-- ── from 002_enterprise.sql ──
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

