-- 005_engine_ban_source.sql — auth/scim
--
-- The engine records who placed a ban (engine migration 035: `"user".ban_source`)
-- and `ctx.internals.liftOwnBan` lifts only the caller's. SCIM's own record of
-- its bans — `zv_scim_sign_in_blocks` (003) and the trigger on "user" that
-- forgot a row when anyone lifted the ban (004) — is replaced by it.
--
-- Needs engine 3.0.0-beta.76 (035). An explicit `ban_source` on a row already
-- banned passes 035's trigger unchanged: it only fills a NULL.

SELECT set_config('zveltio.visible_tenants',
                  COALESCE((SELECT string_agg(id::text, ',') FROM zv_tenants), ''), true);

DO $$
BEGIN
  -- 035 converted the markers that existed when the engine upgraded. A row SCIM
  -- 1.0.15 wrote after that is converted here; a marker means the CURRENT ban is
  -- SCIM's (004), so only a ban without a known source is claimed.
  IF to_regclass('public.zv_scim_sign_in_blocks') IS NOT NULL THEN
    UPDATE "user" u SET ban_source = 'ext:auth/scim'
      FROM public.zv_scim_sign_in_blocks b
     WHERE b.user_id = u.id AND u.banned IS TRUE AND u.ban_source = 'unknown';
  END IF;

  -- Single-tenant SCIM never wrote markers: its `active: true` lifted any ban.
  -- Those bans are 'unknown' since 035. Claimed: a ban older than 035 (no
  -- `banned_at`) of a person the IdP holds inactive — exactly the bans 1.0.15
  -- would still lift, so this widens nothing. A ban placed since is the
  -- engine's to attribute, and an administrator's stays theirs. Not on a
  -- multi-tenant instance: there the markers were complete, and the same test
  -- would claim an administrator's ban of a person some IdP had deactivated.
  IF (SELECT COUNT(*) FROM zv_tenants) <= 1 THEN
    UPDATE "user" u SET ban_source = 'ext:auth/scim'
     WHERE u.banned IS TRUE AND u.ban_source = 'unknown' AND u.banned_at IS NULL
       AND EXISTS (SELECT 1 FROM zv_scim_users s WHERE s.user_id = u.id AND NOT s.active);
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS zv_scim_sign_in_block_ends ON "user";
DROP FUNCTION IF EXISTS zv_scim_forget_sign_in_block();
DROP TABLE IF EXISTS zv_scim_sign_in_blocks;

-- DOWN
-- 003's table and 004's trigger, with a row for every ban SCIM holds now.
CREATE TABLE IF NOT EXISTS zv_scim_sign_in_blocks (
  user_id    TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO zv_scim_sign_in_blocks (user_id)
SELECT id FROM "user" WHERE banned IS TRUE AND ban_source = 'ext:auth/scim'
ON CONFLICT (user_id) DO NOTHING;
CREATE OR REPLACE FUNCTION zv_scim_forget_sign_in_block() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  DELETE FROM zv_scim_sign_in_blocks WHERE user_id = OLD.id;
  RETURN NULL;
END $$;
CREATE OR REPLACE TRIGGER zv_scim_sign_in_block_ends
  AFTER UPDATE OF banned ON "user"
  FOR EACH ROW WHEN (OLD.banned IS TRUE AND NEW.banned IS NOT TRUE)
  EXECUTE FUNCTION zv_scim_forget_sign_in_block();
