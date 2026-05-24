-- 001_initial.sql
--
-- Consolidated initial schema for the `developer/database` extension.
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
-- Developer database extension uses core engine tables:
-- zv_saved_queries, zv_audit_log
-- No extension-specific tables in init

-- ── from 002_enterprise.sql ──
-- Query execution history (admin audit)
CREATE TABLE IF NOT EXISTS zvd_db_query_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query       TEXT NOT NULL,
  executed_by TEXT NOT NULL,
  duration_ms INT,
  row_count   INT,
  error       TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DDL change audit log
CREATE TABLE IF NOT EXISTS zvd_db_ddl_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation   TEXT NOT NULL,  -- CREATE_FUNCTION, DROP_TRIGGER, ALTER_TABLE, etc.
  object_type TEXT NOT NULL,
  object_name TEXT NOT NULL,
  schema_name TEXT NOT NULL DEFAULT 'public',
  ddl_text    TEXT,
  executed_by TEXT NOT NULL,
  success     BOOLEAN NOT NULL DEFAULT true,
  error       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Named connection profiles (for multi-DB environments)
CREATE TABLE IF NOT EXISTS zvd_db_connection_profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  host        TEXT NOT NULL,
  port        INT NOT NULL DEFAULT 5432,
  database    TEXT NOT NULL,
  ssl         BOOLEAN NOT NULL DEFAULT true,
  is_readonly BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_db_query_history_user ON zvd_db_query_history(executed_by, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_db_ddl_log_object ON zvd_db_ddl_log(object_type, object_name, created_at DESC);

