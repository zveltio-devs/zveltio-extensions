/**
 * Import hands the engine the row the file said, and lets the engine shape it.
 *
 * `ctx.internals.dynamicInsert` runs the engine's field pipeline (engine
 * 3.0.0-beta.86): type validation, deserialization — where a `password` hashes
 * — field encryption, and the collection's validation rules. This extension
 * used to deserialize and encrypt by hand, which validated nothing, and doing
 * it now as well makes the engine judge the ciphertext: an encrypted `email`
 * fails as an email. So the contract is the opposite of what it was: the row
 * reaching `dynamicInsert` is RAW, and nothing here encrypts or deserializes.
 * The engine side is proven by its harness test
 * `internals-dynamic-insert-pipeline.test.ts`.
 *
 * ## Shape
 *
 * Against the PACKED `engine/index.js`, with `ctx` instrumented rather than a
 * database attached: the assertion is on what reaches `dynamicInsert`, which is
 * the last thing the extension controls before the engine. `runImport` is
 * deliberately fire-and-forget (the route enqueues and answers), so the test
 * synchronises on the insert itself rather than on a sleep.
 */

import { beforeAll, describe, expect, test } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const COLLECTION = 'people';
const RAW_SECRET = 'plaintext-secret';
const RAW_PASSWORD = 'hunter2';

interface Deferred {
  promise: Promise<Record<string, unknown>>;
  resolve: (row: Record<string, unknown>) => void;
}
function deferred(): Deferred {
  let resolve!: (row: Record<string, unknown>) => void;
  const promise = new Promise<Record<string, unknown>>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function harness() {
  const inserted = deferred();
  const seen = { deserialize: [] as string[], maybeEncrypt: [] as Array<[unknown, boolean]> };

  const builder = (): Any => {
    const b: Any = {
      select: () => b,
      selectAll: () => b,
      where: () => b,
      orderBy: () => b,
      limit: () => b,
      values: () => b,
      set: () => b,
      returning: () => b,
      returningAll: () => b,
      onConflict: () => b,
      execute: async () => [],
      executeTakeFirst: async () => ({ id: 'job1' }),
      executeTakeFirstOrThrow: async () => ({ id: 'job1' }),
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
    auth: { api: { getSession: async () => ({ user: { id: 'u1', role: 'admin' } }) } },
    checkPermission: async () => true,
    DDLManager: {
      tableExists: async () => true,
      getTableName: (c: string) => `zvd_${c}`,
      getCollection: async () => ({
        name: COLLECTION,
        fields: [
          { name: 'name', type: 'text' },
          { name: 'secret', type: 'text', encrypted: true },
          { name: 'pwd', type: 'password' },
        ],
      }),
    },
    fieldTypeRegistry: {
      // Present so a regression that reaches for them again is recorded.
      deserialize: async (type: string, v: Any) => {
        seen.deserialize.push(type);
        return v;
      },
    },
    internals: {
      withTenantIsolation: async (_t: string, fn: Any) => fn(db),
      maybeEncrypt: async (v: Any, on: boolean) => {
        seen.maybeEncrypt.push([v, on]);
        return v;
      },
      dynamicInsert: async (_db: Any, _table: string, row: Record<string, unknown>) => {
        inserted.resolve(row);
        return { id: 'r1' };
      },
    },
  };

  return { ctx, inserted, seen };
}

let app: Any;
let h: ReturnType<typeof harness>;
let row: Record<string, unknown>;

beforeAll(async () => {
  const mod = await import(join(import.meta.dir, 'index.js'));
  const { Hono } = (await import(
    join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
  )) as Any;

  h = harness();
  app = new Hono();
  app.onError((err: Any, c: Any) => c.json({ error: String(err?.message ?? err) }, 500));
  app.use('*', async (c: Any, next: Any) => {
    c.set('tenant', { id: 't1' });
    c.set('user', { id: 'u1', role: 'admin' });
    await next();
  });
  await mod.default.register(app, h.ctx);

  const res = await app.request(`/${COLLECTION}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rows: [{ name: 'Ana', secret: RAW_SECRET, pwd: RAW_PASSWORD }],
    }),
  });
  if (res.status >= 400) throw new Error(`import route failed: ${await res.clone().text()}`);

  // The route answers before the job runs. Waiting on the insert is the only
  // deterministic join point; a sleep would pass on a fast machine and flake on
  // a loaded one.
  row = await h.inserted.promise;
});

describe('what reaches the engine', () => {
  test('the row is the file\'s, untransformed', () => {
    expect(row).toEqual({ name: 'Ana', secret: RAW_SECRET, pwd: RAW_PASSWORD });
  });

  test('nothing here deserializes or encrypts — the engine pipeline does', () => {
    expect(h.seen.deserialize).toEqual([]);
    expect(h.seen.maybeEncrypt).toEqual([]);
  });
});
