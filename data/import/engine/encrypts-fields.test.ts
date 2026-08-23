/**
 * Import does not write what the file said.
 *
 * This replaces `zveltio/packages/engine/src/tests/harness/import-encrypts-
 * fields.test.ts`, which guarded the same rule while `/api/import` was an
 * engine route. That route became a 410 shim when the dual door was closed and
 * the test went with it — but the rule came HERE, and it is the one that
 * decides whether a password or a secret sits in plaintext on disk.
 *
 * Two transforms have to happen between the parsed row and the INSERT, and
 * neither is visible afterwards in the UI — a `password` field renders as a
 * password whether it was hashed or not, and an `encrypted: true` column reads
 * back decrypted either way. Only the bytes at rest differ, which is why this
 * needs a test rather than a look:
 *
 *   - `fieldTypeRegistry.deserialize` — where the `password` type hashes.
 *   - `maybeEncrypt` — for a column the collection marked `encrypted: true`.
 *
 * Import writes straight to the table through `dynamicInsert`, NOT through the
 * host's write pipeline, so both are applied here by hand and both can be lost
 * by an edit that looks harmless.
 *
 * ## Shape
 *
 * Against the PACKED `engine/index.js`, with `ctx` instrumented rather than a
 * database attached: the assertion is on what reaches `dynamicInsert`, which is
 * the last thing the extension controls before Postgres. `runImport` is
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

/** What the doubles stamp on, so a value that skipped one is recognisable. */
const ENCRYPTED = (v: string) => `enc(${v})`;
const DESERIALIZED = (type: string, v: string) => `${type}:${v}`;

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
      // Async on purpose: the route once failed to await this and put a PROMISE
      // in the row, which Bun.SQL resolved on the way to Postgres so nothing
      // looked wrong — while `maybeEncrypt` had already seen the Promise, taken
      // its non-string exit, and left the column in plaintext.
      deserialize: async (type: string, v: Any) => {
        seen.deserialize.push(type);
        return typeof v === 'string' ? DESERIALIZED(type, v) : v;
      },
    },
    internals: {
      withTenantIsolation: async (_t: string, fn: Any) => fn(db),
      maybeEncrypt: async (v: Any, on: boolean) => {
        seen.maybeEncrypt.push([v, on]);
        return on && typeof v === 'string' ? ENCRYPTED(v) : v;
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

describe('what reaches the table', () => {
  test('the encrypted column is not the value from the file', () => {
    expect(row.secret).not.toBe(RAW_SECRET);
    expect(row.secret).toBe(ENCRYPTED(DESERIALIZED('text', RAW_SECRET)));
  });

  test('the password column went through the type that hashes it', () => {
    expect(row.pwd).not.toBe(RAW_PASSWORD);
    expect(h.seen.deserialize).toContain('password');
    expect(row.pwd).toBe(DESERIALIZED('password', RAW_PASSWORD));
  });

  test('a plain column is still written, so the transforms are not blanket', () => {
    expect(row.name).toBe(DESERIALIZED('text', 'Ana'));
  });
});

describe('how it gets there', () => {
  test('maybeEncrypt is told which columns are marked encrypted', () => {
    const flags = h.seen.maybeEncrypt.map(([, on]) => on);
    expect(flags).toContain(true);
    expect(flags).toContain(false);
  });

  test('maybeEncrypt never sees a Promise — deserialize is awaited first', () => {
    for (const [value] of h.seen.maybeEncrypt) {
      expect(value).not.toBeInstanceOf(Promise);
    }
  });
});
