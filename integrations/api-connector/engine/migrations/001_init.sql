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
