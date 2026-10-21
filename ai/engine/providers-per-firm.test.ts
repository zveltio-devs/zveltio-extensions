// Each firm's AI calls go to that firm's own provider account.
//
// `zv_ai_providers` is unique per (tenant_id, name) since migration 005, but the
// providers were held in ONE process-wide map keyed by name, filled at boot from
// every firm's rows, with one default for the whole instance. Two firms that both
// configured `openai` shared whichever key loaded last: one firm's prompts and
// data went to the other's account, on the other's bill, and a firm with no
// provider at all used someone else's.
//
// The provider here is a local OpenAI-compatible server that answers every
// completion with the bearer token it was sent, so a reply names the key used.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { godAcrossFirms, mountForTest } from '../../testing/ext-harness';

const A = '00000000-0000-4000-8000-0000000a2aaa';
const B = '00000000-0000-4000-8000-0000000a2aab';
const C = '00000000-0000-4000-8000-0000000a2aac'; // configures nothing
const GOD = '00000000-0000-4000-8000-00000000e001';

describe.skipIf(!process.env.TEST_DATABASE_URL)('ai: a firm’s AI calls use its own providers', () => {
  let h: Awaited<ReturnType<typeof godAcrossFirms>>;
  let server: ReturnType<typeof Bun.serve>;

  const chat = async (tenant: string, body: Record<string, unknown> = {}) => {
    const res = await (await h.asGod(tenant)).request('/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], ...body }),
    });
    return { status: res.status, content: res.status === 200 ? (await res.json()).result.content : null };
  };

  beforeAll(async () => {
    server = Bun.serve({
      port: 0,
      fetch: (req) =>
        Response.json({
          model: 'echo',
          choices: [{ message: { content: req.headers.get('authorization') } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
    });
    const url = `http://127.0.0.1:${server.port}/v1`;
    h = await godAcrossFirms(import.meta.dir, [A, B, C]);
    // Plaintext keys: `decryptApiKey` passes a value without an envelope through.
    await h.pool.query(
      `INSERT INTO zv_ai_providers (tenant_id, name, label, api_key, base_url, is_default, is_active) VALUES
         ($1, 'openai', 'A', 'sk-A', $3, true, true),
         ($2, 'openai', 'B', 'sk-B', $3, false, true),
         ($2, 'acme', 'B', 'sk-B-acme', $3, true, true)`,
      [A, B, url],
    );
  });

  afterAll(async () => {
    server?.stop(true);
    await h.pool.query(`DELETE FROM zv_ai_providers WHERE tenant_id = ANY($1)`, [[A, B, C]]).catch(() => undefined);
    await h.done();
  });

  it('the default provider is the own firm’s', async () => {
    expect(await chat(A)).toEqual({ status: 200, content: 'Bearer sk-A' });
    expect(await chat(B)).toEqual({ status: 200, content: 'Bearer sk-B-acme' });
  });

  it('a provider named by the caller is the own firm’s, never another’s of that name', async () => {
    expect(await chat(B, { provider: 'openai' })).toEqual({ status: 200, content: 'Bearer sk-B' });
    expect(await chat(A, { provider: 'openai' })).toEqual({ status: 200, content: 'Bearer sk-A' });
    expect((await chat(A, { provider: 'acme' })).status).toBe(503);
  });

  it('a firm with no provider is not configured, whoever else is', async () => {
    expect((await chat(C)).status).toBe(503);
  });

  it('another extension calling `ai.providers` gets the firm of the request', async () => {
    for (const [tenant, key] of [[A, 'Bearer sk-A'], [B, 'Bearer sk-B-acme']] as const) {
      const { app, ctx } = await mountForTest(import.meta.dir, { tenant, transaction: true, transactionUser: GOD });
      app.get('/__svc', async (c: any) => {
        const p = ctx.services.get('ai.providers').getDefault();
        return c.json({ content: (await p.chat([{ role: 'user', content: 'hi' }])).content });
      });
      expect(await (await app.request('/__svc')).json()).toEqual({ content: key });
    }
  });

  it('a background task (an `ai_task` flow) uses the firm it runs for', async () => {
    // As the flow scheduler runs it: the firm's domain, no transaction open.
    const { runAsTenantWithoutTransaction } = await import(
      '../../../zveltio/packages/engine/src/lib/tenancy/index.js'
    );
    const { ctx } = await mountForTest(import.meta.dir, { tenant: B });
    const run = ctx.services.get('ai.runBackgroundTask');
    const r = await runAsTenantWithoutTransaction(A, () => run(GOD, 'say hi', { tenantId: A }));
    expect(r.error).toBeUndefined();
    expect(r.response).toBe('Bearer sk-A');
  });

  it('saving a provider changes that firm’s calls at once, and no other firm’s', async () => {
    expect(await chat(A)).toEqual({ status: 200, content: 'Bearer sk-A' });
    const put = await (await h.asGod(A)).request('/providers/openai', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ is_active: false }),
    });
    expect(put.status).toBe(200);
    expect((await chat(A)).status).toBe(503);
    expect(await chat(B, { provider: 'openai' })).toEqual({ status: 200, content: 'Bearer sk-B' });
  });
});
