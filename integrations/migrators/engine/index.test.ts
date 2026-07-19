// Auto-generated per-extension contract test — shared logic in testing/ext-harness.ts.
// Runs against the packed engine/index.js + real Postgres (TEST_DATABASE_URL; skips without it).
import { afterAll, describe, expect, it } from 'bun:test';
import { extensionContract, mountForTest } from '../../../testing/ext-harness';

await extensionContract(import.meta.dir);

// Full-pipeline regression with the vendor API MOCKED at the fetch layer:
// encrypted connection → objects → preview (field inference) → run (real rows
// land in a real Postgres table) → audited run row. Everything except the
// external HTTP call is the real production path (packed bundle, real DB).
const d =
  process.env.TEST_DATABASE_URL && process.env.FIELD_ENCRYPTION_KEY ? describe : describe.skip;

const realFetch = globalThis.fetch;
afterAll(() => {
  globalThis.fetch = realFetch;
});

function mockAirtable(): void {
  // biome-ignore lint/suspicious/noExplicitAny: test stub
  globalThis.fetch = (async (url: any) => {
    const u = String(url);
    if (u.includes('api.airtable.com/v0/meta/bases') && !u.includes('/tables')) {
      return Response.json({ bases: [{ id: 'appBase1', name: 'CRM Base' }] });
    }
    if (u.includes('/tables')) {
      return Response.json({ tables: [{ id: 'tblLeads', name: 'Leads' }] });
    }
    if (u.includes('api.airtable.com/v0/appBase1/tblLeads')) {
      return Response.json({
        records: [
          { id: 'rec1', fields: { Name: 'Ana Pop', 'E-mail': 'ana@example.com', Score: 42, Active: true } },
          { id: 'rec2', fields: { Name: 'Ion Dan', 'E-mail': 'ion@example.com', Score: 17, Active: false } },
        ],
      });
    }
    throw new Error(`unexpected fetch in test: ${u}`);
  }) as typeof fetch;
}

d('integrations/migrators bespoke (mocked vendor API)', () => {
  it('connection → objects → preview → run lands rows in a real table', async () => {
    const { app } = await mountForTest(import.meta.dir);
    const pgMod = (await import('pg')) as unknown as { Pool: new (o: object) => { query: (q: string) => Promise<unknown>; end: () => Promise<void> } };
    const pool = new pgMod.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const target = `zvd_migr_probe_${Date.now()}`;
    await pool.query(
      `CREATE TABLE ${target} (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
         airtable_id TEXT, name TEXT, e_mail TEXT, score NUMERIC, active BOOLEAN)`,
    );

    try {
      mockAirtable();

      const create = await app.request('/connections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: 'airtable', name: 'Test PAT', token: 'pat-test-token-123' }),
      });
      expect(create.status).toBe(201);
      const { connection } = (await create.json()) as { connection: { id: string } };

      // Token never leaves the server, and it is encrypted at rest.
      const list = await app.request('/connections');
      const listBody = await list.text();
      expect(listBody).not.toContain('pat-test-token-123');
      const stored = (await pool.query(
        `SELECT token_enc FROM zv_migrator_connections WHERE id = '${connection.id}'`,
      )) as { rows: Array<{ token_enc: string }> };
      expect(stored.rows[0]!.token_enc.startsWith('enc1:')).toBe(true);
      expect(stored.rows[0]!.token_enc).not.toContain('pat-test-token-123');

      const objects = await app.request(`/connections/${connection.id}/objects`);
      expect(objects.status).toBe(200);
      const objBody = (await objects.json()) as { objects: Array<{ id: string; label: string }> };
      expect(objBody.objects[0]).toEqual({ id: 'appBase1/tblLeads', label: 'CRM Base → Leads' });

      const preview = await app.request('/preview', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ connection_id: connection.id, object: 'appBase1/tblLeads' }),
      });
      expect(preview.status).toBe(200);
      const prev = (await preview.json()) as { columns: Array<{ source_field: string; column: string; type: string }> };
      const colOf = (f: string) => prev.columns.find((c) => c.source_field === f);
      expect(colOf('E-mail')?.column).toBe('e_mail');
      expect(colOf('Score')?.type).toBe('numeric');
      expect(colOf('Active')?.type).toBe('boolean');

      const run = await app.request('/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ connection_id: connection.id, object: 'appBase1/tblLeads', target_collection: target }),
      });
      expect(run.status).toBe(200);
      const runBody = (await run.json()) as { status: string; imported_rows: number; total_rows: number };
      expect(runBody.status).toBe('completed');
      expect(runBody.imported_rows).toBe(2);

      const rows = (await pool.query(`SELECT name, e_mail, score, active FROM ${target} ORDER BY name`)) as {
        rows: Array<{ name: string; e_mail: string; score: string; active: boolean }>;
      };
      expect(rows.rows.map((r) => r.name)).toEqual(['Ana Pop', 'Ion Dan']);
      expect(rows.rows[0]!.e_mail).toBe('ana@example.com');
      expect(rows.rows[0]!.active).toBe(true);

      const runs = await app.request('/runs');
      const runsBody = (await runs.json()) as { runs: Array<{ status: string; target_collection: string }> };
      expect(runsBody.runs.some((r) => r.target_collection === target && r.status === 'completed')).toBe(true);
    } finally {
      globalThis.fetch = realFetch;
      await pool.query(`DROP TABLE IF EXISTS ${target}`).catch(() => undefined);
      await pool.end();
    }
  });

  it('run against a missing collection fails with a clear 400', async () => {
    const { app } = await mountForTest(import.meta.dir);
    mockAirtable();
    try {
      const create = await app.request('/connections', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ source: 'airtable', name: 'T2', token: 'pat-test-token-456' }),
      });
      const { connection } = (await create.json()) as { connection: { id: string } };
      const run = await app.request('/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ connection_id: connection.id, object: 'appBase1/tblLeads', target_collection: 'zvd_does_not_exist' }),
      });
      expect(run.status).toBe(400);
      expect(((await run.json()) as { error: string }).error).toContain('does not exist');
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
