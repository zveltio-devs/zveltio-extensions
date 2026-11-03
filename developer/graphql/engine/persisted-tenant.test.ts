// A persisted query is run by name WITHIN the own firm.
//
// `zvd_graphql_queries.name` is unique per tenant, but
// `/persisted/:name/execute` read `WHERE name = …` and took the first row. The
// row policy admits the caller's READ REACH, every firm for a god, so a god in
// firm A could run firm B's query text under firm B's access rules.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../../testing/ext-harness';
import { applyOwnCollections, dropOwnCollections } from './test-utils';

const A = '00000000-0000-4000-8000-0000000a9aaa';
const B = '00000000-0000-4000-8000-0000000a9aab';

describe.skipIf(!process.env.TEST_DATABASE_URL)('graphql: persisted queries are the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    await applyOwnCollections();
    for (const [id, alias] of [[A, 'firmA'], [B, 'firmB']]) {
      await h.pool.query(
        `INSERT INTO zvd_graphql_queries (tenant_id, name, query) VALUES ($1, 'pq_shared', $2)`,
        [id, `query { ${alias}: __typename }`],
      );
    }
  });

  afterAll(async () => {
    await dropOwnCollections();
    await h.done();
  });

  // Both firms: which row an unfiltered read returns first depends on the plan.
  it('a god runs the persisted query of the firm it works in', async () => {
    for (const [tenant, alias] of [[A, 'firmA'], [B, 'firmB']] as const) {
      const res = await (await h.asGod(tenant)).request('/persisted/pq_shared/execute', { method: 'POST' });
      expect(res.status).toBe(200);
      expect(Object.keys(((await res.json()) as any).data ?? {})).toEqual([alias]);
    }
  });
});
