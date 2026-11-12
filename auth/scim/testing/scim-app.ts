import { createHmac, randomBytes } from 'node:crypto';
import { onEngine } from '../../../testing/ext-harness';

export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * The SCIM app as one tenant's identity provider reaches it: the packed bundle
 * on the engine's own `/ext/*` chain (`onEngine`), where `host.identity` answers
 * (ADR 0039), each request in that tenant (`x-tenant-slug`, as a per-tenant
 * hostname would) with a bearer token that tenant issued.
 *
 * `app.request('/scim/v2/…')` reaches `/ext/auth/scim/v2/…`, so a test reads
 * as the IdP's own URLs. The token is seeded, not minted (`index.test.ts`
 * covers minting); the hash is the host's (`deriveTokenHash`).
 *
 * `userIdOf(subject)` is the engine user id behind a SCIM `id`; `link(userId)` records an account as this provider's, as one provisioned by
 * auth/scim 2.x was carried over (engine migration 120: subject = user id), so
 * a test can drive an account it seeded by SQL.
 */
export async function scimApp(engineDir: string, tenant = DEFAULT_TENANT_ID) {
  const on = await onEngine(engineDir);
  const { sql, db } = on;
  const slug =
    tenant === DEFAULT_TENANT_ID
      ? null
      : ((await sql`SELECT slug FROM zv_tenants WHERE id = ${tenant}::uuid`.execute(db)).rows[0]?.slug as string);
  const name = `IdP ${crypto.randomUUID()}`;
  const token = `zvscim_${randomBytes(24).toString('hex')}`;
  const hash = createHmac('sha256', process.env.BETTER_AUTH_SECRET ?? '').update(token).digest('hex');
  const row = await sql`
    INSERT INTO zvd_scim_tokens (tenant_id, name, token_hash)
    VALUES (${tenant}::uuid, ${name}, ${hash}) RETURNING id::text
  `.execute(db);
  const bearer = { Authorization: `Bearer ${token}` };
  const app = {
    request: (path: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers);
      if (slug && !headers.has('x-tenant-slug')) headers.set('x-tenant-slug', slug);
      return on.app.request(path.replace(/^\/scim\/v2/, '/ext/auth/scim/v2'), { ...init, headers });
    },
  };
  return {
    ...on,
    app,
    tenant,
    slug,
    name,
    token,
    tokenId: row.rows[0]!.id as string,
    bearer,
    json: { ...bearer, 'content-type': 'application/json' },
    /** The engine user id of the account this provider calls `subject` (its SCIM `id`). */
    userIdOf: async (subject: string): Promise<string> =>
      (
        await sql`SELECT user_id FROM zv_identity_links
                   WHERE tenant_id = ${tenant}::uuid AND provider = 'auth/scim' AND subject = ${subject}`.execute(db)
      ).rows[0]?.user_id as string,
    link: (userId: string) =>
      sql`INSERT INTO zv_identity_links (tenant_id, provider, subject, user_id)
          VALUES (${tenant}::uuid, 'auth/scim', ${userId}, ${userId})
          ON CONFLICT DO NOTHING`.execute(db),
  };
}
