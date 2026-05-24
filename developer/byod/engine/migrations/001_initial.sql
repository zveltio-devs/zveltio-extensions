-- 001_initial.sql
--
-- Consolidated initial schema for the `developer/byod` extension.
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
-- BYOD / Schema Introspection — uses core tables
-- No extension-specific tables in init

-- ── from 002_enterprise.sql ──
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

