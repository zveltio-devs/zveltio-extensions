/**
 * A share or favourite naming another tenant's file or folder is refused.
 *
 * PostgreSQL checks a foreign key outside row-level security, so another
 * tenant's id satisfied the FK: the share or favourite pointed into that tenant,
 * and the answer told the caller the id exists. The routes now ask the
 * RLS-scoped `ctx.db` first. `ctx.db` here is a recorder whose reads find
 * nothing, which is what RLS shows for a foreign row. Runs against the PACKED
 * bundle.
 *
 * Not covered because not affected: `resolveFolder` creates a folder only under
 * a parent it just read through `ctx.db`, so its `parent_id` is always visible.
 */

import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import extension from './index.js';

// The repository's own Hono, by path — as testing/ext-harness.ts loads it.
const { Hono } = await import(join(import.meta.dir, '../../../node_modules/hono/dist/index.js'));

const FOREIGN = '22222222-2222-4222-8222-222222222222';

function mount() {
  const writes: string[] = [];
  const chain = (table: string, op: string): Record<string, unknown> => {
    const c: Record<string, unknown> = {};
    for (const m of ['select', 'selectAll', 'where', 'set', 'values', 'returning', 'orderBy']) {
      c[m] = () => c;
    }
    const run = async () => {
      if (op !== 'select') writes.push(`${op} ${table}`);
      return undefined;
    };
    c.executeTakeFirst = run;
    c.execute = async () => (op === 'select' ? [] : run());
    return c;
  };
  const db = {
    selectFrom: (t: string) => chain(t, 'select'),
    insertInto: (t: string) => chain(t, 'insert'),
    updateTable: (t: string) => chain(t, 'update'),
    deleteFrom: (t: string) => chain(t, 'delete'),
  };
  const ctx = {
    db,
    auth: { api: { getSession: async () => ({ user: { id: 'u1' } }) } },
    checkPermission: async () => true,
    registerPublicRoute: () => {},
    internals: {
      isTenantAdmin: async () => false,
      extensionRegistry: { registerTrashPurgeHandler: () => {} },
    },
    services: { get: () => undefined },
    config: {},
  };
  const app = new Hono();
  const ready = extension.register(app as never, ctx as never);
  return { app, ready, writes };
}

describe('storage/cloud — a foreign file or folder id is refused before anything is written', () => {
  const cases: Array<[string, unknown]> = [
    ['/share', { file_id: FOREIGN }],
    ['/share', { folder_id: FOREIGN }],
    [`/favorites/${FOREIGN}`, undefined],
  ];
  for (const [path, body] of cases) {
    it(`POST ${path} ${body ? JSON.stringify(body) : ''}`, async () => {
      const { app, ready, writes } = mount();
      await ready;
      const res = await app.request(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      expect(res.status).toBe(404);
      expect(writes).toEqual([]);
    });
  }
});
