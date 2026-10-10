/**
 * An edge function's egress — the hosts it may reach — is saved here, and the
 * save is the admin's approval (engine migration 061 made it a column).
 *
 * - A host that is not one is refused at save, naming the entry, instead of
 *   failing every invocation later; what is saved is lower-cased, deduplicated.
 * - `ZVELTIO_EGRESS` in `env_vars` is refused: the engine no longer reads it,
 *   so accepting it would save a permission that grants nothing.
 * - Every change of the list is audited — who, which function, before, after —
 *   and a save that leaves it alone is not.
 *
 * Real Postgres and the packed bundle, through the shared harness. Run with
 * EXT_HARNESS_DRIVER=bun as well: the column is a `text[]` bound from a JS array.
 */

import { afterAll, describe, expect, it } from 'bun:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { mountForTest } from '../../../testing/ext-harness';

const d =
  process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;
const STAMP = Date.now();
const created: string[] = [];

const send = (app: any, method: string, path: string, body: unknown) =>
  app.request(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

async function egressOf(db: any, id: string): Promise<string[] | null> {
  const r = await sql<{ egress: string[] | null }>`
    SELECT egress FROM zv_edge_functions WHERE id = ${id}
  `.execute(db);
  return r.rows[0]!.egress;
}

async function audits(db: any, id: string) {
  const r = await sql<{ user_id: string | null; metadata: any }>`
    SELECT user_id, metadata FROM zv_audit_log
     WHERE event_type = 'edge_function.egress_changed' AND resource_id = ${id}
     ORDER BY created_at
  `.execute(db);
  return r.rows.map((x) => {
    const m = typeof x.metadata === 'string' ? JSON.parse(x.metadata) : x.metadata;
    return { user: x.user_id, before: m.before, after: m.after };
  });
}

d('edge function egress at save', () => {
  // The test's own reader: `zv_audit_log` is the engine's, refused to `ctx.db`.
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const db = new Kysely<Record<string, never>>({ dialect: new PostgresDialect({ pool }) });

  afterAll(async () => {
    if (created.length) {
      await sql`DELETE FROM zv_edge_functions WHERE id = ANY(${created}::uuid[])`.execute(db);
    }
    await db.destroy();
  });

  it('refuses a host that is not one, and env_vars.ZVELTIO_EGRESS', async () => {
    const { app } = await mountForTest(import.meta.dir);
    for (const bad of ['https://api.stripe.com', '*.stripe.com', 'api.stripe.com/v1', 'a b']) {
      const res = await send(app, 'POST', '/', {
        name: `eg-bad-${STAMP}`,
        display_name: 'x',
        egress: [bad],
      });
      expect([bad, res.status]).toEqual([bad, 400]);
      expect(JSON.stringify(await res.json())).toContain('is not a host');
    }
    const env = await send(app, 'POST', '/', {
      name: `eg-env-${STAMP}`,
      display_name: 'x',
      env_vars: { ZVELTIO_EGRESS: 'api.stripe.com' },
    });
    expect(env.status).toBe(400);
    expect(JSON.stringify(await env.json())).toContain('ZVELTIO_EGRESS is no longer read');
  });

  it('saves the list normalised and audits each change of it', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const res = await send(app, 'POST', '/', {
      name: `eg-ok-${STAMP}`,
      display_name: 'x',
      egress: [' API.Stripe.com ', 'api.stripe.com', 'hooks.slack.com:8443'],
    });
    expect(res.status).toBe(201);
    const fn = (await res.json()).function;
    created.push(fn.id);
    expect(fn.egress).toEqual(['api.stripe.com', 'hooks.slack.com:8443']);
    expect(await egressOf(db, fn.id)).toEqual(['api.stripe.com', 'hooks.slack.com:8443']);

    // Untouched egress: no entry.
    expect((await send(app, 'PATCH', `/${fn.id}`, { description: 'd' })).status).toBe(200);
    expect((await send(app, 'PATCH', `/${fn.id}`, { egress: ['api.stripe.com', 'hooks.slack.com:8443'] })).status).toBe(200);
    // Narrowed to nothing, then undeclared.
    expect((await send(app, 'PATCH', `/${fn.id}`, { egress: [] })).status).toBe(200);
    expect(await egressOf(db, fn.id)).toEqual([]);
    expect((await send(app, 'PATCH', `/${fn.id}`, { egress: null })).status).toBe(200);
    expect(await egressOf(db, fn.id)).toBeNull();
    expect((await send(app, 'PATCH', `/${fn.id}`, { egress: ['x.test'] })).status).toBe(200);
    expect((await send(app, 'PATCH', `/${fn.id}`, { egress: ['ftp://x.test'] })).status).toBe(400);
    expect(await egressOf(db, fn.id)).toEqual(['x.test']);

    const log = await audits(db, fn.id);
    expect(log.map(({ before, after }) => ({ before, after }))).toEqual([
      { before: null, after: ['api.stripe.com', 'hooks.slack.com:8443'] },
      { before: ['api.stripe.com', 'hooks.slack.com:8443'], after: [] },
      { before: [], after: null },
      { before: null, after: ['x.test'] },
    ]);
    expect(log.every((e) => typeof e.user === 'string' && e.user.length > 0)).toBe(true);
  });

  it('a function created without egress declares nothing and is not audited', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const res = await send(app, 'POST', '/', { name: `eg-none-${STAMP}`, display_name: 'x' });
    expect(res.status).toBe(201);
    const fn = (await res.json()).function;
    created.push(fn.id);
    expect(await egressOf(db, fn.id)).toBeNull();
    expect(await audits(db, fn.id)).toEqual([]);
  });
});
