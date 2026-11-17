/**
 * The data subject's own rights, for the signed-in user:
 *
 * GET /export-my-data — Art. 15: what the engine's own tables hold about them,
 * read through the engine (`auth:users`), which no action can reach, so it stays
 * a route; and the consents and requests they gave or submitted, read as them
 * through the data API (`ctx.host(c)`, ADR 0025). It decides nothing about who
 * may do what: the subject is the session's user, and the engine's rules on the
 * collections apply.
 *
 * Art. 17 erasure is the engine's (ADR 0046): the subject records the request
 * with the `submitRequest` action (`request_type: "erasure"`), then erases their
 * own account with `DELETE /api/me`, re-authenticated there, passing the
 * request's id as `erasure_id` — the engine's `user.deleted` row carries it.
 */

import { Hono } from 'hono';
import type { ExtensionContext } from '@zveltio/sdk/extension';

/** The data API's page ceiling. */
const PAGE = 500;

export function selfServiceRoutes(ctx: ExtensionContext): Hono {
  const { auth } = ctx;

  /**
   * Every row of `collection` that `userId` created, read as the caller, page by
   * page; `null` when the caller may not read the collection at all, so the
   * rest of the export still reaches them.
   */
  async function own(c: unknown, collection: string, userId: string): Promise<Record<string, unknown>[] | null> {
    const { collections } = ctx.host(c);
    const rows: Record<string, unknown>[] = [];
    for (let page = 1; ; page++) {
      let records: Record<string, unknown>[];
      try {
        ({ records } = (await collections.list(collection, {
          page,
          limit: PAGE,
          sort: 'id',
          count: 'none',
          filter: { created_by: { eq: userId } },
        })) as { records: Record<string, unknown>[] });
      } catch (err) {
        // The data API's refusal, before any SQL ran: the request's transaction is intact.
        if ((err as { status?: unknown }).status === 403) return null;
        throw err;
      }
      rows.push(...records);
      if (records.length < PAGE) return rows;
    }
  }

  async function sessionUser(c: any) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    return session?.user ?? null;
  }

  const app = new Hono();

  app.get('/export-my-data', async (c) => {
    const user = await sessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // The engine reads every tenant's rows about the subject, and the
    // instance-level ones (sign-ins). This extension's records are the request
    // tenant's, filtered on their author: a DPO's export is their own too.
    const engineData = await ctx.internals.exportUserData(user.id);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: engineData?.profile ?? null,
      audit_log: engineData?.audit_log ?? [],
      notifications: engineData?.notifications ?? [],
      api_keys: engineData?.api_keys ?? [],
      approval_requests: engineData?.approval_requests ?? [],
      consents: await own(c, 'gdpr_consent_records', user.id),
      subject_requests: await own(c, 'gdpr_subject_requests', user.id),
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="my-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  });

  return app;
}
