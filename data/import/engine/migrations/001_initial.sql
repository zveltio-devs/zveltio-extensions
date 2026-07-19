-- 001_initial.sql
--
-- Consolidated initial schema for the `data/import` extension.
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
-- Import jobs tracking
CREATE TABLE IF NOT EXISTS zv_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv','json','ndjson')),
  filename TEXT,
  total_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_import_logs_collection ON zv_import_logs(collection);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON zv_import_logs(status);

-- ── from 002_enterprise.sql ──
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

CREATE INDEX IF NOT EXISTS idx_import_mappings_collection ON zvd_import_mappings(collection);
CREATE INDEX IF NOT EXISTS idx_import_rollbacks_job ON zvd_import_rollbacks(job_id);


-- Schema enrichment (same pattern as content/media 001): the CORE engine also
-- creates zv_import_logs, so the CREATE above is skipped there and the core
-- shape lacks imported_rows which /stats and the import writer use.
ALTER TABLE zv_import_logs ADD COLUMN IF NOT EXISTS imported_rows INT NOT NULL DEFAULT 0;
