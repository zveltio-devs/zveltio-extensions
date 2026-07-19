-- 001_initial.sql
--
-- Consolidated initial schema for the `storage/cloud` extension.
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
--   • 001_cloud.sql
--   • 002_enterprise.sql

-- ── from 001_cloud.sql ──
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Cloud Storage Extension
-- File versioning, soft-delete trash bin, and public share links

CREATE TABLE IF NOT EXISTS zv_cloud_file_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_key    TEXT NOT NULL,          -- SeaweedFS object key
  bucket      TEXT NOT NULL DEFAULT 'zveltio',
  version     INTEGER NOT NULL DEFAULT 1,
  size        BIGINT NOT NULL DEFAULT 0,
  content_type TEXT,
  etag        TEXT,
  created_by  TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(file_key, version)
);

CREATE TABLE IF NOT EXISTS zv_cloud_trash (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_key      TEXT NOT NULL,
  original_path TEXT NOT NULL,
  bucket        TEXT NOT NULL DEFAULT 'zveltio',
  size          BIGINT NOT NULL DEFAULT 0,
  content_type  TEXT,
  deleted_by    TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  deleted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Auto-purge after 30 days
  purge_after   TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '30 days'
);

CREATE TABLE IF NOT EXISTS zv_cloud_shares (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'base64url'),
  file_key    TEXT NOT NULL,
  bucket      TEXT NOT NULL DEFAULT 'zveltio',
  filename    TEXT,
  content_type TEXT,
  -- Access control
  password_hash TEXT,             -- optional password protection
  max_downloads INTEGER,          -- NULL = unlimited
  download_count INTEGER NOT NULL DEFAULT 0,
  expires_at  TIMESTAMPTZ,        -- NULL = never expires
  -- Metadata
  created_by  TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cloud_versions_key ON zv_cloud_file_versions(file_key);
CREATE INDEX IF NOT EXISTS idx_cloud_trash_purge ON zv_cloud_trash(purge_after);
CREATE INDEX IF NOT EXISTS idx_cloud_shares_token ON zv_cloud_shares(token);

-- ── from 002_enterprise.sql ──
-- Storage quotas (per user/role)
CREATE TABLE IF NOT EXISTS zv_storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE,
  role_name TEXT UNIQUE,
  quota_bytes BIGINT NOT NULL DEFAULT 5368709120,
  max_file_size_bytes BIGINT NOT NULL DEFAULT 104857600,
  allowed_extensions TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (user_id IS NOT NULL OR role_name IS NOT NULL)
);

-- File access audit log
CREATE TABLE IF NOT EXISTS zv_cloud_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id TEXT NOT NULL,
  user_id TEXT,
  ip TEXT,
  action TEXT NOT NULL CHECK (action IN ('view','download','upload','delete','share','version')),
  share_token TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cloud_access_logs_file ON zv_cloud_access_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_cloud_access_logs_user ON zv_cloud_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_access_logs_created ON zv_cloud_access_logs(created_at DESC);

-- Retention policies
CREATE TABLE IF NOT EXISTS zv_cloud_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  folder_path TEXT,
  file_extension TEXT,
  max_versions INT NOT NULL DEFAULT 10,
  delete_after_days INT,
  archive_after_days INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- The CORE engine also creates zv_storage_quotas (old shape: user_id /
-- quota_bytes / used_bytes only), so the CREATE above is skipped there.
-- Enrich it with the columns these routes use.
ALTER TABLE zv_storage_quotas ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE zv_storage_quotas ADD COLUMN IF NOT EXISTS role_name TEXT;
ALTER TABLE zv_storage_quotas ADD COLUMN IF NOT EXISTS max_file_size_bytes BIGINT NOT NULL DEFAULT 104857600;
ALTER TABLE zv_storage_quotas ADD COLUMN IF NOT EXISTS allowed_extensions TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE zv_storage_quotas ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE zv_storage_quotas ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
