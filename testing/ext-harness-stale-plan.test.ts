// An extension migration that reshapes a table must not strand the engine
// pool's prepared plans for it.
//
// The engine's Bun.SQL pool prepares every statement by name, per connection. A
// migration that adds a column to a table a connection already ran `SELECT *`
// over leaves that plan describing the old row: Postgres answers the next
// execution with `0A000 cached plan must not change result type`, on that
// connection, every time. The engine boot recycles its pool after extension
// migrations for exactly this (`recycleActivePool`); the harness did not, so
// its outcome depended on file order. `ai`'s migration adds columns to the
// engine's `zvd_collections`; once a new suite opened the engine pool before
// `ai` was first mounted, `DDLManager.getCollection` failed inside unrelated
// requests (ldap, i18n) as a 500 — in CI only, where the database is fresh.
import { SQL } from 'bun';
import { afterAll, describe, expect, it } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { mountForTest } from './ext-harness';

const d = process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;
const TABLE = 'zvd_zz_stale_plan';

// Two extensions over one table: the first creates it, the second adds a column.
const root = mkdtempSync(join(tmpdir(), 'zv-stale-plan-'));
const fixture = (name: string, migration: string) => {
  const dir = join(root, name, 'engine');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, '001.sql'), migration);
  writeFileSync(
    join(dir, 'index.js'),
    `export default {
       name: '${name}',
       getMigrations: () => [${JSON.stringify(join(dir, '001.sql'))}],
       register(app, ctx) {
         app.get('/', async (c) => c.json(await ctx.db.selectFrom('${TABLE}').selectAll().where('id', '>', 0).execute()));
       },
     };`,
  );
  return dir;
};
const CREATES = fixture('zz-creates', `DROP TABLE IF EXISTS ${TABLE}; CREATE TABLE ${TABLE} (id int); INSERT INTO ${TABLE} VALUES (1);`);
const RESHAPES = fixture('zz-reshapes', `ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS extra int;`);

d('ext-harness: a migration does not strand the engine pool’s plans', () => {
  afterAll(async () => {
    rmSync(root, { recursive: true, force: true });
    const db = new SQL(process.env.TEST_DATABASE_URL!);
    await db.unsafe(`DROP TABLE IF EXISTS ${TABLE}`);
    await db.close();
  });

  it('a table read keeps answering after another extension adds a column to it', async () => {
    // The pool hands requests to its connections in turn: go round it twice so
    // every connection has prepared the read, before and after.
    const before = (await mountForTest(CREATES, { transaction: true })).app;
    for (let i = 0; i < 40; i++) expect((await before.request('/')).status).toBe(200);

    const after = (await mountForTest(RESHAPES, { transaction: true })).app;
    const statuses = new Set<number>();
    for (let i = 0; i < 40; i++) statuses.add((await after.request('/')).status);
    expect([...statuses]).toEqual([200]);
    expect(await (await after.request('/')).json()).toEqual([{ id: 1, extra: null }]);
  });
});
