-- Import mappings (field name remapping)
CREATE TABLE IF NOT EXISTS zvd_import_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transform TEXT,
  default_value TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import profiles (saved configurations)
CREATE TABLE IF NOT EXISTS zvd_import_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  delimiter TEXT NOT NULL DEFAULT ',',
  has_header BOOLEAN NOT NULL DEFAULT true,
  encoding TEXT NOT NULL DEFAULT 'UTF-8',
  on_duplicate TEXT NOT NULL DEFAULT 'skip' CHECK (on_duplicate IN ('skip','update','error')),
  mappings JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Import rollback support
CREATE TABLE IF NOT EXISTS zvd_import_rollbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES zv_import_logs(id) ON DELETE CASCADE,
  record_ids UUID[] NOT NULL DEFAULT '{}',
  rolled_back_at TIMESTAMPTZ,
  rolled_back_by TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','rolled_back','expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zv_import_logs ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES zvd_import_profiles(id) ON DELETE SET NULL;
ALTER TABLE zv_import_logs ADD COLUMN IF NOT EXISTS on_duplicate TEXT NOT NULL DEFAULT 'skip';
ALTER TABLE zv_import_logs ADD COLUMN IF NOT EXISTS dry_run BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_import_mappings_collection ON zvd_import_mappings(collection);
CREATE INDEX idx_import_rollbacks_job ON zvd_import_rollbacks(job_id);
