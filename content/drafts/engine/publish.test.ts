// Publishing against a REAL engine (`onEngine`): the engine's own `/ext/*` chain
// in front of the packed bundle, and the action route as the engine mounts it.
// What only the real chain can show: the publish actions reach the target
// collection the draft names (`writes: ["*"]`, ADR 0047) only as the caller,
// under the caller's grants, and a refused batch keeps none of its writes.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { onEngine } from '../../../testing/ext-harness';

// biome-ignore lint/suspicious/noExplicitAny: engine modules imported by path
type Any = any;

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;
const C = `pub_${Date.now()}`;

d('content/drafts — publishing as the caller', () => {
  let e: Awaited<ReturnType<typeof onEngine>>;
  let member = { cookie: '', userId: '' };
  let reader = { cookie: '', userId: '' };
  let outsider = { cookie: '', userId: '' };

  const run = (action: string, body: unknown, cookie = member.cookie) =>
    e.app.request(`/ext/content/drafts/actions/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie },
      body: JSON.stringify(body),
    });
  const labels = async () =>
    (await e.sql`SELECT label FROM ${e.sql.table(`zvd_${C}`)} ORDER BY label`.execute(e.db)).rows.map((r: Any) => r.label);
  const draftRow = async (id: string) => (await e.sql`SELECT * FROM zvd_content_drafts WHERE id = ${id}`.execute(e.db)).rows[0];
  async function seedDraft(label: string, data: Record<string, unknown>, extra: Record<string, unknown> = {}): Promise<string> {
    const { sql, db } = e;
    const rec = (await sql`INSERT INTO ${sql.table(`zvd_${C}`)} (label) VALUES (${label}) RETURNING id`.execute(db)).rows[0].id;
    const row = { target_collection: C, record_id: rec, draft_data: JSON.stringify(data), created_by: member.userId, ...extra };
    return (await db.insertInto('zvd_content_drafts').values(row).returning('id').executeTakeFirstOrThrow()).id;
  }

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
    const drafts = { collection: 'content_drafts', actions: ['read', 'update', 'execute'] };
    const session = (grants: Any[]) => e.harness.createMemberSession(e.engineApp, db, { grants });
    member = await session([{ collection: C, actions: ['read', 'update'] }, drafts]);
    // May run the action and read the target, but not update it.
    reader = await session([{ collection: C, actions: ['read'] }, drafts]);
    // No grant on the target at all.
    outsider = await session([drafts]);
  }, 120_000);

  afterAll(async () => {
    if (!e) return;
    await e.db.deleteFrom('zv_revisions').where('collection', '=', C).execute().catch(() => undefined);
    await e.harness.dropTestCollection(e.db, C).catch(() => undefined);
    await e.done();
  });

  it('publishes the draft into its record as the caller, and marks it', async () => {
    const id = await seedDraft('one', { label: 'one-v2', qty: 5, tenant_id: '00000000-0000-0000-0000-00000000dead' });
    const res = await run('publishDraft', { id });
    expect(res.status).toBe(200);
    expect((await res.json()).result).toMatchObject({ draft_id: id, collection: C });
    expect(await labels()).toEqual(['one-v2']);
    expect((await draftRow(id)).published_at).not.toBeNull();
    const again = await run('publishDraft', { id });
    expect(again.status).toBe(409);
    expect((await again.json()).code).toBe('already_published');
  });

  it('reaches the target only as the caller: no update, or no grant, publishes nothing', async () => {
    const id = await seedDraft('two', { label: 'two-v2' });
    expect((await run('publishDraft', { id }, reader.cookie)).status).toBe(403);
    expect((await run('publishDraft', { id }, outsider.cookie)).status).toBe(403);
    expect(await labels()).toContain('two');
    expect((await draftRow(id)).published_at).toBeNull();
  });

  it('a batch publishes every draft or none', async () => {
    const good = await seedDraft('three', { label: 'three-v2' });
    const bad = await seedDraft('four', { qty: 'many' });
    const res = await run('bulkPublish', { draft_ids: [good, bad] });
    expect(res.status).toBe(422);
    expect(await labels()).toContain('three');
    expect(await labels()).not.toContain('three-v2');
    expect((await draftRow(good)).published_at).toBeNull();
    const ok = await run('bulkPublish', { draft_ids: [good] });
    expect((await ok.json()).result.published.map((p: Any) => p.draft_id)).toEqual([good]);
    expect(await labels()).toContain('three-v2');
  });

  it('the schedule publishes only approved drafts, and only what was approved', async () => {
    const past = new Date(Date.now() - 60_000);
    const approvedFor = await seedDraft('five', {});
    const target = (await draftRow(approvedFor)).record_id;
    // Approved for record `five`, then pointed at record `eight` and edited.
    const eight = await seedDraft('eight', {});
    const due = await seedDraft('decoy', { label: 'five-edited-after' }, {
      record_id: (await draftRow(eight)).record_id,
      scheduled_at: past,
      review_status: 'approved',
      approved_data: JSON.stringify({ target_collection: C, record_id: target, data: { label: 'five-approved' } }),
    });
    const unreviewed = await seedDraft('six', { label: 'six-v2' }, { scheduled_at: past });
    const later = await seedDraft('seven', { label: 'seven-v2' }, {
      scheduled_at: new Date(Date.now() + 3_600_000),
      review_status: 'approved',
      approved_data: JSON.stringify({ data: { label: 'seven-v2' } }),
    });
    // Due first, approved for a record deleted since: skipped, not a stall.
    const gone = await seedDraft('gone', {}, {
      scheduled_at: new Date(Date.now() - 120_000),
      review_status: 'approved',
      approved_data: JSON.stringify({ target_collection: C, record_id: crypto.randomUUID(), data: { label: 'x' } }),
    });
    const res = await run('publishDue', {});
    expect(res.status).toBe(200);
    const { result } = await res.json();
    expect(result.published.map((p: Any) => p.draft_id)).toEqual([due]);
    expect(result.skipped).toMatchObject([{ draft_id: gone, status: 404 }]);
    expect((await draftRow(gone)).published_at).toBeNull();
    expect((await draftRow(due)).published_at).not.toBeNull();
    expect(await labels()).toEqual(expect.arrayContaining(['five-approved', 'six', 'seven', 'eight', 'decoy', 'gone']));
    expect((await draftRow(unreviewed)).published_at).toBeNull();
    expect((await draftRow(later)).published_at).toBeNull();
  });
});
