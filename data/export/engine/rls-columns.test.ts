/**
 * Export honours RLS and column permissions.
 *
 * This replaces `zveltio/packages/engine/src/tests/harness/export-rls-columns.
 * test.ts`, which guarded the same rule while `/api/export` was an engine
 * route. That route became a 410 shim when the dual door was closed, and the
 * test went with it — but the rule did not move, it came HERE, and deleting the
 * guard without a replacement leaves a fixed vulnerability unwatched.
 *
 * What it guarded: `/api/export/:collection` checked read on the COLLECTION and
 * then selected every row and every column, so a user could export exactly the
 * rows an RLS policy hid and exactly the columns a column permission forbade —
 * the same data as the data API, through a different route.
 *
 * ## Why the shape is a recorder rather than a database
 *
 * The question is whether the route ASKS. A real Postgres answering correctly
 * would hide a missing `getRlsFilters` behind a result that happens to be
 * empty, and the original bug was live for months under a suite that passed.
 * So `ctx.internals` here is instrumented: the helpers record that they were
 * called, `getColumnAccess` returns a mask that actually hides a column, and
 * `applyRlsFilters` marks the query it was handed. A route that skips either
 * one fails on the call log, not on the row count.
 *
 * It runs against the PACKED `engine/index.js` — the artifact the engine loads,
 * not the source beside it.
 */

import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const COLLECTION = 'staff';
/** Forbidden to this role by a column permission. */
const HIDDEN = 'salary';
/** Hidden from this user by a row policy. */
const HIDDEN_ROW = { id: 'r2', name: 'restricted', salary: '200', bucket: 'restricted' };
const VISIBLE_ROW = { id: 'r1', name: 'visible', salary: '100', bucket: 'open' };

interface Calls {
  getRlsFilters: number;
  applyRlsFilters: number;
  getColumnAccess: number;
  /** Columns the route actually asked Postgres for, if it projected. */
  selected: string[] | null;
  /** True once a row filter has been applied to the query. */
  filtered: boolean;
}

function harness() {
  const calls: Calls = {
    getRlsFilters: 0,
    applyRlsFilters: 0,
    getColumnAccess: 0,
    selected: null,
    filtered: false,
  };

  const builder = (): Any => {
    const b: Any = {
      select(cols: Any) {
        calls.selected = Array.isArray(cols) ? cols.map(String) : [String(cols)];
        return b;
      },
      selectAll: () => b,
      where: () => b,
      orderBy: () => b,
      limit: () => b,
      offset: () => b,
      values: () => b,
      set: () => b,
      returning: () => b,
      returningAll: () => b,
      onConflict: () => b,
      innerJoin: () => b,
      leftJoin: () => b,
      groupBy: () => b,
      // Behaves like Postgres in the two ways that matter here.
      //
      // The filter: rows come back UNFILTERED unless applyRlsFilters ran, so a
      // route that never applies the policy returns the row it should have
      // hidden and the assertion catches that — rather than an accidentally
      // empty table, which would pass while proving nothing.
      //
      // The projection: only the columns the route ASKED for come back. The
      // defence against a forbidden column is `select(projectable)`, not a mask
      // applied afterwards — a fake that returns every column regardless would
      // score the real defence as absent and a post-filter as present, which is
      // backwards.
      execute: async () => {
        const rows = calls.filtered ? [VISIBLE_ROW] : [VISIBLE_ROW, HIDDEN_ROW];
        if (!calls.selected) return rows;
        const keep = new Set(calls.selected);
        return rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => keep.has(k))));
      },
      executeTakeFirst: async () => VISIBLE_ROW,
    };
    return b;
  };

  const db: Any = {
    selectFrom: () => builder(),
    insertInto: () => builder(),
    updateTable: () => builder(),
    deleteFrom: () => builder(),
  };

  const ctx: Any = {
    db,
    auth: { api: { getSession: async () => ({ user: { id: 'u1', role: 'member' } }) } },
    checkPermission: async () => true,
    DDLManager: {
      tableExists: async () => true,
      getTableName: (c: string) => `zvd_${c}`,
      getCollection: async () => ({
        name: COLLECTION,
        fields: [{ name: 'name' }, { name: HIDDEN }, { name: 'bucket' }],
      }),
    },
    // Called WITHOUT await in the route, so this must be synchronous or every
    // value serialises to `{}` — a Promise — and the assertions read nothing.
    fieldTypeRegistry: { serialize: (_t: Any, v: Any) => v },
    internals: {
      withTenantIsolation: async (_t: string, fn: Any) => fn(db),
      recordsToCsv: (rows: Any[]) => {
        const cols = Object.keys(rows[0] ?? {});
        return [cols.join(','), ...rows.map((r) => cols.map((c) => r[c]).join(','))].join('\n');
      },
      resolveUserRole: async () => 'member',
      getColumnAccess: async () => {
        calls.getColumnAccess++;
        return { hidden: new Set([HIDDEN]), readable: new Set(['name', 'bucket']) };
      },
      applyColumnAccess: (rows: Any[]) =>
        rows.map((r) => {
          const { [HIDDEN]: _drop, ...rest } = r;
          return rest;
        }),
      getRlsFilters: async () => {
        calls.getRlsFilters++;
        return [{ field: 'bucket', condition: { op: 'eq', value: 'open' } }];
      },
      applyRlsFilters: (q: Any, filters: Any[]) => {
        calls.applyRlsFilters++;
        if (filters.length > 0) calls.filtered = true;
        return q;
      },
      buildCondition: (field: string, cond: Any) => ({ field, cond }),
    },
  };

  return { ctx, calls };
}

let app: Any;
let calls: Calls;

beforeAll(async () => {
  const mod = await import(join(import.meta.dir, 'index.js'));
  const { Hono } = (await import(
    join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
  )) as Any;

  const h = harness();
  calls = h.calls;
  app = new Hono();
  // Surface the exception instead of Hono's bare "Internal Server Error": an
  // incomplete ctx double shows up as a 500 with no clue otherwise, and this
  // file's whole job is to notice what the route asks for.
  app.onError((err: Any, c: Any) => c.json({ error: String(err?.message ?? err) }, 500));
  app.use('*', async (c: Any, next: Any) => {
    c.set('tenant', { id: 't1' });
    c.set('user', { id: 'u1', role: 'member' });
    await next();
  });
  await mod.default.register(app, h.ctx);
});

describe('GET /:collection — the synchronous export', () => {
  let body: Any;
  /**
   * The route answers `{ collection, count, records }`. Reading `data`/`rows`
   * here returned [] and every row assertion below passed while checking
   * nothing — so `records` is resolved once, and asserted non-empty, rather
   * than defaulted away.
   */
  const records = (): Any[] => {
    const rows = (Array.isArray(body) ? body : body.records) as Any[];
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
    return rows;
  };

  beforeAll(async () => {
    const res = await app.request(`/${COLLECTION}?format=json`);
    if (res.status !== 200) throw new Error(`export route failed: ${await res.clone().text()}`);
    expect(res.status).toBe(200);
    body = await res.json();
  });

  test('asks for the caller row policies, and applies them', () => {
    expect(calls.getRlsFilters).toBeGreaterThan(0);
    expect(calls.applyRlsFilters).toBeGreaterThan(0);
    expect(calls.filtered).toBe(true);
  });

  test('does not return a row the policy hides', () => {
    const rows = records();
    expect(rows.map((r) => r.name)).not.toContain('restricted');
  });

  test('asks which columns this role may read', () => {
    expect(calls.getColumnAccess).toBeGreaterThan(0);
  });

  test('never names the forbidden column in the query it builds', () => {
    // The projection is the real defence: a mask applied only after the rows
    // come back still pulled the bytes out of Postgres.
    if (calls.selected) expect(calls.selected).not.toContain(HIDDEN);
  });

  test('does not return the forbidden column', () => {
    const rows = records();
    for (const r of rows) expect(Object.keys(r)).not.toContain(HIDDEN);
  });
});
