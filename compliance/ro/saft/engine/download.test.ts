// The download against a REAL engine (`onEngine`): the action puts the export's
// XML as a stored file of the caller's own, under the name the request's
// `$files.write` gives (ADR 0052), and answers `{ file }`. What only the real
// chain can show: without a write grant nothing is stored, and the file is the
// caller's to fetch.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { onEngine } from '../../../../testing/ext-harness';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('compliance/ro/saft — download hands the caller the XML', () => {
  let e: Awaited<ReturnType<typeof onEngine>>;
  let member = { cookie: '', userId: '' };
  let exportId = '';
  const xml = '<?xml version="1.0"?><AuditFile/>';

  const run = (body: unknown) =>
    e.app.request('/ext/compliance/ro/saft/actions/download', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: member.cookie },
      body: JSON.stringify(body),
    });
  const files = async () =>
    (await e.sql`SELECT id, original_name, size FROM zv_media_files WHERE created_by = ${member.userId}`.execute(e.db)).rows;

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    member = await e.harness.createMemberSession(e.engineApp, e.db, {
      grants: [
        { collection: 'saft_exports', actions: ['read', 'execute'] },
        { collection: 'saft_files', actions: ['read'] },
      ],
    });
    [{ id: exportId }] = (
      await e.sql`INSERT INTO zvd_saft_exports (period_start, period_end, company_name, company_cui, status, file_name)
                VALUES ('2026-01-01', '2026-01-31', 'A', '18547290', 'generated', 'SAFT_A.xml') RETURNING id`.execute(e.db)
    ).rows;
    await e.sql`INSERT INTO zvd_saft_files (export_id, xml) VALUES (${exportId}, ${xml})`.execute(e.db);
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    await e.sql`DELETE FROM zvd_saft_files`.execute(e.db).catch(() => undefined);
    await e.sql`DELETE FROM zvd_saft_exports`.execute(e.db).catch(() => undefined);
    await e.done();
  });

  it('without a write grant stores nothing', async () => {
    const res = await run({ id: exportId });
    expect(res.status).toBe(403);
    expect(await files()).toEqual([]);
  });

  it('puts the XML under the granted name and returns { file }', async () => {
    const res = await run({ id: exportId, $files: { write: { name: 'SAFT_A.xml', maxBytes: 1 << 20 } } });
    expect(res.status).toBe(200);
    const { file } = (await res.json()).result;
    const [row] = await files();
    expect(row).toMatchObject({ id: file, original_name: 'SAFT_A.xml' });
    expect(Number(row.size)).toBe(new TextEncoder().encode(xml).byteLength);
    // The caller's own file: they read it back through the file API.
    const got = await e.engineApp.request(`/api/storage/${file}`, { headers: { cookie: member.cookie } });
    expect(got.status).toBe(200);
  });
});
