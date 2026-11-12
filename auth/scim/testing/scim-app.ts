import { join } from 'node:path';
import { onEngine } from '../../../testing/ext-harness';

export const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const ENGINE = join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');

/**
 * The SCIM app as one tenant's identity provider reaches it: the packed bundle
 * on the engine's own `/ext/*` chain (`onEngine`), where `host.identity` answers
 * (ADR 0039), each request in that tenant (`x-tenant-slug`, as a per-tenant
 * hostname would) with an engine API key that tenant's administrator issued,
 * holding `$ext:auth/scim` (ADR 0045), as its bearer token.
 *
 * `app.request('/scim/v2/…')` reaches `/ext/auth/scim/v2/…`, so a test reads
 * as the IdP's own URLs. `keyFor(issuer, tenant)` mints another such key;
 * `person(tenant, admin)` makes a member of a tenant, its administrator when
 * `admin`.
 *
 * `userIdOf(subject)` is the engine user id behind a SCIM `id`; `link(userId)` records an account as this provider's, as one provisioned by
 * auth/scim 2.x was carried over (engine migration 120: subject = user id), so
 * a test can drive an account it seeded by SQL.
 */
export async function scimApp(engineDir: string, tenant = DEFAULT_TENANT_ID) {
  const on = await onEngine(engineDir);
  const { sql, db } = on;
  const { generateApiKey, hashApiKey } = await import(join(ENGINE, 'lib', 'security', 'api-key-hash.js'));
  const { getEnforcer, invalidateUserPermCache } = await import(join(ENGINE, 'lib', 'tenancy', 'index.js'));
  const slug =
    tenant === DEFAULT_TENANT_ID
      ? null
      : ((await sql`SELECT slug FROM zv_tenants WHERE id = ${tenant}::uuid`.execute(db)).rows[0]?.slug as string);

  /** A user who is a member of `inTenant`, and administers it when `admin`. */
  const person = async (inTenant: string, admin: boolean): Promise<string> => {
    const id = `scim-issuer-${crypto.randomUUID()}`;
    await sql`INSERT INTO "user" (id, name, email) VALUES (${id}, 'SCIM issuer', ${`${id}@test.local`})`.execute(db);
    if (inTenant !== DEFAULT_TENANT_ID) {
      await sql`INSERT INTO zv_tenant_users (tenant_id, user_id, role)
                VALUES (${inTenant}::uuid, ${id}, 'member')`.execute(db);
    }
    if (admin) await (await getEnforcer()).addRoleForUser(id, 'tenant_admin', inTenant);
    await invalidateUserPermCache(id);
    return id;
  };
  /** An API key `issuer` minted in `inTenant`, holding `scopes`: the raw key and its row id. */
  const mint = async (
    issuer: string,
    inTenant = tenant,
    scopes: unknown = [{ collection: '$ext:auth/scim', actions: ['read', 'create', 'update', 'delete'] }],
  ): Promise<{ raw: string; id: string }> => {
    const raw = generateApiKey() as string;
    const row = await sql`INSERT INTO zv_api_keys (name, key_hash, key_prefix, scopes, is_active, created_by, tenant_id)
              VALUES ('scim-test', ${await hashApiKey(raw)}, ${raw.slice(0, 12)}, ${JSON.stringify(scopes)}::text::jsonb,
                      true, ${issuer}, ${inTenant}::uuid) RETURNING id::text`.execute(db);
    return { raw, id: row.rows[0]!.id as string };
  };
  const keyFor = async (...args: Parameters<typeof mint>) => (await mint(...args)).raw;

  const issuer = await person(tenant, true);
  const { raw: token, id: keyId } = await mint(issuer);
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
    issuer,
    token,
    keyId,
    bearer,
    keyFor,
    person,
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
