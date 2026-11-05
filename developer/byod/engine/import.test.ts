// POST /import registers a schema's tables as collections and records the scan
// in `byod_scans`, as the caller, in the request's transaction.
import { afterAll, describe, expect, it } from 'bun:test';
import { sql } from 'kysely';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;
const SCHEMA = `byod_src_${Date.now()}`;
const TABLE = `byodw_${Date.now()}`;
// The harness session's user: the tenant transaction acts as them on every collection.
const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';

d('developer/byod — POST /import', () => {
  let pg: { unsafe: (q: string, a?: unknown[]) => Promise<any>; close: () => Promise<void> };

  async function source() {
    if (pg) return pg;
    const { SQL } = await import('bun');
    pg = new SQL(process.env.TEST_DATABASE_URL!) as unknown as typeof pg;
    await pg.unsafe(`CREATE SCHEMA ${SCHEMA}`);
    await pg.unsafe(`CREATE TABLE ${SCHEMA}.${TABLE} (id uuid PRIMARY KEY, name text)`);
    // Requests run as `zveltio_rls`, and `information_schema` lists only what the
    // role may use: the operator grants it their tables, as SETUP.md says.
    await pg.unsafe(`GRANT USAGE ON SCHEMA ${SCHEMA} TO zveltio_rls`);
    await pg.unsafe(`GRANT SELECT ON ${SCHEMA}.${TABLE} TO zveltio_rls`);
    return pg;
  }

  afterAll(async () => {
    await pg?.unsafe('DELETE FROM zvd_collections WHERE name = $1', [TABLE]);
    await pg?.unsafe('DELETE FROM zvd_byod_scans WHERE schema_name = $1', [SCHEMA]);
    await pg?.unsafe(`DROP SCHEMA IF EXISTS ${SCHEMA} CASCADE`);
    await pg?.close();
  });

  /** The app as an instance administrator reaches it, with the data API's write granted or refused. */
  async function instanceAdmin(scanWrite: 201 | 403) {
    const mounted = await mountForTest(import.meta.dir, { transaction: true, transactionUser: HARNESS_USER });
    const { ctx } = mounted;
    const { introspectSchema } = await import('../../../../zveltio/packages/engine/src/lib/introspection.js');
    ctx.internals.requireInstanceAdmin = async () => true;
    ctx.internals.introspectSchema = introspectSchema;
    ctx.internals.createRecord = async (_c: unknown, collection: string, data: Record<string, unknown>) => {
      expect(collection).toBe('byod_scans');
      if (scanWrite === 403) return { status: 403, body: { title: 'Forbidden' } };
      // The data API's write, granted.
      const row = await sql<{ id: string }>`
          INSERT INTO zvd_byod_scans (schema_name, status, triggered_by, tables_found, tables_imported, tables_updated)
          VALUES (${data.schema_name}, ${data.status}, ${data.triggered_by},
                  ${data.tables_found ?? 0}, ${data.tables_imported ?? 0}, ${data.tables_updated ?? 0})
          RETURNING id::text`.execute(ctx.db);
      return { status: 201, body: { id: row.rows[0]!.id, ...data } };
    };
    return mounted;
  }

  const post = (app: any) =>
    app.request('/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schema: SCHEMA }),
    });

  const registered = async () =>
    (await (await source()).unsafe('SELECT 1 FROM zvd_collections WHERE name = $1', [TABLE])).length;

  // Collections are shared by every tenant: a tenant administrator who is not an
  // instance administrator may not register one.
  it('refuses a tenant administrator', async () => {
    await source();
    const { app } = await mountForTest(import.meta.dir, { transaction: true });
    expect((await post(app)).status).toBe(403);
    expect(await registered()).toBe(0);
  });

  it('rolls the import back when the scan cannot be recorded', async () => {
    await source();
    const { app } = await instanceAdmin(403);
    expect((await post(app)).status).toBe(500);
    expect(await registered()).toBe(0);
  });

  it('registers the tables and records the scan', async () => {
    await source();
    const { app } = await instanceAdmin(201);
    const res = await post(app);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { imported: number; updated: number };
    expect(body).toMatchObject({ imported: 1, updated: 0 });
    expect(await registered()).toBe(1);
    const scans = await pg.unsafe(
      'SELECT status, tables_found::int, tables_imported::int FROM zvd_byod_scans WHERE schema_name = $1',
      [SCHEMA],
    );
    expect(scans).toEqual([{ status: 'completed', tables_found: 1, tables_imported: 1 }]);
  });
});
