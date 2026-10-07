// The read-only window for model-written SQL, on the handle the engine
// actually gives this extension.
//
// `runReadOnly` opened its own `SAVEPOINT`, and `ctx.db` refuses one from an
// extension (engine #858 admits queries and DML only). So the AI query route and
// both assistant SQL tools answered every question with that refusal. The
// window now rides `ctx.db.transaction()`, whose savepoint is the engine's.
import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { mountForTest } from '../../../testing/ext-harness';
import { runReadOnly } from '../lib/sql-guard';

const d = process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;
const DEFAULT_TENANT = '00000000-0000-0000-0000-000000000001';
const ENGINE = join(import.meta.dir, '..');

/** Run `fn` in a request's tenant transaction, where `ctx.db` resolves to it. */
async function inRequest<T>(app: any, ctx: any, fn: () => Promise<T>): Promise<T> {
  const path = `/__ro_${Math.random().toString(36).slice(2)}`;
  app.get(path, async (c: any) =>
    c.json(await ctx.internals.withTenantIsolation(DEFAULT_TENANT, fn)),
  );
  const res = await app.request(path);
  if (res.status !== 200) throw new Error(`${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

d('ai: the read-only window on ctx.db', () => {
  it('answers a read inside the request transaction, which stays writable after it', async () => {
    const { app, ctx } = await mountForTest(ENGINE);
    const marker = `ro-window-${Date.now()}`;
    const out = await inRequest(app, ctx, async () => {
      const read = await runReadOnly(ctx.db, 'SELECT 1 AS one');
      // A write after the window: refused if the read-only flag leaked out of it.
      await ctx.db
        .insertInto('zv_ai_usage')
        .values({ provider: 'test', model: marker, operation: 'query' })
        .execute();
      const kept = await ctx.db
        .selectFrom('zv_ai_usage')
        .select('model')
        .where('model', '=', marker)
        .execute();
      await ctx.db.deleteFrom('zv_ai_usage').where('model', '=', marker).execute();
      return { read: read.rows, kept: kept.length };
    });
    expect(out).toEqual({ read: [{ one: 1 }], kept: 1 });
  });

  it('refuses a write inside the window, and the request survives the refusal', async () => {
    const { app, ctx } = await mountForTest(ENGINE);
    const out = await inRequest(app, ctx, async () => {
      const err = await runReadOnly(
        ctx.db,
        "INSERT INTO zv_ai_usage (provider, model, operation) VALUES ('t', 'ro-write', 'query')",
      ).then(
        () => null,
        (e: Error) => e.message,
      );
      const after = await runReadOnly(ctx.db, 'SELECT 2 AS two');
      return { err, after: after.rows };
    });
    expect(out.err).toMatch(/read-only transaction/);
    expect(out.after).toEqual([{ two: 2 }]);
  });

  it('works off a request transaction too', async () => {
    const { ctx } = await mountForTest(ENGINE);
    expect((await runReadOnly(ctx.db, 'SELECT 3 AS three')).rows).toEqual([{ three: 3 }]);
  });
});
