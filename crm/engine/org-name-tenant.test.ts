// An organization found by NAME is the own firm's.
//
// `crm.organizations.findByName` and the name branch of `.lookup` read
// `WHERE name = … LIMIT 1` with no tenant filter. The row policy admits the
// caller's READ REACH, every firm for a god, so a service call made inside a
// god's request in firm A could answer with firm B's organization — whose id
// the caller then links to its own contact.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms, mountForTest } from '../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000c4aaa';
const B = '00000000-0000-4000-8000-0000000c4aab';
const GOD = '00000000-0000-4000-8000-00000000e001'; // godAcrossFirms' god

describe.skipIf(!process.env.TEST_DATABASE_URL)('crm: an organization by name is the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    for (const [id, tag] of [[A, 'A'], [B, 'B']]) {
      await h.pool.query(
        `INSERT INTO zvd_organizations (tenant_id, name, notes, created_by) VALUES ($1, 'Org Shared', $2, 'test')`,
        [id, tag],
      );
    }
  });

  afterAll(async () => {
    await h.pool.query(`DELETE FROM zvd_organizations WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    await h.done();
  });

  // Both firms: which row an unfiltered `LIMIT 1` returns depends on the plan.
  it('a service call in a god’s request answers with the own firm’s organization', async () => {
    for (const [tenant, tag] of [[A, 'A'], [B, 'B']] as const) {
      const { app, ctx } = await mountForTest(import.meta.dir, { tenant, transaction: true, transactionUser: GOD });
      // A route added after register runs behind the same tenant transaction.
      app.get('/__org', async (c: any) => {
        const find = ctx.services.get('crm.organizations.findByName');
        const lookup = ctx.services.get('crm.organizations.lookup');
        return c.json({
          find: (await find('Org Shared'))?.notes,
          lookup: (await lookup('Org Shared'))?.notes,
        });
      });
      const res = await app.request('/__org');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ find: tag, lookup: tag });
    }
  });
});
