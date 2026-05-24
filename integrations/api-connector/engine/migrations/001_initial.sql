-- 001_initial.sql
--
-- Consolidated initial schema for the `integrations/api-connector` extension.
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
-- API Connector extension schema

CREATE TABLE IF NOT EXISTS zvd_api_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  auth_type TEXT NOT NULL DEFAULT 'none' CHECK (auth_type IN ('none','bearer','api_key','basic','oauth2')),
  auth_config JSONB NOT NULL DEFAULT '{}',
  headers JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_api_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES zvd_api_connections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET' CHECK (method IN ('GET','POST','PUT','PATCH','DELETE')),
  path TEXT NOT NULL,
  description TEXT,
  request_body_template JSONB,
  response_mapping JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_api_endpoints_connection ON zvd_api_endpoints(connection_id);

CREATE TABLE IF NOT EXISTS zvd_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint_id UUID NOT NULL REFERENCES zvd_api_endpoints(id) ON DELETE CASCADE,
  status_code INT,
  request_body JSONB,
  response_body JSONB,
  duration_ms INT,
  error TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_api_logs_endpoint ON zvd_api_logs(endpoint_id);
CREATE INDEX IF NOT EXISTS idx_zvd_api_logs_created ON zvd_api_logs(created_at);

-- ── from 002_enterprise.sql ──
-- OAuth2 token cache
CREATE TABLE IF NOT EXISTS zvd_api_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES zvd_api_connections(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  scope TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incoming webhooks
CREATE TABLE IF NOT EXISTS zvd_incoming_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES zvd_api_connections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  secret TEXT,
  endpoint_path TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_received_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Incoming webhook events
CREATE TABLE IF NOT EXISTS zvd_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES zvd_incoming_webhooks(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}',
  headers JSONB NOT NULL DEFAULT '{}',
  source_ip TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','failed')),
  error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_webhook_events_webhook ON zvd_webhook_events(webhook_id);
CREATE INDEX IF NOT EXISTS idx_zvd_webhook_events_received ON zvd_webhook_events(received_at);

-- Add columns to connections and logs
ALTER TABLE zvd_api_connections ADD COLUMN IF NOT EXISTS default_headers JSONB NOT NULL DEFAULT '{}';
ALTER TABLE zvd_api_connections ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 3;
ALTER TABLE zvd_api_connections ADD COLUMN IF NOT EXISTS timeout_ms INT NOT NULL DEFAULT 30000;
ALTER TABLE zvd_api_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE zvd_api_logs ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE zvd_api_logs ADD COLUMN IF NOT EXISTS method TEXT;
ALTER TABLE zvd_api_logs ADD COLUMN IF NOT EXISTS response_status INT;
ALTER TABLE zvd_api_logs ADD COLUMN IF NOT EXISTS response_body TEXT;
ALTER TABLE zvd_api_logs ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE zvd_api_logs ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0;
-- Add to endpoints
ALTER TABLE zvd_api_endpoints ADD COLUMN IF NOT EXISTS default_body TEXT;
ALTER TABLE zvd_api_endpoints ADD COLUMN IF NOT EXISTS default_headers JSONB NOT NULL DEFAULT '{}';
ALTER TABLE zvd_api_endpoints ADD COLUMN IF NOT EXISTS response_mapping JSONB;

