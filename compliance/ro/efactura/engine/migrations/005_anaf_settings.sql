-- Credentials for talking to ANAF, per tenant.
--
-- Nothing here held any of this: the extension had no settings table at all,
-- which is why the submit route was a stub and its seller name fell through to
-- the literal string "Set in e-Factura settings" — pointing at a screen that
-- did not exist.
--
-- WHAT IS AND IS NOT STORED
--
-- `client_id` and `client_secret` are the OAuth2 application credentials
-- registered with ANAF. The secret is encrypted with the engine's field key
-- (`enc:v1:` prefix, AES-256-GCM) and never leaves the server: the read route
-- reports whether it is set, not what it is.
--
-- The CERTIFICATE is a path, not a blob. A qualified certificate is the
-- company's legal signing identity; pasting one into a browser form and keeping
-- it in a database row would put it somewhere it does not belong, backed up
-- and replicated along with everything else. The operator installs the file on
-- the server and this records where it is. Its password is a secret and is
-- encrypted like the rest.
--
-- Tokens are cached so every call does not repeat the OAuth dance, and are
-- encrypted for the same reason as the secret: an access token to a tax
-- authority is a credential, not a cache key.
CREATE TABLE IF NOT EXISTS zv_efactura_settings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 'test' documents carry no fiscal effect. It is the same OAuth gate either
  -- way — ANAF's test environment removes the consequences, not the
  -- authentication — so this only chooses which base URL is called.
  environment       TEXT NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'prod')),

  -- The CIF submissions are filed under. Usually the company's own, but a
  -- filing agent acts for others, so it is explicit rather than derived.
  seller_cif        TEXT,

  client_id         TEXT,
  client_secret     TEXT,   -- enc:v1:
  cert_path         TEXT,
  cert_password     TEXT,   -- enc:v1:

  access_token      TEXT,   -- enc:v1:
  refresh_token     TEXT,   -- enc:v1:
  token_expires_at  TIMESTAMPTZ,

  -- Set once the first real call succeeds, so the screen can distinguish
  -- "credentials entered" from "credentials that work".
  last_verified_at  TIMESTAMPTZ,
  last_error        TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE zv_efactura_settings ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_efactura_settings ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);

CREATE UNIQUE INDEX IF NOT EXISTS uq_zv_efactura_settings_tenant ON zv_efactura_settings (tenant_id);

ALTER TABLE zv_efactura_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_efactura_settings FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zv_efactura_settings ON zv_efactura_settings;
CREATE POLICY tenant_isolation_zv_efactura_settings ON zv_efactura_settings
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zveltio_rls') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON zv_efactura_settings TO zveltio_rls;
  END IF;
END $$;
