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
