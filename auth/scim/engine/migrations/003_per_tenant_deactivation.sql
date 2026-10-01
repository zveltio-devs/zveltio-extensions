-- 003_per_tenant_deactivation.sql — auth/scim
--
-- On a multi-tenant instance an IdP's `active: false` ends the person's
-- membership of ITS tenant (`zv_tenant_users.valid_to = now()`), not their
-- sign-in everywhere. `"user".banned` is set only when no tenant is left in
-- force. See routes.ts `setActive`.
--
--   suspended_at  — the `valid_to` this IdP wrote. A membership whose valid_to
--                   still equals it is an IdP suspension the IdP may lift; any
--                   other lapse is the business's and stays closed.
--   held_valid_to — the end date the business had set before the suspension,
--                   put back on reactivation (NULL = open-ended).
ALTER TABLE zv_scim_users
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS held_valid_to TIMESTAMPTZ;

-- The sign-in blocks SCIM placed, so `active: true` lifts those and never one an
-- administrator set. Per user, not per tenant, like the block itself: any tenant
-- whose reactivation puts the person back in force lifts it. No tenant column on
-- purpose — under the request's RLS one tenant cannot read another's
-- zv_scim_users row, and the tenant that placed the block is rarely the one
-- that lifts it.
CREATE TABLE IF NOT EXISTS zv_scim_sign_in_blocks (
  user_id    TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Before this migration SCIM was the only writer of `"user".banned`: a banned
-- user whom some IdP holds inactive was blocked by SCIM. Without this row their
-- IdP's `active: true` could no longer lift it. Every tenant's rows, not only
-- the default one the policy shows a migration.
SELECT set_config('zveltio.visible_tenants',
                  COALESCE((SELECT string_agg(id::text, ',') FROM zv_tenants), ''), true);
INSERT INTO zv_scim_sign_in_blocks (user_id)
SELECT DISTINCT s.user_id
  FROM zv_scim_users s
  JOIN "user" u ON u.id = s.user_id
 WHERE u.banned AND NOT s.active
ON CONFLICT (user_id) DO NOTHING;

-- DOWN
DROP TABLE IF EXISTS zv_scim_sign_in_blocks;
ALTER TABLE zv_scim_users
  DROP COLUMN IF EXISTS held_valid_to,
  DROP COLUMN IF EXISTS suspended_at;
