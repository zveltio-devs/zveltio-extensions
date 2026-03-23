-- Email signatures per user
CREATE TABLE IF NOT EXISTS zvd_mail_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mail rules (auto-actions on incoming)
CREATE TABLE IF NOT EXISTS zvd_mail_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL,
  name TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  logic TEXT NOT NULL DEFAULT 'AND' CHECK (logic IN ('AND','OR')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  matched_count INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared mailboxes
CREATE TABLE IF NOT EXISTS zvd_mail_shared_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  description TEXT,
  account_id UUID NOT NULL,
  member_user_ids TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email snooze tracking
CREATE TABLE IF NOT EXISTS zvd_mail_snooze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  account_id UUID NOT NULL,
  snooze_until TIMESTAMPTZ NOT NULL,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, message_id)
);

-- Mail analytics (daily send stats)
CREATE TABLE IF NOT EXISTS zvd_mail_send_stats (
  date DATE NOT NULL,
  account_id UUID NOT NULL,
  sent_count INT NOT NULL DEFAULT 0,
  opened_count INT NOT NULL DEFAULT 0,
  bounced_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (date, account_id)
);

-- Add column to track reply-to and read receipts
ALTER TABLE zvd_mail_messages ADD COLUMN IF NOT EXISTS reply_to TEXT;
ALTER TABLE zvd_mail_messages ADD COLUMN IF NOT EXISTS read_receipt_requested BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zvd_mail_messages ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE zvd_mail_messages ADD COLUMN IF NOT EXISTS is_snoozed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_mail_rules_account ON zvd_mail_rules(account_id) WHERE is_active = true;
CREATE INDEX idx_mail_snooze_until ON zvd_mail_snooze(snooze_until) WHERE snooze_until > NOW();
