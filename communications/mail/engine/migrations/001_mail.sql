-- Mail Client Extension — consolidated schema
-- Tables: accounts, folders, messages, attachments, identities, signatures,
--         drafts, filters, contacts, pgp_keys + admin config

-- ═══ ACCOUNTS ═══
CREATE TABLE IF NOT EXISTS zv_mail_accounts (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name                  TEXT        NOT NULL,
  email_address         TEXT        NOT NULL,
  display_name          TEXT,

  imap_host             TEXT        NOT NULL,
  imap_port             INT         NOT NULL DEFAULT 993,
  imap_secure           BOOLEAN     NOT NULL DEFAULT true,
  imap_user             TEXT        NOT NULL,
  imap_password         TEXT        NOT NULL,
  imap_idle_supported   BOOLEAN     DEFAULT NULL,

  smtp_host             TEXT        NOT NULL,
  smtp_port             INT         NOT NULL DEFAULT 587,
  smtp_secure           BOOLEAN     NOT NULL DEFAULT true,
  smtp_user             TEXT,
  smtp_password         TEXT,

  sieve_host            TEXT        DEFAULT NULL,
  sieve_port            INT         DEFAULT 4190,

  oauth2_provider       TEXT        DEFAULT NULL CHECK (oauth2_provider IN ('gmail', 'outlook', NULL)),
  oauth2_access_token   TEXT        DEFAULT NULL,
  oauth2_refresh_token  TEXT        DEFAULT NULL,
  oauth2_expires_at     TIMESTAMPTZ DEFAULT NULL,

  is_default            BOOLEAN     NOT NULL DEFAULT false,
  is_active             BOOLEAN     NOT NULL DEFAULT true,
  last_sync_at          TIMESTAMPTZ,
  sync_error            TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_accounts_user
  ON zv_mail_accounts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mail_accounts_default
  ON zv_mail_accounts(user_id) WHERE is_default = true;

-- ═══ FOLDERS ═══
CREATE TABLE IF NOT EXISTS zv_mail_folders (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID        NOT NULL REFERENCES zv_mail_accounts(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  path          TEXT        NOT NULL,
  type          TEXT        DEFAULT 'other'
                CHECK (type IN ('inbox','sent','drafts','trash','spam','archive','other')),
  unread_count  INT         NOT NULL DEFAULT 0,
  total_count   INT         NOT NULL DEFAULT 0,
  last_uid      INT         DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(account_id, path)
);

CREATE INDEX IF NOT EXISTS idx_mail_folders_account ON zv_mail_folders(account_id);

-- ═══ MESSAGES ═══
CREATE TABLE IF NOT EXISTS zv_mail_messages (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id              UUID        NOT NULL REFERENCES zv_mail_accounts(id) ON DELETE CASCADE,
  folder_id               UUID        NOT NULL REFERENCES zv_mail_folders(id) ON DELETE CASCADE,
  message_id              TEXT,
  uid                     INT,
  thread_id               TEXT,

  from_address            TEXT        NOT NULL,
  from_name               TEXT,
  to_addresses            JSONB       NOT NULL DEFAULT '[]',
  cc_addresses            JSONB       NOT NULL DEFAULT '[]',
  bcc_addresses           JSONB       NOT NULL DEFAULT '[]',
  reply_to                TEXT,
  in_reply_to             TEXT,
  references_header       TEXT,

  subject                 TEXT,
  body_text               TEXT,
  body_html               TEXT,
  snippet                 TEXT,

  priority                TEXT        DEFAULT 'normal' CHECK (priority IN ('high','normal','low')),
  is_read                 BOOLEAN     NOT NULL DEFAULT false,
  is_starred              BOOLEAN     NOT NULL DEFAULT false,
  is_draft                BOOLEAN     NOT NULL DEFAULT false,
  has_attachments         BOOLEAN     NOT NULL DEFAULT false,
  is_encrypted            BOOLEAN     NOT NULL DEFAULT false,
  is_signed               BOOLEAN     NOT NULL DEFAULT false,
  read_receipt_requested  BOOLEAN     NOT NULL DEFAULT false,
  read_receipt_sent       BOOLEAN     NOT NULL DEFAULT false,

  tags                    TEXT[]      DEFAULT '{}',
  raw_headers             JSONB       DEFAULT '{}',
  sent_at                 TIMESTAMPTZ,
  received_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_messages_account
  ON zv_mail_messages(account_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_date
  ON zv_mail_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_mail_messages_thread
  ON zv_mail_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_mail_messages_from
  ON zv_mail_messages(from_address);
CREATE INDEX IF NOT EXISTS idx_mail_messages_unread
  ON zv_mail_messages(account_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_mail_messages_search
  ON zv_mail_messages
  USING GIN(to_tsvector('simple', COALESCE(subject,'') || ' ' || COALESCE(body_text,'')));

-- ═══ ATTACHMENTS ═══
CREATE TABLE IF NOT EXISTS zv_mail_attachments (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    UUID        NOT NULL REFERENCES zv_mail_messages(id) ON DELETE CASCADE,
  filename      TEXT        NOT NULL,
  mime_type     TEXT        NOT NULL,
  size_bytes    BIGINT      NOT NULL,
  storage_path  TEXT,
  content_id    TEXT,
  is_inline     BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_attachments_msg ON zv_mail_attachments(message_id);

-- ═══ SIGNATURES ═══
CREATE TABLE IF NOT EXISTS zv_mail_signatures (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  body_html     TEXT        NOT NULL DEFAULT '',
  body_text     TEXT        NOT NULL DEFAULT '',
  is_default    BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_signatures_user ON zv_mail_signatures(user_id);

-- ═══ IDENTITIES / ALIASES ═══
CREATE TABLE IF NOT EXISTS zv_mail_identities (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID        NOT NULL REFERENCES zv_mail_accounts(id) ON DELETE CASCADE,
  email_address TEXT        NOT NULL,
  display_name  TEXT,
  reply_to      TEXT,
  bcc_self      BOOLEAN     NOT NULL DEFAULT false,
  is_default    BOOLEAN     NOT NULL DEFAULT false,
  sort_order    INT         NOT NULL DEFAULT 0,
  signature_id  UUID        REFERENCES zv_mail_signatures(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_identities_account ON zv_mail_identities(account_id);

-- ═══ DRAFTS ═══
CREATE TABLE IF NOT EXISTS zv_mail_drafts (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           UUID        NOT NULL REFERENCES zv_mail_accounts(id) ON DELETE CASCADE,
  identity_id          UUID        REFERENCES zv_mail_identities(id) ON DELETE SET NULL,
  to_addresses         JSONB       NOT NULL DEFAULT '[]',
  cc_addresses         JSONB       NOT NULL DEFAULT '[]',
  bcc_addresses        JSONB       NOT NULL DEFAULT '[]',
  subject              TEXT        NOT NULL DEFAULT '',
  body_html            TEXT        NOT NULL DEFAULT '',
  body_text            TEXT        NOT NULL DEFAULT '',
  in_reply_to          TEXT,
  references_hdr       TEXT,
  reply_type           TEXT        CHECK (reply_type IN ('reply','reply_all','forward', NULL)),
  original_msg_id      UUID        REFERENCES zv_mail_messages(id) ON DELETE SET NULL,
  attachments          JSONB       NOT NULL DEFAULT '[]',
  priority             TEXT        DEFAULT 'normal' CHECK (priority IN ('high','normal','low')),
  request_read_receipt BOOLEAN     NOT NULL DEFAULT false,
  imap_uid             INT,
  auto_saved_at        TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_drafts_account ON zv_mail_drafts(account_id);

-- ═══ FILTERS (Sieve) ═══
CREATE TABLE IF NOT EXISTS zv_mail_filters (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    UUID        NOT NULL REFERENCES zv_mail_accounts(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  sort_order    INT         NOT NULL DEFAULT 0,
  conditions    JSONB       NOT NULL DEFAULT '[]',
  actions       JSONB       NOT NULL DEFAULT '[]',
  sieve_script  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_filters_account ON zv_mail_filters(account_id);

-- ═══ ADDRESS BOOK ═══
CREATE TABLE IF NOT EXISTS zv_mail_contacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  email         TEXT        NOT NULL,
  display_name  TEXT,
  company       TEXT,
  phone         TEXT,
  frequency     INT         NOT NULL DEFAULT 1,
  last_used_at  TIMESTAMPTZ,
  source        TEXT        DEFAULT 'auto' CHECK (source IN ('auto','manual','import')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_mail_contacts_user  ON zv_mail_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_contacts_email ON zv_mail_contacts(email);
CREATE INDEX IF NOT EXISTS idx_mail_contacts_freq  ON zv_mail_contacts(user_id, frequency DESC);

-- ═══ PGP KEYS ═══
CREATE TABLE IF NOT EXISTS zv_mail_pgp_keys (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  public_key  TEXT        NOT NULL,
  private_key TEXT,
  fingerprint TEXT        NOT NULL,
  is_own      BOOLEAN     NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_pgp_user  ON zv_mail_pgp_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_mail_pgp_email ON zv_mail_pgp_keys(email);

-- ═══ ADMIN CONFIG ═══
INSERT INTO zv_settings (key, value, description, is_public)
VALUES (
  'mail',
  '{
    "enabled": true,
    "max_accounts_per_user": 5,
    "max_attachment_size_mb": 25,
    "allowed_domains": [],
    "blocked_domains": [],
    "require_admin_approval": false,
    "auto_collect_contacts": true,
    "imap_idle_enabled": true,
    "sieve_enabled": true,
    "pgp_enabled": true,
    "oauth2_gmail_client_id": "",
    "oauth2_gmail_client_secret": "",
    "oauth2_outlook_client_id": "",
    "oauth2_outlook_client_secret": "",
    "max_messages_sync": 1000,
    "sync_interval_minutes": 5,
    "trash_auto_delete_days": 30
  }',
  'Mail client configuration',
  false
)
ON CONFLICT (key) DO NOTHING;
