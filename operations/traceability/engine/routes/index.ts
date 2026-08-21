import { Hono } from 'hono';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { lotsRouter } from './lots.js';
import { dispatchesRouter } from './dispatches.js';
import { scanRouter } from './scan.js';
import { scanAppRouter } from './scan-app.js';
import { productionRouter } from './production.js';
import { traceRouter } from './trace.js';
import { recallsRouter } from './recalls.js';
import { labelsRouter } from './labels.js';
import { reportsRouter } from './reports.js';
import { suppliersRouter } from './suppliers.js';
import { itemsRouter } from './items.js';
import { locationsRouter } from './locations.js';

export function traceRoutes(ctx: ExtensionContext): Hono {
  const app = new Hono();

  // Floor PWA before auth gate — HTML loads, then JS redirects to /admin/login.
  app.route('/app', scanAppRouter());

  /**
   * Authentication for everything, authorization for anything that writes.
   *
   * This router checked only that a session existed. Across 55 routes that
   * meant every authenticated user in the tenant could create, alter and delete
   * lots, movements, dispatches and recalls — the records a traceability system
   * exists to make trustworthy. RLS confined the damage to one tenant; inside
   * it, there was no authorization at all.
   *
   * The gate is deliberately asymmetric, and the asymmetry is the decision:
   *
   *   - Reads stay open to any member of the tenant. Shop-floor staff scan and
   *     look things up; requiring a grant for that would break every existing
   *     deployment on upgrade, and an operator who hits a wall of 403s turns
   *     the control off rather than writing policy.
   *
   *   - Writes require `traceability` / `write`. Admins already match through
   *     the seeded `p, admin, *, *, *` rule, so an upgrade keeps working for
   *     them; anyone else needs an explicit grant. The extension's tables are
   *     `trace_*`, not `zvd_*`, so the seeded `member → zvd_* read` policy
   *     never covered them and no existing grant is silently widened here.
   *
   * Read exposure inside a tenant is a real remaining gap, not an oversight —
   * closing it belongs with a per-collection permission model, not with a
   * blanket deny that operators will disable.
   */
  app.use('*', async (c, next) => {
    const session = await ctx.auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);

    const method = c.req.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const allowed = await ctx.checkPermission(session.user.id, 'traceability', 'write');
      if (!allowed) {
        return c.json(
          {
            error:
              'Writing traceability records requires the "traceability" write permission. ' +
              'Grant it to the role that needs it.',
          },
          403,
        );
      }
    }

    await next();
  });

  app.get('/me', (c) => {
    const user = c.get('user') as any;
    return c.json({ id: user.id, name: user.name, email: user.email });
  });

  app.route('/suppliers', suppliersRouter(ctx));
  app.route('/items', itemsRouter(ctx));
  app.route('/locations', locationsRouter(ctx));
  app.route('/lots', lotsRouter(ctx));
  app.route('/scan', scanRouter(ctx));
  app.route('/production', productionRouter(ctx));
  app.route('/tree', traceRouter(ctx));
  app.route('/recalls', recallsRouter(ctx));
  app.route('/labels', labelsRouter(ctx));
  app.route('/reports', reportsRouter(ctx));
  app.route('/dispatches', dispatchesRouter(ctx));

  return app;
}
