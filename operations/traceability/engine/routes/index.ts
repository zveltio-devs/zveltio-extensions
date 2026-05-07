import { Hono } from 'hono';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { lotsRouter } from './lots.js';
import { dispatchesRouter } from './dispatches.js';
import { scanRouter } from './scan.js';
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

  app.use('*', async (c, next) => {
    const session = await ctx.auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
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
