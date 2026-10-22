// `ai.providers.getDefault()` is a per-firm stand-in and never null, so a
// consumer cannot tell a firm with no provider by `!provider`: mail's summarize
// and reply-draft, and the engine's ai_decision step, chatted and failed (500)
// instead of answering 503 / falling back. `configured()` says whether the
// caller's firm has one.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms, mountForTest } from '../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000a1c0a';
const B = '00000000-0000-4000-8000-0000000a1c0b';
const GOD = '00000000-0000-4000-8000-00000000e001'; // godAcrossFirms' god

describe.skipIf(!process.env.TEST_DATABASE_URL)('ai: the provider stand-in says whether the firm has one', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;

  beforeAll(async () => {
    h = await godAcrossFirms(import.meta.dir, [A, B]);
    await h.pool.query(
      `INSERT INTO zv_ai_providers (tenant_id, name, label, api_key, base_url, is_default, is_active)
       VALUES ($1, 'openai', 'A', 'sk-A', 'http://127.0.0.1:9/v1', true, true)`,
      [A],
    );
  });

  afterAll(async () => {
    await h.pool.query(`DELETE FROM zv_ai_providers WHERE tenant_id = ANY($1)`, [[A, B]]).catch(() => undefined);
    await h.done();
  });

  it('true for a firm with a provider, false for one without', async () => {
    for (const [tenant, want] of [[A, true], [B, false]] as const) {
      const { app, ctx } = await mountForTest(import.meta.dir, { tenant, transaction: true, transactionUser: GOD });
      app.get('/__configured', async (c: any) => {
        const p = ctx.services.get('ai.providers').getDefault();
        return c.json({ stand_in: p !== null, configured: await p.configured() });
      });
      const res = await app.request('/__configured');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ stand_in: true, configured: want });
    }
  });
});
