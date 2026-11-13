// The four routes on the engine's real load path (`onEngine`: the manifest's
// `routes`, the `/ext/*` chain, the gate): declared `caller` routes answered by
// plain functions (ADR 0039), which write through `ctx.internals` with the
// `Request` they are handed, as the caller the engine authenticated — a session
// or an API key on a manifest `apiKeyRoutes` route.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { onEngine } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const BASE = '/ext/developer/graphql';
const Q = 'graphql_queries';

d('developer/graphql — declared routes on the engine', () => {
  let e: Awaited<ReturnType<typeof onEngine>>;
  let god = '';
  let member: { cookie: string; userId: string };
  const tag = `gqoe${Date.now()}`;
  const keys: string[] = [];

  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    e.app.request(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  const author = async (name: string) =>
    (
      await e.harness.asEveryTenant(e.db, (trx: any) =>
        e.sql`SELECT created_by FROM zvd_graphql_queries WHERE name = ${name}`.execute(trx),
      )
    ).rows[0]?.created_by;

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    god = await e.harness.createGodSession(e.engineApp, e.db);
    member = await e.harness.createMemberSession(e.engineApp, e.db, {
      grants: [{ collection: Q, actions: ['read', 'create'] }],
    });
    // The schema is cached per tenant for every file of the run.
    expect((await post('/refresh-schema', {}, { cookie: god })).status).toBe(200);
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    for (const id of keys) await e.sql`DELETE FROM zv_api_keys WHERE id = ${id}`.execute(e.db);
    await e.done();
  });

  it('refuses an anonymous caller, and a path no route declares does not exist', async () => {
    expect((await post('', { query: '{ __typename }' })).status).toBe(401);
    const none = await e.app.request(`${BASE}/nothing`, { headers: { cookie: member.cookie } });
    expect(none.status).toBe(404);
    // A member is no admin.
    expect((await post('/refresh-schema', {}, { cookie: member.cookie })).status).toBe(403);
  });

  it('a mutation writes as the signed-in caller', async () => {
    const res = await post(
      '',
      { query: `mutation { create_${Q}(name: "${tag}-s", query: "{ __typename }") { name } }` },
      { cookie: member.cookie },
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as any).data).toEqual({ [`create_${Q}`]: { name: `${tag}-s` } });
    expect(await author(`${tag}-s`)).toBe(member.userId);
  });

  it('an API key runs a stored query, as its scopes allow', async () => {
    const mint = await e.engineApp.request('/api/admin/api-keys', {
      method: 'POST',
      headers: { cookie: god, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: tag,
        scopes: [
          { collection: '$ext:developer/graphql', actions: ['create'] },
          { collection: Q, actions: ['read'] },
        ],
      }),
    });
    const { id, key } = (await mint.json()) as { id: string; key: string };
    keys.push(id);
    const res = await post(`/persisted/${tag}-s/execute`, {}, { 'x-api-key': key });
    expect([res.status, await res.json()]).toEqual([200, { data: { __typename: 'Query' } }]);
  });
});
