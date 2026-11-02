/**
 * The data subject's own rights, for the signed-in user:
 *
 * GET    /export-my-data     — Art. 15: what the engine's own tables hold about them
 * DELETE /delete-my-account  — Art. 17: erasure (password re-auth)
 *
 * Both act on the caller's own account through the engine (`auth:users`), which
 * no action can reach, so they stay routes. Neither decides who may do what:
 * the subject is the session's user.
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

  app.delete('/delete-my-account', async (c) => {
    const user = await sessionUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json().catch(() => ({}));
    if (body.confirm !== 'DELETE MY ACCOUNT') {
      return c.json({ error: 'Please confirm with: { "confirm": "DELETE MY ACCOUNT" }' }, 400);
    }

    if (!body.password) {
      return c.json({ error: 'Current password required for account deletion. Include "password" in request body.' }, 400);
    }

    try {
      const verifyResult = await auth.api.signInEmail({
        body: { email: user.email, password: body.password },
      });
      if (!verifyResult) throw new Error('Invalid password');
    } catch {
      return c.json({ error: 'Invalid password. Account deletion cancelled.' }, 403);
    }

    const userId = user.id;

    // Erasure under Art. 17 must be complete. The account goes through the host
    // (`deleteUser`), which revokes the sessions (database and cache), drops the
    // grants, stops the API keys the user created and deletes the row —
    // `account`, `twoFactor` and the notifications go with it (ON DELETE
    // CASCADE). This extension's records name the subject only by the engine's
    // `created_by`, which the delete sets to NULL: a consent or a request stays
    // as a record of what happened with no link to the subject. Free text the
    // subject or a handler wrote (a request's `description`, a decision's
    // `notes`) is kept as written; whoever handles the erasure reviews it.
    //
    // The erasure is recorded once it happened (`ctx.internals.audit`): the
    // `user.deleted` row the host writes names it by `erasure_id`, and so does
    // `gdpr.account_deleted`. The subject's id is the resource — the user row is
    // gone by then.
    const erasureId = crypto.randomUUID();
    let deleted = false;
    try {
      await (ctx.db as any).transaction().execute(async (trx: any) => {
        // The actor is the subject, who no longer exists, so the audit row
        // names the erasure instead.
        deleted = await ctx.internals.deleteUser(trx, userId, {
          actor: 'self',
          reason: 'gdpr.erasure',
          metadata: { erasure_id: erasureId },
        });
      });
    } catch (err) {
      // Logged, because an erasure that fails is a legal obligation left
      // unfinished, and whoever has to finish it needs the actual reason.
      console.error(
        '[gdpr] erasure failed for', userId,
        '| cause:', err instanceof Error ? err.message : String(err),
      );
      // The instance owner (god) is refused by the host: the account would go
      // and leave the instance without one. That is a state to change first,
      // not a failure to retry.
      const status = (err as { code?: string })?.code === 'user_protected' ? 409 : 500;
      return c.json({
        error: 'Account deletion failed. The erasure did NOT complete — see the server log for the cause.',
        detail: err instanceof Error ? err.message : String(err),
      }, status);
    }

    // No row to delete: nothing was erased, so nothing is recorded as erased.
    if (!deleted) return c.json({ error: 'Account not found. Nothing was erased.' }, 404);

    // The account is gone whatever happens here; the host's `user.deleted` row
    // already records it. A failed write of this second record is logged.
    await ctx.internals
      .audit({
        type: 'gdpr.account_deleted',
        resourceId: userId,
        resourceType: 'user',
        metadata: { gdpr: true, erasure_id: erasureId, requested_at: new Date().toISOString() },
      })
      .catch((err) => {
        console.error('[gdpr] erasure', erasureId, 'audit write failed:', (err as Error).message);
      });
    return c.json({ success: true, complete: true, message: 'Account and all associated data has been deleted' });
  });

  return app;
}
