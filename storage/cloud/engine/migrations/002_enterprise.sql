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
