import { beforeAll, describe, expect, it } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const ENGINE_DIR = import.meta.dir;

// Two people hired in the same instant read the same `COUNT(*)` before
// either has committed, so both build the same `EMP-00NN`. The unique key
// on (tenant_id, employee_number) catches the clash — but a caught duplicate
// still aborts its OWN transaction (Postgres does not let a request continue
// after a failed statement), so the loser's INSERT raised straight past the
// handler as a raw 500. Fixed by retrying the whole transaction — not just
// the INSERT inside it, which is already dead once it has thrown once — on
// exactly that constraint violation.
describe('hr/employees — concurrent hires do not 500 on a number clash', () => {
  let app: any;
  let ctx: any;

  beforeAll(async () => {
    const mounted = await mountForTest(ENGINE_DIR, { authed: true, admin: true });
    app = mounted.app;
    ctx = mounted.ctx;
    ctx.checkPermission = async () => true;
    // The harness pool is lazy (`max: 4`); on a cold pool the first request
    // pays for opening a connection while the others wait, so they never
    // actually overlap and the race never fires. Warm it first — see
    // finance/invoicing/CONTEXT.md, where exactly this made a concurrency
    // test stay green with its fix reverted.
    await Promise.all([
      app.request('/departments'),
      app.request('/departments'),
      app.request('/departments'),
      app.request('/departments'),
    ]);
  });

  it('five concurrent POST / requests all succeed with distinct numbers', async () => {
    const body = (n: number) =>
      JSON.stringify({
        first_name: 'Race',
        last_name: `Test${n}`,
        email: `race${n}-${Math.floor(Math.random() * 1e9)}@x.test`,
        hire_date: '2026-01-01',
      });

    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        app.request('/', { method: 'POST', headers: { 'content-type': 'application/json' }, body: body(i) }),
      ),
    );
    for (const res of results) expect(res.status).toBe(201);

    const bodies = await Promise.all(results.map((r: Response) => r.json()));
    const numbers = bodies.map((b: any) => b.data.employee_number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});
