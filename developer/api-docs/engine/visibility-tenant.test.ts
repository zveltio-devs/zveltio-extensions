// Whether a firm's API docs are public is read from its OWN row.
//
// `zvd_api_docs_config` is one row per tenant (migration 004), but the reader
// was `selectFrom('zvd_api_docs_config').executeTakeFirst()` — no tenant filter.
// The row policy admits the caller's READ REACH, every firm for a god and the
// descendants for a `subtree` member, so a god in firm B saw firm A's switch.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms } from '../../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000ad0ca';
const B = '00000000-0000-4000-8000-0000000ad0cb';

describe.skipIf(!process.env.TEST_DATABASE_URL)('api-docs: visibility is the own firm’s', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    for (const [id, pub] of [[A, true], [B, false]]) {
      await h.pool.query(
        `INSERT INTO zvd_api_docs_config (tenant_id, is_public) VALUES ($1, $2)
         ON CONFLICT (tenant_id) DO UPDATE SET is_public = EXCLUDED.is_public`,
        [id, pub],
      );
    }
  });

  afterAll(async () => {
    await h.pool.query(`DELETE FROM zvd_api_docs_config WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    await h.done();
  });

  // Both firms: which row an unfiltered read returns depends on the plan, so
  // one firm alone may pass.
  it('a god reads the switch of the firm it works in', async () => {
    for (const [tenant, pub] of [[A, true], [B, false]] as const) {
      const res = await (await h.asGod(tenant)).request('/visibility');
      expect(res.status).toBe(200);
      expect(((await res.json()) as any).is_public).toBe(pub);
    }
  });
});
