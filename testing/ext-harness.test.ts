// The harness hands an extension the ENGINE's helpers for what #858 took off
// `ctx.db`: the identity and tenant-facts members of `ctx.internals`, tenant
// entry, and `ctx.DDLManager`'s catalogue reads. Before, the first threw as an
// unrecorded member, `withTenantIsolation` never ran its callback, and every
// DDLManager read answered `undefined` — so no extension moved off raw SQL could
// be tested on the path it moved to.
import { describe, expect, it } from 'bun:test';
import { join } from 'path';
import { mountForTest } from './ext-harness';

const d = process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;
const BYOD = join(import.meta.dir, '..', 'developer', 'byod', 'engine');
const DEFAULT_TENANT = '00000000-0000-0000-0000-000000000001';

d('ext-harness: the engine helpers behind ctx', () => {
  it('ctx.internals.countMembers is the engine’s, for the tenant the request runs as', async () => {
    const { app, ctx } = await mountForTest(BYOD);
    app.get('/__members', async (c: any) => c.json(await ctx.internals.countMembers()));
    const res = await app.request('/__members');
    expect(res.status).toBe(200);
    const body = (await res.json()) as { total: number; admins: number };
    expect(body.total).toBeGreaterThan(0);
    expect(typeof body.admins).toBe('number');
  });

  it('withTenantIsolation runs its callback in that tenant, on the extension’s table guard', async () => {
    const { app, ctx } = await mountForTest(BYOD);
    const { sql } = await import(join(import.meta.dir, '..', 'node_modules/kysely/dist/index.js'));
    app.get('/__enter', async (c: any) =>
      c.json(
        await ctx.internals.withTenantIsolation(DEFAULT_TENANT, async (trx: any) => {
          const r = await sql`SELECT current_setting('zveltio.current_tenant', true) AS t`.execute(trx);
          const refused = await sql`SELECT 1 FROM "user" LIMIT 1`.execute(trx).then(
            () => false,
            () => true,
          );
          return { tenant: r.rows[0]?.t, refused };
        }),
      ),
    );
    const res = await app.request('/__enter');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ tenant: DEFAULT_TENANT, refused: true });
  });

  it('entering another tenant needs tenant:enter, as in the engine', async () => {
    const { ctx } = await mountForTest(BYOD);
    await expect(
      ctx.internals.withTenantIsolation('00000000-0000-0000-0000-0000000000ff', async () => 1),
    ).rejects.toThrow(/tenant:enter/);
  });

  it('ctx.DDLManager reads the collection registry', async () => {
    const { ctx } = await mountForTest(BYOD);
    const all = await ctx.DDLManager.getCollections(ctx.db);
    expect(Array.isArray(all)).toBe(true);
    expect(await ctx.DDLManager.getCollection(ctx.db, `nope_${Date.now()}`)).toBeNull();
  });
});
