import { createHmac, randomBytes } from 'node:crypto';
import { sql } from 'kysely';
import { mountForTest } from '../../../testing/ext-harness';

export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * The SCIM app as one tenant's identity provider reaches it: every request runs
 * in that tenant's transaction, as the engine's tenant middleware makes it, and
 * carries a bearer token that tenant issued.
 *
 * The token is seeded, not minted: minting writes `scim_tokens` through the data
 * API, which the harness does not mount (`index.test.ts` covers the route). The
 * hash is the host's (`deriveTokenHash`), as the harness computes it.
 */
export async function scimApp(engineDir: string, tenant = DEFAULT_TENANT_ID) {
  const mounted = await mountForTest(engineDir, { tenant, transaction: true });
  const name = `IdP ${crypto.randomUUID()}`;
  const token = `zvscim_${randomBytes(24).toString('hex')}`;
  const hash = createHmac('sha256', process.env.BETTER_AUTH_SECRET ?? '').update(token).digest('hex');
  const row = await sql<{ id: string }>`
    INSERT INTO zvd_scim_tokens (tenant_id, name, token_hash)
    VALUES (${tenant}::uuid, ${name}, ${hash}) RETURNING id::text
  `.execute(mounted.ctx.db);
  const bearer = { Authorization: `Bearer ${token}` };
  return {
    ...mounted,
    name,
    token,
    tokenId: row.rows[0]!.id,
    bearer,
    json: { ...bearer, 'content-type': 'application/json' },
  };
}
