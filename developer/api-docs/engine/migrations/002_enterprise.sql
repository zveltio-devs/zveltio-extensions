-- API version changelogs
CREATE TABLE IF NOT EXISTS zvd_api_changelogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  changes TEXT NOT NULL,
  breaking_changes TEXT,
  migration_guide TEXT,
  published_at TIMESTAMPTZ,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API access tokens for testing
CREATE TABLE IF NOT EXISTS zvd_api_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  use_count INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

-- Custom documentation sections
CREATE TABLE IF NOT EXISTS zvd_api_custom_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  body TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
