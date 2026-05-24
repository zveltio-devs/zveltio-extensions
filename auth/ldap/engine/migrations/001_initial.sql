-- 001_initial.sql
--
-- Consolidated initial schema for the `auth/ldap` extension.
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
-- LDAP auth extension — config stored in zv_settings under key 'ldap_config'
-- No extension-specific tables in init

-- ── from 002_enterprise.sql ──
-- LDAP login audit log
CREATE TABLE IF NOT EXISTS zvd_ldap_login_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  ldap_dn TEXT,
  username TEXT NOT NULL,
  ip TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LDAP group-to-role mappings
CREATE TABLE IF NOT EXISTS zvd_ldap_group_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ldap_group TEXT NOT NULL UNIQUE,
  zveltio_role TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IP allowlist for LDAP login
CREATE TABLE IF NOT EXISTS zvd_ldap_ip_allowlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cidr TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ldap_login_log_user ON zvd_ldap_login_log(username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ldap_login_log_ip ON zvd_ldap_login_log(ip, created_at DESC);

