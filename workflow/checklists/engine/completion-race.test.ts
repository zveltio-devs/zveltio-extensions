/**
 * `PATCH /items/:itemId` auto-completes a checklist when its last required
 * item is ticked: read every item on the checklist, decide
 * `allRequiredChecked` in JavaScript, then write `completed_at` if so. Two
 * operators ticking two DIFFERENT required items of the same checklist at the
 * same moment each ran that read before the other's write had committed, so
 * each saw the sibling item as still unchecked and concluded "not complete" —
 * the checklist was left in progress forever, even though every required item
 * ended up checked. Measured before the fix, two required items ticked
 * concurrently through this exact route:
 *
 *     item A: checked = true (committed)
 *     item B: checked = true (committed)
 *     zv_checklists.completed_at: NULL
 *
 * `zv_checklists` is now locked FOR UPDATE before the decision, so the second
 * tick blocks behind the first and re-reads a state that includes it.
 *
 * The seeded checklist deliberately carries NO scoring scheme. `scoreChecklist`
 * still runs unconditionally after every tick, and returns early when there is
 * no scheme — before touching `zv_checklist_scores`. That matters here because
 * this test goes through `mountForTest`'s mock `ctx.db`, whose `.transaction()`
 * does not join AsyncLocalStorage the way the real `ctx.db` does in production
 * (`routes.ts:11-14`'s "there is one spelling" comment is true only because of
 * that join — see `extension-context.ts`). A checklist WITH a scheme would make
 * `scoreChecklist`'s final write open a second real connection, which then
 * self-deadlocks against the FOR UPDATE lock this test is about: a harness
 * artifact, confirmed absent in production separately (two concurrent psql
 * sessions replaying the single-connection-per-request shape the engine
 * actually uses commit cleanly, no deadlock, score included).
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;

describe.skipIf(!DB_URL)('workflow/checklists: concurrent required-item ticks', () => {
  let app: any;
  let sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<{ rows: any[] }>;

  beforeAll(async () => {
    const mounted = await mountForTest(import.meta.dir, { authed: true, admin: true });
    app = mounted.app;
    const { sql: kyselySql } = (await import('kysely')) as any;
    sql = (strings, ...values) => kyselySql(strings, ...values).execute(mounted.ctx.db);

    // Warm the harness's lazy pool (max: 4) before any concurrency assertion —
    // per campaign note, a cold pool serializes the first requests and hides
    // races.
    await Promise.all(Array.from({ length: 4 }, () => app.request('/templates')));
  });

  /** A checklist with two required items and no scoring scheme. */
  const seedChecklist = async (): Promise<{ checklistId: string; itemXId: string; itemYId: string }> => {
    await sql`DELETE FROM zv_checklists WHERE name = 'RACE-CL'`;
    await sql`DELETE FROM zv_checklist_templates WHERE name = 'RACE-TPL'`;
    const tpl = await sql<{ id: string }>`INSERT INTO zv_checklist_templates (name) VALUES ('RACE-TPL') RETURNING id`;
    const templateId = (tpl.rows[0] as any).id;
    const cl = await sql<{ id: string }>`
      INSERT INTO zv_checklists (template_id, collection, record_id, name, created_by)
      VALUES (${templateId}::uuid, 'sites', gen_random_uuid(), 'RACE-CL', 'race-probe')
      RETURNING id
    `;
    const checklistId = (cl.rows[0] as any).id;
    const itemX = await sql<{ id: string }>`
      INSERT INTO zv_checklist_items (checklist_id, label, required) VALUES (${checklistId}::uuid, 'Req X', true) RETURNING id
    `;
    const itemY = await sql<{ id: string }>`
      INSERT INTO zv_checklist_items (checklist_id, label, required) VALUES (${checklistId}::uuid, 'Req Y', true) RETURNING id
    `;
    return { checklistId, itemXId: (itemX.rows[0] as any).id, itemYId: (itemY.rows[0] as any).id };
  };

  it('both required items land, and the checklist completes — no lost decision', async () => {
    const { checklistId, itemXId, itemYId } = await seedChecklist();

    const patch = (id: string) =>
      app.request(`/items/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ checked: true }),
      });

    const [r1, r2] = await Promise.all([patch(itemXId), patch(itemYId)]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);

    const items = await sql<{ checked: boolean }>`SELECT checked FROM zv_checklist_items WHERE checklist_id = ${checklistId}::uuid`;
    expect((items.rows as any[]).every((i) => i.checked)).toBe(true);

    const cl = await sql<{ completed_at: string | null }>`SELECT completed_at FROM zv_checklists WHERE id = ${checklistId}::uuid`;
    // Before the FOR UPDATE lock: both items land checked, and this stayed
    // NULL forever — neither tick's read saw the other's write.
    expect((cl.rows[0] as any).completed_at).not.toBeNull();
  }, 30_000);
});
