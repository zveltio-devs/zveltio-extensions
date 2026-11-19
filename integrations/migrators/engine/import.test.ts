// The import against a REAL engine (`onEngine`): the engine's own `/ext/*` chain
// in front of the packed bundle, and the action route as the engine mounts it.
// Proven here: `importFetch` reaches the target the caller names (`writes: ["*"]`,
// ADR 0047) only as the caller, under their grants; a refused import keeps none
// of its rows; a fetch is imported once.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { onEngine } from '../../../testing/ext-harness';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src');
const C = `mig_${Date.now()}`;

d('migrators importFetch — all or nothing, as the caller', () => {
  let e: Awaited<ReturnType<typeof onEngine>>;
  let member = { cookie: '', userId: '' };
  let reader = { cookie: '', userId: '' };
  let conn = '';

  const run = (body: unknown, cookie = member.cookie) =>
    e.app.request('/ext/integrations/migrators/actions/importFetch', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(body),
    });
  const labels = async () =>
    (await e.sql`SELECT label FROM ${e.sql.table(`zvd_${C}`)} ORDER BY label`.execute(e.db)).rows.map((r: Any) => r.label);
  const runs = async () => (await e.sql`SELECT * FROM zvd_migrator_runs WHERE target_collection = ${C}`.execute(e.db)).rows;
  async function fetched(rows: Any[], status = 'ready'): Promise<string> {
    const columns = [
      { source_field: 'Name', column: 'label', type: 'text' },
      { source_field: 'Qty', column: 'qty', type: 'decimal' },
      { source_field: 'Notes', column: 'notes', type: 'text' },
    ];
    const r = await e.sql`INSERT INTO zvd_migrator_fetches (connection_id, source, object, row_limit, status, columns, rows, total_rows)
      VALUES (${conn}, 'notion', 'db1', 10, ${status}, ${JSON.stringify(columns)}::jsonb, ${JSON.stringify(rows)}::jsonb, ${rows.length})
      RETURNING id`.execute(e.db);
    return r.rows[0].id;
  }

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    const { sql, db } = e;
    // `onEngine` records no consent (grandfathered), so `"*"` runs as after an approval.
    const data = (await import(join(ENGINE, 'lib', 'data', 'index.js'))) as Any;
    await data.DDLManager.createCollection(db, {
      name: C,
      fields: [
        { name: 'label', type: 'text', required: true, unique: true, indexed: false },
        { name: 'qty', type: 'integer', required: false, unique: false, indexed: false },
      ],
    });
    for (let i = 0; i < 100; i++) {
      if ((await sql`SELECT to_regclass(${`zvd_${C}`}) AS t`.execute(db)).rows[0].t) break;
      await Bun.sleep(100);
    }
    const own = [
      { collection: 'migrator_fetches', actions: ['read'] },
      { collection: 'migrator_runs', actions: ['read', 'create', 'execute'] },
    ];
    const session = (grants: Any[]) => e.harness.createMemberSession(e.engineApp, db, { grants });
    member = await session([{ collection: C, actions: ['read', 'create'] }, ...own]);
    // May run the action and read the target, but not create in it.
    reader = await session([{ collection: C, actions: ['read'] }, ...own]);
    // A secret column holds ciphertext only (ADR 0024): the token goes in sealed.
    const { encryptField } = (await import(join(ENGINE, 'lib', 'data', 'field-crypto.js'))) as Any;
    const token = await encryptField('x');
    conn = (
      await sql`INSERT INTO zvd_migrator_connections (source, name, token) VALUES ('notion', 'n', ${token}) RETURNING id`.execute(db)
    ).rows[0].id;
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    await e.db.deleteFrom('zv_revisions').where('collection', '=', C).execute().catch(() => undefined);
    await e.harness.dropTestCollection(e.db, C).catch(() => undefined);
    await e.done();
  });

  it('imports through the mapping as the caller, records the run, and only once', async () => {
    const id = await fetched([{ Name: 'alpha', Qty: 1 }, { Name: 'beta', Notes: null }]);
    const res = await run({ fetch_id: id, target_collection: C, mapping: { Name: 'label', Qty: 'qty' } });
    expect(res.status).toBe(200);
    const { result } = await res.json();
    expect(result).toMatchObject({ imported_rows: 2, skipped_fields: ['Notes'] });
    expect(await labels()).toEqual(['alpha', 'beta']);
    const [r] = await runs();
    expect(r).toMatchObject({ source: 'notion', source_object: 'db1', fetch_id: id, created_by: member.userId });
    expect(r.record_ids).toHaveLength(2);
    const again = await run({ fetch_id: id, target_collection: C, mapping: { Name: 'label' } });
    expect(again.status).toBe(409);
    expect((await again.json()).code).toBe('already_imported');
    expect(await labels()).toEqual(['alpha', 'beta']);
    expect(await runs()).toHaveLength(1);
    await e.sql`DELETE FROM ${e.sql.table(`zvd_${C}`)}`.execute(e.db);
    await e.sql`DELETE FROM zvd_migrator_runs`.execute(e.db);
  });

  it('a refused row rolls back every row before it, and no run is recorded', async () => {
    const id = await fetched([{ Name: 'a' }, { Name: 'b' }, { Name: 'c', Qty: 'many' }]);
    const res = await run({ fetch_id: id, target_collection: C, mapping: { Name: 'label', Qty: 'qty' } });
    expect(res.status).toBe(422);
    expect(await labels()).toEqual([]);
    expect(await runs()).toEqual([]);
  });

  it('a field the target lacks refuses the import, and nothing is kept', async () => {
    const id = await fetched([{ Name: 'gamma', Notes: 'n' }]);
    const res = await run({ fetch_id: id, target_collection: `zvd_${C}` });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(await labels()).toEqual([]);
    expect(await runs()).toEqual([]);
  });

  it('reaches the target only as the caller: no create there imports nothing', async () => {
    const id = await fetched([{ Name: 'r' }]);
    const res = await run({ fetch_id: id, target_collection: C, mapping: { Name: 'label' } }, reader.cookie);
    expect(res.status).toBe(403);
    expect(await labels()).toEqual([]);
    expect(await runs()).toEqual([]);
  });

  it('refuses an unknown or unready fetch, a bad target and a bad mapping', async () => {
    const code = async (body: unknown) => {
      const res = await run(body);
      return [res.status, (await res.json()).code];
    };
    expect(await code({ fetch_id: crypto.randomUUID(), target_collection: C })).toEqual([404, 'fetch_not_found']);
    const pending = await fetched([{ Name: 'p' }], 'pending');
    expect(await code({ fetch_id: pending, target_collection: C })).toEqual([409, 'fetch_not_ready']);
    const id = await fetched([{ Name: 'q', Qty: 1 }]);
    expect((await run({ fetch_id: id, target_collection: 'Bad Name' })).status).toBe(400);
    expect(await code({ fetch_id: id, target_collection: C, mapping: { Name: 'label', Qty: 'label' } })).toEqual([
      400,
      'duplicate_target_field',
    ]);
    expect(await code({ fetch_id: id, target_collection: C, mapping: { Nmae: 'label' } })).toEqual([400, 'unknown_source_field']);
    expect(await labels()).toEqual([]);
  });
});
