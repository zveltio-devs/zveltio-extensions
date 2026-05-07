-- Persisted named queries
CREATE TABLE IF NOT EXISTS zvd_graphql_persisted_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  query TEXT NOT NULL,
  variables_schema JSONB,
  is_public BOOLEAN NOT NULL DEFAULT false,
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',
  use_count INT NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operation execution logs
CREATE TABLE IF NOT EXISTS zvd_graphql_operation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_name TEXT,
  operation_type TEXT NOT NULL DEFAULT 'query' CHECK (operation_type IN ('query','mutation','subscription')),
  query_hash TEXT NOT NULL,
  variables JSONB,
  duration_ms INT,
  result_size_bytes INT,
  error_count INT NOT NULL DEFAULT 0,
  user_id TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_graphql_logs_user ON zvd_graphql_operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_graphql_logs_created ON zvd_graphql_operation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_graphql_logs_op_name ON zvd_graphql_operation_logs(operation_name);

-- GraphQL access control (per-collection field restrictions)
CREATE TABLE IF NOT EXISTS zvd_graphql_field_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  field TEXT NOT NULL,
  allowed_roles TEXT[] NOT NULL DEFAULT '{}',
  deny_roles TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection, field)
);
