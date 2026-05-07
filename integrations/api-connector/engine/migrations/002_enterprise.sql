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
