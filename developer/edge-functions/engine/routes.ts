import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { toJsonb } from '@zveltio/sdk/extension';
/**
 * Returns the authenticated user if they have admin permission, or null.
 * Edge function CRUD (create/read/update/delete code) requires admin rights —
 * any authenticated non-admin user creating edge functions could execute
 * arbitrary code in the engine sandbox.
 */

const DEFAULT_CODE = `// Edge function — runs inside the Zveltio engine
// Available: fetch, Request, Response, URL, console, crypto

export default async function handler(ctx) {
  const body = await ctx.request.json().catch(() => ({}));

  return Response.json({
    message: "Hello from edge!",
    input: body,
    env: ctx.env,
  });
}
`;

export function edgeFunctionsRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  const { runEdgeFunction: runFunction } = ctx.internals;

  async function requireAdmin(c: any) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return null;
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    return isAdmin ? session.user : null;
  }

  const app = new Hono();

  // ─── Admin CRUD ────────────────────────────────────────────────

  app.get('/', async (c) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const fns = await db
      .selectFrom('zv_edge_functions')
      .select(['id', 'name', 'display_name', 'description', 'http_method', 'path', 'is_active', 'runtime', 'created_at'])
      .orderBy('name', 'asc')
      .execute();

    return c.json({ functions: fns });
  });

  app.get('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const fn = await db
      .selectFrom('zv_edge_functions')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!fn) return c.json({ error: 'Function not found' }, 404);
    return c.json({ function: fn });
  });

  app.post(
    '/',
    zValidator(
      'json',
      z.object({
        name: z.string().regex(/^[a-z0-9-]+$/).min(1),
        display_name: z.string().min(1),
        description: z.string().optional(),
        code: z.string().default(''),
        http_method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ANY']).default('POST'),
        timeout_ms: z.number().int().min(100).max(300000).default(30000),
        env_vars: z.record(z.string(), z.string()).default({}),
      }),
    ),
    async (c) => {
      const user = await requireAdmin(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const path = `/api/fn/${body.name}`;

      const fn = await db
        .insertInto('zv_edge_functions')
        .values({
          name: body.name,
          display_name: body.display_name,
          description: body.description,
          code: body.code || DEFAULT_CODE,
          http_method: body.http_method,
          path,
          timeout_ms: body.timeout_ms,
          env_vars: toJsonb(body.env_vars),
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirst();

      return c.json({ function: fn }, 201);
    },
  );

  app.patch(
    '/:id',
    zValidator('param', z.object({ id: z.string().uuid() })), zValidator(
      'json',
      z.object({
        display_name: z.string().optional(),
        description: z.string().optional(),
        code: z.string().optional(),
        http_method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ANY']).optional(),
        is_active: z.boolean().optional(),
        timeout_ms: z.number().optional(),
        env_vars: z.record(z.string(), z.string()).optional(),
      }),
    ),
    async (c) => {
      const user = await requireAdmin(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const updates: any = { updated_at: new Date() };
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined) {
          updates[k] = k === 'env_vars' ? JSON.stringify(v) : v;
        }
      }

      const fn = await db
        .updateTable('zv_edge_functions')
        .set(updates)
        .where('id', '=', c.req.param('id'))
        .returningAll()
        .executeTakeFirst();

      if (!fn) return c.json({ error: 'Function not found' }, 404);
      return c.json({ function: fn });
    },
  );

  app.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db.deleteFrom('zv_edge_functions').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // GET /:id/logs — invocation history
  app.get('/:id/logs', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const logs = await db
      .selectFrom('zv_edge_function_logs')
      .select(['id', 'status', 'duration_ms', 'error', 'created_at'])
      .where('function_id', '=', c.req.param('id'))
      .orderBy('created_at', 'desc')
      .limit(50)
      .execute();

    return c.json({ logs });
  });

  // POST /:id/invoke — test invoke from Studio
  app.post('/:id/invoke', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const fn = await db
      .selectFrom('zv_edge_functions')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!fn) return c.json({ error: 'Function not found' }, 404);

    const bodyText = await c.req.text();
    const testRequest = new Request(`http://localhost${fn.path}`, {
      method: fn.http_method === 'ANY' ? 'POST' : fn.http_method,
      headers: { 'Content-Type': 'application/json' },
      body: bodyText || '{}',
    });

    const env = typeof fn.env_vars === 'string' ? JSON.parse(fn.env_vars) : fn.env_vars;
    const result = await runFunction(fn.code, testRequest, env, fn.timeout_ms) as any;

    // Log invocation
    await db.insertInto('zv_edge_function_logs').values({
      function_id: fn.id,
      status: result.status,
      duration_ms: result.duration_ms,
      request_body: bodyText,
      response_body: result.body,
      error: result.error || null,
    }).execute().catch(() => {});

    return c.json({ result });
  });

  return app;
}

/**
 * Dynamically mount all active edge functions at their configured paths.
 * Called during extension registration at startup.
 *
 * Auth policy per function:
 *  - Public by default: NO — all functions require a valid session.
 *  - To expose a function as a public endpoint (e.g. webhooks), set
 *    `env_vars.ZVELTIO_PUBLIC = "true"` in the function configuration.
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function mountEdgeFunctions(ctx: ExtensionContext): Promise<void> {
  const { db, auth } = ctx;
  const { runEdgeFunction: runFunction } = ctx.internals;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  let fns: any[];
  try {
    // Boot-time path (mountEdgeFunctions runs at startup) — no request context,
    // so this reads the bare pool across every tenant. That is deliberate and
    // now harmless: this query decides only WHICH PATHS get a route, and the
    // handler re-resolves the function per request under the caller's tenant.
    // It used to decide what the handler RAN, which is what made it a
    // cross-tenant hole.
    fns = await db
      .selectFrom('zv_edge_functions')
      .selectAll()
      .where('is_active', '=', true)
      .execute();
  } catch {
    return; // Table might not exist yet on first boot
  }

  for (const fn of fns) {
    const methods: HttpMethod[] = fn.http_method === 'ANY'
      ? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
      : [fn.http_method as HttpMethod];
    const env = typeof fn.env_vars === 'string' ? JSON.parse(fn.env_vars) : fn.env_vars;
    // Functions are private unless explicitly marked public via env_vars
    const isPublic = env.ZVELTIO_PUBLIC === 'true';

    const handler = async (c: any) => {
      // Re-resolve the function for THIS request, in THIS tenant.
      //
      // `fn` above is a snapshot taken at boot from a query with no tenant in
      // it, so the loop mounted every tenant's custom paths onto one global
      // app and each handler closed over whichever tenant's row happened to be
      // there. Two tenants with a `/webhooks/stripe` shared one handler, and
      // the code that ran belonged to whoever was read first. The comment above
      // the boot query has admitted the gap for a while; this closes it at the
      // only place a tenant is knowable, which is the request.
      //
      // Re-reading also ends a quieter bug: an edited function kept running its
      // boot-time code until the extension reloaded.
      const live = await db
        .selectFrom('zv_edge_functions')
        .selectAll()
        .where('path', '=', fn.path)
        .where('is_active', '=', true)
        .executeTakeFirst()
        // fabricated-ok: `if (!live) return 404` refuses to run the function. An unreadable row does not get executed.
        .catch(() => null);

      // The path is mounted because SOME tenant defined it. That does not mean
      // this one did.
      if (!live) return c.json({ error: 'Function not found' }, 404);

      // From the live row, not the snapshot — otherwise a tenant could inherit
      // another's "public" flag, which is the same mistake in a smaller place.
      const liveEnv =
        typeof live.env_vars === 'string' ? JSON.parse(live.env_vars) : (live.env_vars ?? {});
      const livePublic = liveEnv.ZVELTIO_PUBLIC === 'true';

      // N5: require auth for non-public functions
      if (!livePublic && auth) {
        const session = await auth.api.getSession({ headers: c.req.raw.headers });
        if (!session?.user) return c.json({ error: 'Unauthorized' }, 401);
      }

      const result = await runFunction(live.code, c.req.raw, liveEnv, live.timeout_ms) as any;

      // Log async
      db.insertInto('zv_edge_function_logs').values({
        function_id: live.id,
        status: result.status,
        duration_ms: result.duration_ms,
        error: result.error || null,
      }).execute().catch(() => {});

      return new Response(result.body, {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    // `/api/fn/*` belongs to the engine, not to this extension.
    //
    // Both used to serve it. The engine mounts `/api/fn/:name`; this loop
    // registered `/api/fn/<name>` per function, and Hono prefers a static path
    // over a parameterised one — so the extension silently won, and the two
    // do not authenticate alike. The engine accepts a session OR an API key
    // bound to the tenant; this handler accepts a session only, and treats
    // `ZVELTIO_PUBLIC=true` as no authentication at all. A function author
    // could therefore turn the engine's gate off by setting an env var.
    //
    // The engine's route is also the better one for this prefix: it resolves
    // the function per request, so one created a minute ago answers
    // immediately, where these mounts are taken once at boot and a new
    // function stays dead until the extension reloads. It reads the row with
    // `tenant_id` in the WHERE clause, which the boot query above cannot do.
    // And it now honours `ZVELTIO_PUBLIC`, so nothing is lost by deferring.
    //
    // Custom root paths (`/webhooks/stripe` and the like) are the part the
    // engine cannot serve, so they stay here.
    if (fn.path.startsWith('/api/fn/')) continue;

    for (const method of methods) {
      ctx.registerPublicRoute({ method, path: fn.path, handler });
    }
  }

  const custom = fns.filter((f) => !String(f.path).startsWith('/api/fn/')).length;
  console.log(
    `  Edge functions: ${custom} custom-path mount(s); ` +
      `${fns.length - custom} served by the engine at /api/fn/:name`,
  );
}
