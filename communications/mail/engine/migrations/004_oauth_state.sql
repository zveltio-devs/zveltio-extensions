-- 004_oauth_state.sql
--
-- The OAuth2 flow the audit reported as absent: "OAuth2 for Gmail/Outlook is
-- schema and config only — no flow exists". `zv_mail_accounts` has carried
-- oauth2_provider / access_token / refresh_token / expires_at since 001, and
-- `imap-operations.ts` already authenticates with XOAUTH2 when it finds a token
-- there. Nothing ever produced one.
--
-- What was missing from the schema is the leg between "user clicks connect" and
-- "provider redirects back": a one-time `state` the callback can verify. Without
-- it the callback cannot tell its own redirect from one an attacker caused, and
-- would attach the returned code to whatever account the URL names — the
-- textbook OAuth CSRF, and here it would bind an attacker's mailbox token to
-- someone else's Zveltio account.
--
-- Rows are short-lived by design. `expires_at` is minutes, not days, and the
-- callback deletes the row it consumed so a replayed redirect finds nothing.

CREATE TABLE IF NOT EXISTS zv_mail_oauth_states (
  state         TEXT        PRIMARY KEY,
  -- Same DEFAULT as every other table in 002: the session GUC, falling back to
  -- the default tenant so a single-tenant install works without one being set.
  tenant_id     UUID        NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  user_id       TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  account_id    UUID        NOT NULL REFERENCES zv_mail_accounts(id) ON DELETE CASCADE,
  provider      TEXT        NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  redirect_uri  TEXT        NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mail_oauth_states_expires ON zv_mail_oauth_states (expires_at);

-- Same tenant scoping as every other table in this extension. A state row names
-- an account and a user, so it is exactly as sensitive as the account is.
ALTER TABLE zv_mail_oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_oauth_states FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zv_mail_oauth_states ON zv_mail_oauth_states;
CREATE POLICY tenant_isolation_zv_mail_oauth_states ON zv_mail_oauth_states
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));
