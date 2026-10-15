-- Access logs keep the share link's digest, never its token.
--
-- `zv_cloud_access_logs.share_token` recorded the raw bearer token of every
-- link that was opened, readable by the request role in the tenant — the same
-- exposure engine migration 079 closed on `zv_media_shares.token`. New rows are
-- written as `sha256:<hex>` (routes.ts logAccess); this hashes the old ones.
-- A digest cannot be turned back into its token, so there is nothing to undo.

UPDATE zv_cloud_access_logs
   SET share_token = 'sha256:' || encode(sha256(convert_to(share_token, 'UTF8')), 'hex')
 WHERE share_token IS NOT NULL AND share_token NOT LIKE 'sha256:%';

-- DOWN

SELECT 1;
