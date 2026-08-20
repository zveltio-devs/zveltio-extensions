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

  /**
   * Ownership lives on `zv_ai_conversations.user_id`, which is NOT NULL.
   *
   * Both routes below used to scope by `zv_ai_messages.user_id` instead. That
   * column is nullable *by design* — `saveConversation` writes the assistant's
   * turn with no user, because a model reply has no user — so the filter
   * silently dropped every answer: reading a conversation returned only the
   * questions, and clearing one deleted only the questions.
   *
   * `getConversationHistory` in lib/zveltio-ai/engine.ts already documented this
   * exact trap and already did it correctly. These two routes are the copy that
   * did not get the fix. Returns null when the conversation does not exist OR is
   * not the caller's — an unowned id must be indistinguishable from an unknown
   * one, or this becomes an existence oracle for other users' conversations.
   *
   * A failed lookup is NOT caught here: "the query broke" must not be reported
   * as "not yours". It surfaces as a 500, which is the truth.
   */
  async function ownedConversation(conversationId: string, userId: string) {
    const row = await db
      .selectFrom('zv_ai_conversations')
      .select(['id'])
      .where('id', '=', conversationId)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return row ?? null;
  }

  // GET /conversations/:id — get conversation history
  app.get('/conversations/:id', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const conversationId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '50');

    if (!(await ownedConversation(conversationId, user.id))) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    const messages = await db
      .selectFrom('zv_ai_messages')
      .selectAll()
      .where('conversation_id', '=', conversationId)
      .orderBy('created_at', 'asc')
      .limit(Math.min(limit, 200))
      .execute()
      .catch((err: Error) => {
        console.error('[ai.conversations] history query failed:', err.message);
        return [];
      });

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
      .execute();
      // No `.catch(() => [])`. An empty list is the user being told they have no
      // conversations, which is a statement about their history rather than about
      // this read — and it is indistinguishable from a new account.

    return c.json({ conversations });
  });

  // DELETE /conversations/:id — clear conversation history
  app.delete('/conversations/:id', async (c) => {
    const user = await getUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const conversationId = c.req.param('id');

    if (!(await ownedConversation(conversationId, user.id))) {
      return c.json({ error: 'Conversation not found' }, 404);
    }

    // The conversation row goes too. Deleting only the messages left the thread
    // listed by `GET /conversations` forever, empty — so "clear" reported
    // success and the conversation was still there. `zv_ai_messages` cascades
    // from `zv_ai_conversations`, so this removes both.
    //
    // Not swallowed: a delete that fails must not answer `{success:true}`.
    try {
      await db.deleteFrom('zv_ai_conversations').where('id', '=', conversationId).execute();
    } catch (err) {
      console.error('[ai.conversations] delete failed:', (err as Error).message);
      return c.json({ error: 'Could not delete the conversation' }, 500);
    }

    return c.json({ success: true });
  });

  return app;
}
