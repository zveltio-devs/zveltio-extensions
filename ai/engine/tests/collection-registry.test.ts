// What this extension reads of the engine's metadata, read the way the engine
// now allows: the collection registry through `ctx.DDLManager`, user names
// through `ctx.internals.getUserNames`.
//
// Engine #870 refuses a builder read of `zvd_collections` on `ctx.db`, and #858
// refuses `"user"`. Before this change the assistant's collection tools threw,
// the embed hook threw on every write (so nothing was ever embedded), and the
// top-users panel fell back to an empty list.
import { describe, expect, it } from 'bun:test';
import { join } from 'node:path';
import { mountForTest } from '../../../testing/ext-harness';
import { ZveltioAIEngine } from '../lib/zveltio-ai/engine';
import { triggerEmbedding } from '../lib/ai-embed-hook';

const d = process.env.TEST_DATABASE_URL && process.env.BETTER_AUTH_SECRET ? describe : describe.skip;
const ENGINE = join(import.meta.dir, '..');
const HARNESS_USER = '00000000-0000-4000-8000-00000000e001';

d('ai: the collection registry and user names, through the host', () => {
  it('the assistant lists collections and reports their count', async () => {
    const { ctx } = await mountForTest(ENGINE);
    const ai = new ZveltioAIEngine(ctx) as any;
    const known = (await ctx.DDLManager.getCollections(ctx.db)).length;

    const listed = await ai.toolListCollections();
    expect(listed.success).toBe(true);
    expect(listed.collections.length).toBe(known);

    const stats = await ai.toolGetSystemStats();
    expect(stats.stats.collections).toBe(known);

    await expect(ai.toolGetCollectionSchema({ collection: `nope_${Date.now()}` })).rejects.toThrow(
      /not found/,
    );
  });

  it('the embed hook reads a collection’s AI-search settings', async () => {
    const { ctx } = await mountForTest(ENGINE);
    // A collection with no AI search: the hook returns, rather than throwing.
    await expect(
      triggerEmbedding(ctx.DDLManager, ctx.db, `nope_${Date.now()}`, 'r1', { title: 'x' }),
    ).resolves.toBeUndefined();
  });

  it('top users carry their names', async () => {
    const { app, ctx } = await mountForTest(ENGINE);
    const model = `top-users-${Date.now()}`;
    await ctx.db
      .insertInto('zv_ai_usage')
      .values({
        provider: 'test',
        model,
        operation: 'chat',
        prompt_tokens: 1_000_000,
        response_tokens: 1,
        user_id: HARNESS_USER,
      })
      .execute();
    try {
      const res = await app.request('/analytics/top-users?range=1d&limit=50');
      expect(res.status).toBe(200);
      const { users } = (await res.json()) as { users: Array<{ user_id: string; user_name: string }> };
      expect(users.find((u) => u.user_id === HARNESS_USER)?.user_name).toBe('Ext Harness');
    } finally {
      await ctx.db.deleteFrom('zv_ai_usage').where('model', '=', model).execute();
    }
  });
});
