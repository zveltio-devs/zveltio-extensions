/**
 * Zveltio AI Agent Routes
 *
 * POST   /ext/ai/zveltio/chat                  — send a natural-language request
 * GET    /ext/ai/zveltio/conversations/:id      — get conversation history
 * DELETE /ext/ai/zveltio/conversations/:id      — clear a conversation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { ZveltioAIEngine } from '../lib/zveltio-ai/engine.js';

export function zveltioAIRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();
  const engine = new ZveltioAIEngine(ctx);

  async function getUser(c: any) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    return session?.user ?? null;
  }

  // POST /chat — process natural-language request
  app.post(
    '/chat',
    zValidator(
      'json',
      z.object({
        message: z.string().min(1).max(8000),
        conversation_id: z.string().optional(),
        context: z.record(z.string(), z.any()).optional(),
      }),
    ),
    async (c) => {
      const user = await getUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');

      const response = await engine.processRequest({
        message: body.message,
        userId: user.id,
        conversationId: body.conversation_id,
        context: body.context,
      });

      return c.json(response);
    },
  );

  // GET /conversations/:id — get conversation history
  app.get('/conversations/:id', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const conversationId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');

    const messages = await db
      .selectFrom('zv_ai_messages')
      .selectAll()
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', user.id)
      .orderBy('created_at', 'asc')
      .limit(Math.min(limit, 200))
      .execute()
      .catch(() => []);

    return c.json({ conversation_id: conversationId, messages });
  });

  // GET /conversations — list user's conversations
  app.get('/conversations', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // Listed from `zv_ai_conversations`, the table that exists to answer this.
    //
    // This aggregated `zv_ai_messages` with `db.fn.max(...)`, and `db` here is
    // the host's restricted proxy, which exposes no `fn` — so the route threw
    // `db.fn.max is not a function` and answered 500 to everyone who reached
    // it. Nobody noticed because an unrelated admin gate, mounted at `/` by a
    // sibling router, had been refusing the whole extension to non-admins; the
    // few admins who got through hit the 500.
    //
    // Grouping messages was also the wrong shape: it filtered on
    // `zv_ai_messages.user_id`, which is nullable because assistant turns have
    // no user, so a conversation would be ranked by the timestamp of the user's
    // own messages only. The conversation row owns `user_id` (NOT NULL) and
    // `updated_at`, which `saveConversation` bumps on every exchange.
    const conversations = await db
      .selectFrom('zv_ai_conversations')
      .select(['id as conversation_id', 'title', 'updated_at as last_message_at'])
      .where('user_id', '=', user.id)
      .orderBy('updated_at', 'desc')
      .limit(20)
      .execute()
      .catch(() => []);

    return c.json({ conversations });
  });

  // DELETE /conversations/:id — clear conversation history
  app.delete('/conversations/:id', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const conversationId = c.req.param('id');

    await db
      .deleteFrom('zv_ai_messages')
      .where('conversation_id', '=', conversationId)
      .where('user_id', '=', user.id)
      .execute()
      .catch(() => {});

    return c.json({ success: true });
  });

  return app;
}
