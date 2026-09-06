-- Replay protection for accepted SAML assertions.
--
-- This exists because of what migration 005's sibling change had to do to
-- `validateInResponseTo`. The extension asked node-saml for `'ifPresent'` — a
-- 4.x idiom — while pinning `^3.1.0`, where the option is a plain boolean:
--
--   node_modules/node-saml/src/saml.js:39
--     validateInResponseTo: options.validateInResponseTo || false
--
-- Any truthy value there means "ALWAYS require InResponseTo", and an
-- IdP-initiated response has none by construction, so every one of them was
-- refused. SP-initiated ones were refused too, for a second reason: node-saml's
-- default cacheProvider is a fresh InMemoryCacheProvider per instance
-- (saml.js:41) and the extension builds a new instance on every request, so the
-- id saved at `/login` was never in the cache of the instance validating at
-- `/callback`.
--
-- So the InResponseTo binding has never been in force: it rejected everything,
-- which is not the same as protecting anything. The sibling change sets the
-- option to `false` explicitly, because the pinned major cannot express what the
-- author meant.
--
-- Turning it off without a replacement would delete the author's INTENT while
-- making login work, so the protection is replaced by one that is strictly
-- wider. InResponseTo can only bind an SP-initiated response to a request this
-- server issued; it can say nothing at all about an IdP-initiated one. Recording
-- the assertion id and refusing a second sighting protects BOTH flows, which is
-- the property actually wanted: a captured response cannot be presented twice.
--
-- Keyed on `(tenant_id, assertion_id)` and not on `assertion_id` alone. An id is
-- unique per IdP, and two tenants on one instance can use two different IdPs;
-- a global key would let one tenant's login consume another's id. That is the
-- same class the key campaign widened across the catalogue.

CREATE TABLE IF NOT EXISTS zvd_saml_consumed_assertions (
  tenant_id UUID NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  assertion_id TEXT NOT NULL,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, assertion_id)
);

-- Sweeping expired rows scans by expiry, not by tenant.
CREATE INDEX IF NOT EXISTS idx_zvd_saml_consumed_assertions_expires
  ON zvd_saml_consumed_assertions (expires_at);

ALTER TABLE zvd_saml_consumed_assertions ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_saml_consumed_assertions FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zvd_saml_consumed_assertions ON zvd_saml_consumed_assertions;
CREATE POLICY tenant_isolation_zvd_saml_consumed_assertions ON zvd_saml_consumed_assertions
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_zvd_saml_consumed_assertions ON zvd_saml_consumed_assertions;
DROP INDEX IF EXISTS idx_zvd_saml_consumed_assertions_expires;
DROP TABLE IF EXISTS zvd_saml_consumed_assertions;
