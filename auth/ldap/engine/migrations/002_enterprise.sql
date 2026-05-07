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
