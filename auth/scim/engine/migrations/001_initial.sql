-- 001_initial.sql — auth/scim
--
-- SCIM 2.0 provisioning (Azure AD / Entra, Okta, ...):
--   zv_scim_tokens — bearer tokens the IdP authenticates with (HMAC-SHA256
--     hashed with BETTER_AUTH_SECRET, same practice as zv_api_keys; the raw
--     token is shown exactly once at creation).
--   zv_scim_users  — provisioning state per user: the IdP's externalId and
--     the SCIM `active` flag (deactivation also kills sessions + scrambles
--     the credential password — see routes.ts).

CREATE TABLE IF NOT EXISTS zv_scim_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,
  created_by   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS zv_scim_users (
  user_id     TEXT PRIMARY KEY,
  external_id TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zv_scim_users_external ON zv_scim_users (external_id);
