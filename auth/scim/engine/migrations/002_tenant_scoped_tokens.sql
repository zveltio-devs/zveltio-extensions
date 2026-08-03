-- 003_tenant_scoped_tokens.sql — auth/scim
--
-- A SCIM token belongs to a tenant.
--
-- It did not. `zv_scim_tokens` had no tenant column at all, and the gate read
--
--     SELECT id::text FROM zv_scim_tokens WHERE token_hash = $1
--
-- and then let the request through. Everything past that point operated on the
-- global `"user"` table with no tenant condition anywhere: `GET /Users` listed
-- every user on the instance, `PATCH` deactivated any of them, and `DELETE`
-- removed the row outright.
--
-- So an identity provider enrolled by one tenant — an ordinary customer, not an
-- operator — could enumerate every other tenant's staff and deprovision them.
-- That is the whole instance's user directory, reachable with one bearer token
-- and no further authorisation. It is the most serious thing in the 2026-08-03
-- audit, and it was not a weakened check: the check had never been written,
-- because the column it needed did not exist.
--
-- Adding the column is only half of it. The routes now resolve the tenant from
-- the token and scope every user operation through `zv_tenant_users`, so SCIM
-- sees exactly the tenant's own members. Deprovisioning removes MEMBERSHIP
-- rather than the user row: a person may belong to more than one tenant, and
-- one tenant offboarding them must not delete them from the others.

ALTER TABLE zv_scim_tokens
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Existing tokens belong to the default tenant — the only one that can have
-- issued them on a single-tenant install, which is where they were created.
UPDATE zv_scim_tokens
   SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
 WHERE tenant_id IS NULL;

ALTER TABLE zv_scim_tokens
  ALTER COLUMN tenant_id SET DEFAULT COALESCE(
    NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );

-- NOT NULL is the point of the migration: a token with no tenant is a token
-- that authorises everything, which is what this is fixing. Better to fail an
-- insert than to fall back to "all tenants".
ALTER TABLE zv_scim_tokens
  ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_zv_scim_tokens_tenant ON zv_scim_tokens (tenant_id);

-- Provisioning state is per (tenant, user): the same person can be provisioned
-- by two different IdPs with two different externalIds.
ALTER TABLE zv_scim_users
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

UPDATE zv_scim_users
   SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
 WHERE tenant_id IS NULL;

ALTER TABLE zv_scim_users
  ALTER COLUMN tenant_id SET DEFAULT COALESCE(
    NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );

ALTER TABLE zv_scim_users
  ALTER COLUMN tenant_id SET NOT NULL;

-- The primary key was `user_id` alone, which cannot express "provisioned in
-- tenant A and in tenant B".
ALTER TABLE zv_scim_users DROP CONSTRAINT IF EXISTS zv_scim_users_pkey;
ALTER TABLE zv_scim_users ADD PRIMARY KEY (tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_zv_scim_users_tenant ON zv_scim_users (tenant_id);

-- Both tables carry a tenant column now, so the host's isolation predicate
-- applies. `zveltio_tenant_scope_ok` is engine migration 029; the boot
-- reconciler puts every `tenant_isolation_*` policy on it.
ALTER TABLE zv_scim_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_scim_tokens FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_zv_scim_tokens ON zv_scim_tokens;
CREATE POLICY tenant_isolation_zv_scim_tokens ON zv_scim_tokens
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

ALTER TABLE zv_scim_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_scim_users FORCE  ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_zv_scim_users ON zv_scim_users;
CREATE POLICY tenant_isolation_zv_scim_users ON zv_scim_users
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- DOWN
DROP POLICY IF EXISTS tenant_isolation_zv_scim_users ON zv_scim_users;
DROP POLICY IF EXISTS tenant_isolation_zv_scim_tokens ON zv_scim_tokens;
ALTER TABLE zv_scim_users  NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zv_scim_users  DISABLE ROW LEVEL SECURITY;
ALTER TABLE zv_scim_tokens NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zv_scim_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE zv_scim_users DROP CONSTRAINT IF EXISTS zv_scim_users_pkey;
ALTER TABLE zv_scim_users ADD PRIMARY KEY (user_id);
ALTER TABLE zv_scim_users  DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE zv_scim_tokens DROP COLUMN IF EXISTS tenant_id;
