// The scan against a REAL engine (`onEngine`): the engine's own `/ext/*` chain
// in front of the packed bundle, and the action route as the engine mounts it.
// What only the real chain can show: `scan` reaches a collection it does not
// declare (`reads: ["*"]`, ADR 0047) only as the caller — it reads the rows and
// columns `GET /api/data` gives this caller — and its scan and issue rows are
// written as the caller, all or nothing.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { onEngine } from '../../../testing/ext-harness';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const C = `qual_${Date.now()}`;

d('analytics/quality — a scan sees what the caller sees', () => {
  let e: Awaited<ReturnType<typeof onEngine>>;
  let member = { cookie: '', userId: '' };
  let reader = { cookie: '', userId: '' };
  let outsider = { cookie: '', userId: '' };

  const run = (action: string, body: unknown, cookie = member.cookie) =>
    e.app.request(`/ext/analytics/quality/actions/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(body),
    });
  const scans = async () => (await e.sql`SELECT * FROM zvd_quality_scans WHERE target_collection = ${C}`.execute(e.db)).rows;
  const issues = async () =>
    (await e.sql`SELECT * FROM zvd_quality_issues WHERE target_collection = ${C} ORDER BY issue_type, field_name`.execute(e.db))
      .rows;

  beforeAll(async () => {
    e = await onEngine(import.meta.dir);
    const { sql, db } = e;
    // `onEngine` records no consent (grandfathered), so `"*"` runs as after an approval.
    const data = (await import(join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src', 'lib', 'data', 'index.js'))) as Any;
    await data.DDLManager.createCollection(db, {
      name: C,
      fields: [
        { name: 'label', type: 'text', required: false, unique: false, indexed: false },
        { name: 'qty', type: 'integer', required: false, unique: false, indexed: false },
        { name: 'secret', type: 'text', required: false, unique: false, indexed: false },
      ],
    });
    for (let i = 0; i < 100; i++) {
      if ((await sql`SELECT to_regclass(${`zvd_${C}`}) AS t`.execute(db)).rows[0].t) break;
      await Bun.sleep(100);
    }
    // 40 distinct labels plus one repeat; qty 10 everywhere but one 9999; secret empty on most rows.
    await sql`INSERT INTO ${sql.table(`zvd_${C}`)} (label, qty, secret)
              SELECT 'Name ' || n, CASE WHEN n = 40 THEN 9999 ELSE 10 + (n % 2) END, CASE WHEN n = 1 THEN 's' END
                FROM generate_series(1, 40) n`.execute(db);
    await sql`INSERT INTO ${sql.table(`zvd_${C}`)} (label, qty) VALUES ('  name 1 ', 10)`.execute(db);
    await sql`INSERT INTO zvd_column_permissions (collection_name, column_name, role, can_read, can_write)
              VALUES (${C}, 'secret', 'member', false, false)`.execute(db);
    const own = (actions: string[]) => [
      { collection: 'quality_scans', actions: ['read', 'create', 'execute'] },
      { collection: 'quality_issues', actions },
      { collection: 'quality_targets', actions: ['read'] },
    ];
    const session = (grants: Any[]) => e.harness.createMemberSession(e.engineApp, db, { grants });
    member = await session([{ collection: C, actions: ['read'] }, ...own(['read', 'create', 'update', 'execute'])]);
    // May read the target and scan, but not dismiss.
    reader = await session([{ collection: C, actions: ['read'] }, ...own(['read', 'create', 'execute'])]);
    outsider = await session(own(['read', 'create', 'execute']));
    await sql`INSERT INTO zvd_quality_targets (target_collection, max_error_issues, max_warning_issues)
              VALUES (${C}, 0, 1)`.execute(db);
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    await e.db.deleteFrom('zvd_column_permissions').where('collection_name', '=', C).execute().catch(() => undefined);
    await e.harness.dropTestCollection(e.db, C).catch(() => undefined);
    await e.done();
  });

  it('a caller who may not read the target gets the data API refusal, and nothing is recorded', async () => {
    const res = await run('scan', { collection: C }, outsider.cookie);
    expect(res.status).toBe(403);
    expect(await scans()).toHaveLength(0);
  });

  it('finds the duplicate and the outlier, and never the column the caller may not read', async () => {
    const res = await run('scan', { collection: C });
    expect(res.status).toBe(200);
    const { result } = await res.json();
    expect(result.scan).toMatchObject({
      target_collection: C,
      records_scanned: 41,
      truncated: false,
      skipped_checks: ['normalization: no AI provider installed'],
    });
    const found = await issues();
    expect(found.map((i: Any) => `${i.issue_type}:${i.field_name}`)).toEqual(['duplicate:label', 'outlier:qty']);
    expect(result.issues_found).toBe(2);
    expect(found.every((i: Any) => i.created_by === member.userId)).toBe(true);
  });

  it('the AI check alone, with no provider, is refused rather than recorded as clean', async () => {
    const before = (await scans()).length;
    const res = await run('scan', { collection: C, scan_type: 'normalization' });
    expect(res.status).toBe(422);
    expect((await scans()).length).toBe(before);
  });

  it('checks the open issues against the SLA target', async () => {
    const [scan] = await scans();
    const res = await run('slaStatus', { scan_id: scan.id });
    expect((await res.json()).result).toMatchObject({ compliant: true, error_count: 0, warning_count: 1 });
  });

  it('a caller who may not update issues dismisses none of a scan\'s issues', async () => {
    const [scan] = await scans();
    expect((await run('dismissScan', { scan_id: scan.id }, reader.cookie)).status).toBe(403);
    expect((await issues()).some((i: Any) => i.dismissed)).toBe(false);
    const res = await run('dismissScan', { scan_id: scan.id });
    expect((await res.json()).result).toEqual({ dismissed: 2 });
    expect((await issues()).every((i: Any) => i.dismissed && i.dismissed_at)).toBe(true);
  });
});
