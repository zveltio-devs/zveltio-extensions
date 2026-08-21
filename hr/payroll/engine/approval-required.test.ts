// A payroll period cannot be paid without having been approved.
//
// The lifecycle is open → calculated → approved → closed, and until now the
// middle step was decorative: `approve` wrote `approved_by`/`approved_at` while
// setting `status = 'calculated' WHERE status = 'calculated'`, because
// 'approved' was not in the CHECK domain and there was nothing to move to.
// `pay` then required only `status = 'calculated'` — true both before and after
// approval — so calculate → pay went straight through and money left the
// company without the approval `mayDecidePayroll(ctx, user, 'approve')` exists
// to demand.
//
// The permission gate was never the weak part. Two different decisions shared
// one state, so the second could not tell whether the first had happened. This
// pins the state machine, not the gate.
import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { mountForTest } from '../../../testing/ext-harness';

const DB_URL = process.env.TEST_DATABASE_URL;
const d = DB_URL ? describe : describe.skip;

d('hr/payroll — pay requires an approval that actually happened', () => {
  let app: any;
  let pool: any;

  beforeAll(async () => {
    app = (await mountForTest(import.meta.dir)).app;
    const pg: any = await import('pg');
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
  });

  afterAll(async () => {
    await pool?.end().catch(() => undefined);
  });

  // (year, month) is UNIQUE, so each period needs its own slot. Columns counted
  // against information_schema rather than guessed — a first draft invented
  // `name`/`period_start` and failed at parse time.
  // The year base is randomised per run: (year, month) is UNIQUE, and a rerun
  // against a database that still holds the previous run's rows would collide
  // and fail for a reason that has nothing to do with what is under test.
  const yearBase = 3000 + Math.floor(Math.random() * 900);
  let slot = 0;
  const newPeriod = async (status: string): Promise<string> => {
    slot += 1;
    const r = await pool.query(
      `INSERT INTO zvd_payroll_periods (year, month, status, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [yearBase + slot, ((slot - 1) % 12) + 1, status, '00000000-0000-4000-8000-00000000e001'],
    );
    return r.rows[0].id;
  };

  const statusOf = async (id: string): Promise<string> => {
    const r = await pool.query(`SELECT status FROM zvd_payroll_periods WHERE id = $1`, [id]);
    return r.rows[0]?.status;
  };

  it("'approved' is a state the schema accepts", async () => {
    // The migration had to widen the CHECK; without this the transition below
    // fails at the database and the test would pass for the wrong reason.
    expect(await statusOf(await newPeriod('approved'))).toBe('approved');
  });

  it('paying a merely calculated period is refused', async () => {
    const id = await newPeriod('calculated');
    expect((await app.request(`/periods/${id}/pay`, { method: 'POST' })).status).toBe(400);
    // And nothing moved. A 400 with the row already closed would be worse than
    // no check at all.
    expect(await statusOf(id)).toBe('calculated');
    const paid = await pool.query(`SELECT paid_at FROM zvd_payroll_periods WHERE id = $1`, [id]);
    expect(paid.rows[0].paid_at).toBeNull();
  });

  it('approve moves the period out of calculated, which is what makes pay possible', async () => {
    const id = await newPeriod('calculated');
    expect((await app.request(`/periods/${id}/approve`, { method: 'POST' })).status).toBe(200);
    // The assertion the old code could not pass: it wrote 'calculated' here.
    expect(await statusOf(id)).toBe('approved');
  });

  it('an approved period pays', async () => {
    const id = await newPeriod('approved');
    expect((await app.request(`/periods/${id}/pay`, { method: 'POST' })).status).toBe(200);
    expect(await statusOf(id)).toBe('closed');
  });

  it('a period cannot be paid twice', async () => {
    const id = await newPeriod('approved');
    expect((await app.request(`/periods/${id}/pay`, { method: 'POST' })).status).toBe(200);
    expect((await app.request(`/periods/${id}/pay`, { method: 'POST' })).status).toBe(400);
  });
});
