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

CREATE INDEX idx_zvd_tickets_status ON zvd_tickets(status);
CREATE INDEX idx_zvd_tickets_priority ON zvd_tickets(priority);
CREATE INDEX idx_zvd_tickets_assignee ON zvd_tickets(assignee_id);
CREATE INDEX idx_zvd_tickets_requester ON zvd_tickets(requester_id);
CREATE INDEX idx_zvd_tickets_sla ON zvd_tickets(sla_due_at);

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

CREATE INDEX idx_zvd_ticket_messages_ticket ON zvd_ticket_messages(ticket_id);
