-- Move the mail configuration out of `zv_settings` into a table this extension owns.
--
-- Two defects, one move.
--
-- 1. `zv_settings` is an engine system table. `ctx.db` refuses it, and the only
--    reason every read here worked is that they are raw `sql` templates: the
--    table policy guards the query builder's entry points and a raw statement
--    does not pass through them. That is the sandbox hole the raw-SQL inventory
--    is cataloguing, and this extension was leaning on it in six places. When the
--    engine closes that path, these reads stop — unless the config has moved
--    first, which is what this migration does.
--
--    A grant on `zv_settings` would NOT be the fix. A grant is per TABLE, not per
--    key, so the mail extension would gain the SAML configuration, the LDAP one
--    and every other instance setting. Exactly the reasoning in `auth/saml`'s
--    migration 004, which made this same move for the same reason.
--
-- 2. `zv_settings` is keyed on `key` alone, with no `tenant_id` — and the write
--    path says `ON CONFLICT (key)`. So there is ONE mail configuration for the
--    whole instance: the second company on a shared install cannot have its own
--    IMAP server, OAuth application or sync interval, and saving theirs
--    overwrites the first company's. The same class the key campaign widened
--    across the catalogue and `auth/saml` migration 003 missed in exactly this
--    way, by looking only at the extension's own `zvd_*` tables.
--
-- Keyed on `tenant_id`, so one configuration per company.

CREATE TABLE IF NOT EXISTS zvd_mail_config (
  tenant_id UUID NOT NULL DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id)
);

ALTER TABLE zvd_mail_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_mail_config FORCE  ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_zvd_mail_config ON zvd_mail_config;
CREATE POLICY tenant_isolation_zvd_mail_config ON zvd_mail_config
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- Adopt the existing configuration, if the install has one.
--
-- `jsonb_typeof` is not defensive padding here. The save path wrote
-- `${JSON.stringify(...)}::jsonb` for most of this extension's life, and a string
-- parameter cast straight to `jsonb` is a no-op — the document was stored as a
-- jsonb STRING SCALAR, the whole config in quotes rather than parsed. Any install
-- that saved before that was fixed holds the string form, and copying it across
-- unexamined would carry the broken shape into the new table.
--
-- The doubly-damaged case cannot be recovered and is not attempted: a SECOND
-- save read the string back and spread it, producing one key per character
-- (`{"0":"{","1":"\"", …}`). That is not a configuration in either form, and it
-- arrives here as an object, so it copies across as-is and the operator
-- reconfigures. Recorded so the next reader knows it was considered.
INSERT INTO zvd_mail_config (tenant_id, config)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  CASE WHEN jsonb_typeof(value) = 'string' THEN (value #>> '{}')::jsonb ELSE value END
FROM zv_settings
WHERE key = 'mail'
ON CONFLICT (tenant_id) DO NOTHING;

-- The old `zv_settings` row stays. It belongs to the engine, and a migration in
-- an extension that deletes rows from the engine's tables is exactly what rule D1
-- forbids. It becomes inert: nothing in this extension reads it after this
-- migration. It does remain visible in the engine's generic settings screen,
-- where editing it will now have no effect — the same trade-off `auth/saml`
-- accepted, and the same manual cleanup.

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_zvd_mail_config ON zvd_mail_config;
DROP TABLE IF EXISTS zvd_mail_config;
