-- 004_block_ends_with_ban.sql — auth/scim
--
-- A `zv_scim_sign_in_blocks` row says the CURRENT ban is SCIM's. It outlived
-- the ban: an administrator who lifted it and banned the person again left the
-- row in place, and the IdP's `active: true` lifted the administrator's ban.
-- The engine has no ban reason to tell the two apart (`"user".banned` is a bare
-- flag, written by hand), so the row now ends with the ban, whoever lifts it.
--
-- SECURITY DEFINER: whoever unbans may hold no grant on this table, and their
-- UPDATE must not fail on it. A trigger function cannot be called directly.
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

-- 1.0.14 rows whose ban is already gone. A ban lifted and re-placed before this
-- upgrade cannot be told apart from SCIM's and keeps its row.
DELETE FROM zv_scim_sign_in_blocks b
 USING "user" u
 WHERE u.id = b.user_id AND u.banned IS NOT TRUE;

-- DOWN
DROP TRIGGER IF EXISTS zv_scim_sign_in_block_ends ON "user";
DROP FUNCTION IF EXISTS zv_scim_forget_sign_in_block();
