// The import against a REAL engine (`onEngine`): the engine's own `/ext/*` chain
// in front of the packed bundle, and the action route as the engine mounts it.
// What only the real chain can show: the import reaches the collection the
// caller names (`writes: ["*"]`, ADR 0047) only as the caller, under the
// caller's grants, and a refused import keeps none of its rows — an action is
// the request's transaction, and its throw rolls the whole import back.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { onEngine } from '../../../testing/ext-harness';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const C = `imp_${Date.now()}`;

d('data/import — all or nothing, as the caller', () => {
  let e: Awaited<ReturnType<typeof onEngine>>;
  let member = { cookie: '', userId: '' };
  let reader = { cookie: '', userId: '' };

  const run = (action: string, body: unknown, cookie = member.cookie) =>
    e.app.request(`/ext/data/import/actions/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(body),
    });
  const labels = async () =>
    (await e.sql`SELECT label FROM ${e.sql.table(`zvd_${C}`)} ORDER BY label`.execute(e.db)).rows.map((r: Any) => r.label);
  const jobs = async () => (await e.sql`SELECT * FROM zvd_data_import_jobs WHERE target_collection = ${C}`.execute(e.db)).rows;

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    const { sql, db } = e;
    // `onEngine` records no consent (grandfathered), so `"*"` runs as after an approval.
    const data = (await import(join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src', 'lib', 'data', 'index.js'))) as Any;
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
    const jobGrant = { collection: 'data_import_jobs', actions: ['read', 'create', 'update', 'execute'] };
    const session = (grants: Any[]) => e.harness.createMemberSession(e.engineApp, db, { grants });
    member = await session([
      { collection: C, actions: ['read', 'create', 'delete'] },
      jobGrant,
      { collection: 'data_import_profiles', actions: ['read'] },
    ]);
    // May run the action and read the target, but not create in it.
    reader = await session([{ collection: C, actions: ['read'] }, jobGrant]);
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    await e.db.deleteFrom('zv_revisions').where('collection', '=', C).execute().catch(() => undefined);
    await e.harness.dropTestCollection(e.db, C).catch(() => undefined);
    await e.done();
  });

  it('an invalid row is reported with every other one, and nothing is kept', async () => {
    const res = await run('importRows', { collection: C, rows: [{ label: 'a' }, { label: 'b', qty: 'many' }, { qty: 3 }] });
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe('invalid_rows');
    expect(body.detail).toContain('row 2:');
    expect(body.detail).toContain('row 3:');
    expect(body.detail).not.toContain('row 1:');
    expect(await labels()).toEqual([]);
    expect(await jobs()).toEqual([]);
  });

  it('a row the database refuses rolls back the rows before it', async () => {
    const res = await run('importRows', { collection: C, rows: [{ label: 'x' }, { label: 'x' }] });
    expect(res.status).toBe(409);
    expect((await res.json()).detail).toStartWith('Row 2:');
    expect(await labels()).toEqual([]);
  });

  it('reaches the target only as the caller: without create there, nothing is imported', async () => {
    const res = await run('importRows', { collection: C, rows: [{ label: 'r' }] }, reader.cookie);
    expect(res.status).toBe(403);
    expect(await labels()).toEqual([]);
    expect(await jobs()).toEqual([]);
  });

  it('refuses rows that are not objects, a malformed mapping, both rows and text, and a foreign profile', async () => {
    expect((await run('importRows', { collection: C, rows: [{ label: 'n1' }, null, 3] })).status).toBe(400);
    expect((await run('importRows', { collection: C, rows: [{ L: 'n2' }], mapping: { L: 'label', M: 'label' } })).status).toBe(400);
    expect((await run('importRows', { collection: C, rows: [{ label: 'n3' }], text: '[]' })).status).toBe(400);
    const [{ id }] = (
      await e.sql`INSERT INTO zvd_data_import_profiles (name, target_collection, mappings)
                VALUES ('other', 'not_this_one', '{}'::jsonb) RETURNING id`.execute(e.db)
    ).rows;
    expect((await run('importRows', { collection: C, rows: [{ label: 'n4' }], profile_id: id })).status).toBe(400);
    expect(await labels()).toEqual([]);
  });

  it('NDJSON text is parsed as NDJSON', async () => {
    const res = await run('importRows', { collection: C, text: '{"label":"j1"}\n{"label":"j2","qty":2}\n', format: 'ndjson' });
    expect(res.status).toBe(200);
    expect((await res.json()).result.imported_rows).toBe(2);
    expect(await labels()).toEqual(['j1', 'j2']);
    await e.sql`DELETE FROM ${e.sql.table(`zvd_${C}`)}`.execute(e.db);
  });

  it('imports CSV text through the mapping, records the job, and rolls it back once', async () => {
    const res = await run('importRows', {
      collection: C,
      text: 'Name;Qty\nalpha;1\nbeta;\n',
      delimiter: ';',
      filename: 'items.csv',
      mapping: { Name: 'label', Qty: 'qty' },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).result.imported_rows).toBe(2);
    expect(await labels()).toEqual(['alpha', 'beta']);
    const [job] = (await jobs()).filter((j: Any) => j.format === 'csv');
    expect(job).toMatchObject({ format: 'csv', filename: 'items.csv', created_by: member.userId });
    expect(Number(job.imported_rows)).toBe(2);
    expect((await e.sql`SELECT qty FROM ${e.sql.table(`zvd_${C}`)} ORDER BY label`.execute(e.db)).rows.map((r: Any) => r.qty && Number(r.qty))).toEqual([1, null]);
    expect(job.record_ids).toHaveLength(2);

    const undo = await run('rollbackImport', { id: job.id });
    expect(undo.status).toBe(200);
    expect((await undo.json()).result).toEqual({ deleted_records: 2 });
    expect(await labels()).toEqual([]);
    expect((await jobs()).find((j: Any) => j.id === job.id).rolled_back_at).not.toBeNull();
    const again = await run('rollbackImport', { id: job.id });
    expect(again.status).toBe(409);
    expect((await again.json()).code).toBe('already_rolled_back');
  });
});
