// A completion is recorded in `zv_ai_usage` when the request runs in a tenant
// transaction, which is how every production request runs.
//
// `logUsage` opened its own `SAVEPOINT` there, and `ctx.db` refuses one from an
// extension (engine #858). The refusal was caught and logged as "usage
// accounting failed", so every chat answered 200 and nothing was ever counted:
// usage analytics read zero on an instance answering every request.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { mountForTest } from '../../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;

d('ai: usage accounting inside the request transaction', () => {
  // A stand-in for a self-hosted Ollama: the provider this extension lets an
  // operator point at localhost.
  let ollama: ReturnType<typeof Bun.serve>;
  const model = `usage-probe-${Date.now()}`;

  beforeAll(() => {
    ollama = Bun.serve({
      port: 0,
      fetch: () =>
        Response.json({
          model,
          message: { role: 'assistant', content: 'hi' },
          prompt_eval_count: 7,
          eval_count: 3,
        }),
    });
  });
  afterAll(() => ollama?.stop(true));

  it('records the completion', async () => {
    // Every request in the tenant transaction, as a production request runs.
    const { app, ctx } = await mountForTest(join(import.meta.dir, '..'), { transaction: true });
    const put = await app.request('/providers/ollama', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        base_url: `http://127.0.0.1:${ollama.port}`,
        default_model: model,
        is_default: true,
        is_active: true,
      }),
    });
    expect(put.status).toBe(200);

    const chat = await app.request('/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'ollama', messages: [{ role: 'user', content: 'hello' }] }),
    });
    expect(chat.status).toBe(200);

    const counted = await ctx.db
      .selectFrom('zv_ai_usage')
      .select(['prompt_tokens', 'response_tokens'])
      .where('model', '=', model)
      .execute();
    expect(counted).toEqual([{ prompt_tokens: 7, response_tokens: 3 }]);

    await ctx.db.deleteFrom('zv_ai_usage').where('model', '=', model).execute();
    await ctx.db.deleteFrom('zv_ai_providers').where('name', '=', 'ollama').execute();
  });
});
