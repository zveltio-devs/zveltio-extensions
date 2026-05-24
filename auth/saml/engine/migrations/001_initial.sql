-- 001_initial.sql
--
-- Consolidated initial schema for the `auth/saml` extension.
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
-- SAML auth extension — config stored in zv_settings under key 'saml_config'
-- No extension-specific tables in init

-- ── from 002_enterprise.sql ──
-- SAML SSO audit log
CREATE TABLE IF NOT EXISTS zvd_saml_login_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  email TEXT,
  name_id TEXT,
  idp_entity_id TEXT,
  session_index TEXT,
  ip TEXT,
  success BOOLEAN NOT NULL,
  failure_reason TEXT,
  relay_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SAML IdP metadata cache
CREATE TABLE IF NOT EXISTS zvd_saml_idp_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id TEXT NOT NULL UNIQUE,
  metadata_xml TEXT NOT NULL,
  valid_until TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  refresh_url TEXT
);

-- SAML attribute mappings
CREATE TABLE IF NOT EXISTS zvd_saml_attribute_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saml_attribute TEXT NOT NULL UNIQUE,
  zveltio_field TEXT NOT NULL,
  transform TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saml_login_log_email ON zvd_saml_login_log(email, created_at DESC);

