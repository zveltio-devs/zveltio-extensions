-- 001_initial.sql
--
-- Consolidated initial schema for the `data/export` extension.
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
-- Data Export extension — uses core zv_collections, zv_fields tables
-- No extension-specific tables in init

-- ── from 002_enterprise.sql ──
-- Export jobs (async large exports)
CREATE TABLE IF NOT EXISTS zvd_export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json','csv','ndjson','xlsx','parquet')),
  filters JSONB NOT NULL DEFAULT '{}',
  fields TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  total_records INT,
  exported_records INT NOT NULL DEFAULT 0,
  file_key TEXT,
  file_size_bytes BIGINT,
  error TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Saved export configurations
CREATE TABLE IF NOT EXISTS zvd_export_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  fields TEXT[] NOT NULL DEFAULT '{}',
  filters JSONB NOT NULL DEFAULT '{}',
  sort_field TEXT,
  sort_order TEXT NOT NULL DEFAULT 'asc',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Export audit log
CREATE TABLE IF NOT EXISTS zvd_export_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  format TEXT NOT NULL,
  record_count INT NOT NULL DEFAULT 0,
  fields_exported TEXT[] NOT NULL DEFAULT '{}',
  filters_used JSONB NOT NULL DEFAULT '{}',
  exported_by TEXT NOT NULL,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_status ON zvd_export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_export_jobs_created ON zvd_export_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_audit_collection ON zvd_export_audit_log(collection, created_at DESC);

