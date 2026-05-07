-- Scan profiles (saved configurations)
CREATE TABLE IF NOT EXISTS zvd_byod_scan_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  db_schema TEXT NOT NULL DEFAULT 'public',
  exclude_patterns TEXT[] NOT NULL DEFAULT '{}',
  auto_sync BOOLEAN NOT NULL DEFAULT false,
  sync_interval_hours INT NOT NULL DEFAULT 24,
  last_sync_at TIMESTAMPTZ,
  next_sync_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scan history
CREATE TABLE IF NOT EXISTS zvd_byod_scan_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES zvd_byod_scan_profiles(id) ON DELETE SET NULL,
  schema_name TEXT NOT NULL,
  tables_found INT NOT NULL DEFAULT 0,
  tables_imported INT NOT NULL DEFAULT 0,
  tables_updated INT NOT NULL DEFAULT 0,
  tables_skipped INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed','failed')),
  error TEXT,
  triggered_by TEXT NOT NULL DEFAULT 'manual',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_byod_scan_history_profile ON zvd_byod_scan_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_byod_scan_history_created ON zvd_byod_scan_history(created_at DESC);
