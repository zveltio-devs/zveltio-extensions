/**
 * The data subject's own rights, for the signed-in user:
 *
 * GET /export-my-data — Art. 15: what the engine's own tables hold about them,
 * read through the engine (`auth:users`), which no action can reach, so it stays
 * a route. It decides nothing about who may do what: the subject is the
 * session's user.
 *
 * Art. 17 erasure is the engine's (ADR 0046): the subject records the request
 * with the `submitRequest` action (`request_type: "erasure"`), then erases their
 * own account with `DELETE /api/me`, re-authenticated there, passing the
 * request's id as `erasure_id` — the engine's `user.deleted` row carries it.
 */

import { Hono } from 'hono';
import type { ExtensionContext } from '@zveltio/sdk/extension';

export function selfServiceRoutes(ctx: ExtensionContext): Hono {
  const { auth } = ctx;

  async function sessionUser(c: any) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    return session?.user ?? null;
  }

  const app = new Hono();

  app.get('/export-my-data', async (c) => {
    const user = await sessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    // The engine reads every tenant's rows about the subject, and the
    // instance-level ones (sign-ins). The subject's consent records are a
    // collection the engine serves: `GET /api/data/gdpr_consent_records` with
    // `created_by[eq]=<their id>`, as the rules on it allow.
    const engineData = await ctx.internals.exportUserData(user.id);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: engineData?.profile ?? null,
      audit_log: engineData?.audit_log ?? [],
      notifications: engineData?.notifications ?? [],
      api_keys: engineData?.api_keys ?? [],
      approval_requests: engineData?.approval_requests ?? [],
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
