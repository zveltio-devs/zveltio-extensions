import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { toJsonb } from '@zveltio/sdk/extension';
/**
 * Returns the authenticated user if they have admin permission, or null.
 * Edge function CRUD (create/read/update/delete code) requires admin rights —
 * any authenticated non-admin user creating edge functions could execute
 * arbitrary code in the engine sandbox.
 */

/**
 * What `ctx.internals.runEdgeFunction` takes and returns.
 *
 * Declared here because the internals boundary is untyped, and that is not a
 * cosmetic gap: both call sites used to pass a `Request` where an EdgeRequest
 * belongs and read `.status` / `.body` off a result that has neither, and an
 * `as any` on the return meant nothing said so. Writing the shapes down is what
 * makes the next mistake of that kind a compile error.
 *
 * Mirrors packages/engine/src/lib/edge-function-runner.ts.
 */
interface EdgeRequestShape {
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  path: string;
}

interface EdgeRunResult {
  ok: boolean;
  response?: { status: number; body: unknown; headers?: Record<string, string> };
  error?: string;
  logs: string[];
  duration_ms: number;
}

type RunEdgeFunction = (
  code: string,
  request: EdgeRequestShape,
  env: Record<string, string>,
  timeoutMs: number,
  /** The function's `egress` column; NULL declares nothing. */
  egress: string[] | null,
) => Promise<EdgeRunResult>;

/**
 * The hosts a function may reach — its `egress` column (engine migration 061).
 *
 * NULL declares nothing: the function stays the engine's child, with the
 * engine's network. `[]` declares no egress, and `["api.stripe.com",
 * "hooks.slack.com:8443"]` exactly those authorities: on the extension runner
 * the engine performs its `fetch` and refuses every other host, redirects
 * included. Saving the function is the admin's approval, so a host that is not
 * one is refused HERE, at save, instead of failing every invocation later.
 *
 * Same form as the engine's `parseEgress` and the column's CHECK, which refuses
 * anything this lets through: a lower-case host name, an `[IPv6]` literal,
 * optionally `:port`; no scheme, path or wildcard. Written lower-cased and
 * without duplicates.
 */
const EGRESS_HOST =
  /^(\[[0-9a-f:.]+\]|[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*)(:\d{1,5})?$/;

/**
 * The engine matches a request against the URL parser's spelling of the host,
 * and `parseEgress` refuses an entry the parser rewrites (`010.0.0.1`,
 * `[2001:0db8::1]`) or rejects (a port above 65535). Refused here too, with
 * the spelling to write, or the save succeeds and every invocation fails.
 */
function urlSpelling(entry: string): string | null {
  try {
    return new URL(`http://${entry}`).hostname;
  } catch {
    return null;
  }
}

const egressSchema = z
  .array(
    z
      .string()
      .trim()
      .toLowerCase()
      .refine((h) => EGRESS_HOST.test(h), {
        abort: true,
        error: (issue) =>
          `"${String(issue.input)}" is not a host — write host or host:port, no scheme, path or wildcard`,
      })
      .refine((h) => urlSpelling(h) === h.replace(/:\d{1,5}$/, ''), {
        error: (issue) => {
          const h = String(issue.input).trim().toLowerCase();
          const spelled = urlSpelling(h);
          return spelled
            ? `"${h}" is written "${spelled}" by the URL parser — list it that way`
            : `"${h}" is not a valid host:port`;
        },
      }),
  )
  .max(64)
  .transform((hosts) => [...new Set(hosts)])
  .nullable();

/** `ZVELTIO_EGRESS` in env_vars granted egress before 061; now it would be silently ignored. */
const envVarsSchema = z
  .record(z.string(), z.string())
  .refine((env) => !Object.hasOwn(env, 'ZVELTIO_EGRESS'), {
    error: 'ZVELTIO_EGRESS is no longer read — list the hosts in `egress`',
  });

const sameHosts = (a: string[] | null, b: string[] | null) =>
  a === b || (a !== null && b !== null && a.length === b.length && a.every((h, i) => h === b[i]));

/**
 * Headers a sandboxed function must not be given — the caller's credentials.
 * Mirrors the engine's own `/api/fn/:name` route.
 */
const CREDENTIAL_HEADERS = new Set([
  'cookie',
  'authorization',
  'x-api-key',
  'x-preview-token',
  'x-tenant-slug',
]);

/** A request body the handler can use: parsed JSON, or the raw text if it is not JSON. */
function parseJsonBody(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

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

  const runFunction = ctx.internals.runEdgeFunction as unknown as RunEdgeFunction;

  async function requireAdmin(c: any) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return null;
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    return isAdmin ? session.user : null;
  }

  /**
   * Who changed what a function may reach, or deleted it, and when: the
   * approval the save stands for. The engine's audit log
   * (`ctx.internals.audit`), as a row of the running tenant. A failed write is
   * logged; the change has already happened.
   */
  async function audit(
    type: 'edge_function.egress_changed' | 'edge_function.deleted',
    userId: string,
    fn: Record<string, any>,
    metadata: Record<string, unknown> = {},
  ) {
    await ctx.internals
      .audit({
        type,
        userId,
        resourceType: 'edge_function',
        resourceId: fn.id,
        metadata: { name: fn.name, ...metadata },
      })
      .catch((err: Error) => {
        console.warn(`[edge-functions] ${type} audit write failed:`, err.message);
      });
  }
  const auditEgress = (
    userId: string,
    fn: Record<string, any>,
    before: string[] | null,
    after: string[] | null,
  ) => audit('edge_function.egress_changed', userId, fn, { before, after });

  const app = new Hono();

  // ─── Admin CRUD ────────────────────────────────────────────────

  app.get('/', async (c) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const fns = await db
      .selectFrom('zv_edge_functions')
      .select(['id', 'name', 'display_name', 'description', 'http_method', 'path', 'is_active', 'runtime', 'egress', 'created_at'])
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
        env_vars: envVarsSchema.default({}),
        egress: egressSchema.default(null),
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
          egress: body.egress,
          created_by: user.id,
        })
        .returningAll()
        .executeTakeFirst();

      if (fn && body.egress !== null) await auditEgress(user.id, fn, null, body.egress);
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
        env_vars: envVarsSchema.optional(),
        egress: egressSchema.optional(),
      }),
    ),
    async (c) => {
      const user = await requireAdmin(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const updates: any = { updated_at: new Date() };
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined) {
          // `toJsonb`, not `JSON.stringify`: under Bun.SQL a stringified value is
          // stored as a jsonb STRING, which `env_vars ? 'KEY'` cannot see into.
          updates[k] = k === 'env_vars' ? toJsonb(v) : v;
        }
      }

      // `old.egress` (PostgreSQL 18) is what this UPDATE replaced, read in the
      // same statement: a separate SELECT first let a concurrent save land in
      // between, and a change back to the value read then went unaudited.
      const row = await db
        .updateTable('zv_edge_functions')
        .set(updates)
        .where('id', '=', c.req.param('id'))
        .returningAll()
        .returning(sql<string[] | null>`old.egress`.as('egress_before'))
        .executeTakeFirst();

      if (!row) return c.json({ error: 'Function not found' }, 404);
      const { egress_before: before, ...fn } = row as Record<string, any>;
      if (body.egress !== undefined && !sameHosts(before ?? null, body.egress)) {
        await auditEgress(user.id, fn, before ?? null, body.egress);
      }
      return c.json({ function: fn });
    },
  );

  app.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const fn = await db
      .deleteFrom('zv_edge_functions')
      .where('id', '=', c.req.param('id'))
      .returning(['id', 'name', 'path', 'egress'])
      .executeTakeFirst();
    // A deleted function takes its code and its egress approval with it.
    if (fn) await audit('edge_function.deleted', user.id, fn, { path: fn.path, egress: fn.egress });
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

    // `runEdgeFunction` takes an EdgeRequest — a plain object — not a `Request`.
    // It used to be handed `new Request(...)`, which the runner passes through
    // `JSON.stringify` on its way into the sandbox: `JSON.stringify(request)` is
    // `{}` for a Request, so the handler received an EMPTY object and saw no
    // method, no body, no headers and no query. Measured, not deduced.
    const result = await runFunction(
      fn.code,
      {
        method: fn.http_method === 'ANY' ? 'POST' : fn.http_method,
        headers: { 'content-type': 'application/json' },
        query: Object.fromEntries(new URL(c.req.url).searchParams),
        body: parseJsonBody(bodyText),
        path: fn.path,
      },
      typeof fn.env_vars === 'string' ? JSON.parse(fn.env_vars) : (fn.env_vars ?? {}),
      fn.timeout_ms,
      fn.egress ?? null,
    );

    // A RunResult is { ok, response, logs, duration_ms } — it has no `status`
    // and no `body`. Reading those wrote `status: undefined` into a NOT NULL
    // column, so every insert here failed and the `.catch(() => {})` swallowed
    // it: this table has never had a row from this route.
    const status = result.ok ? (result.response?.status ?? 200) : 500;
    await db.insertInto('zv_edge_function_logs').values({
      function_id: fn.id,
      status,
      duration_ms: result.duration_ms,
      request_body: bodyText,
      response_body: result.ok ? JSON.stringify(result.response?.body) : null,
      error: result.error || null,
    }).execute().catch((err: Error) => {
      console.warn('[edge-functions] invocation log failed:', err.message);
    });

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
  const runFunction = ctx.internals.runEdgeFunction as unknown as RunEdgeFunction;

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

      // An EdgeRequest, not `c.req.raw`. A `Request` JSON-stringifies to `{}`,
      // so every function reached through this path ran against an empty
      // request object — no method, no body, no headers, no query.
      //
      // Credential headers are withheld deliberately, matching the engine's own
      // route: forwarding `cookie` hands the function the caller's session, and
      // a sandbox that is given the caller's credentials on the way in is not
      // containing very much. Webhook signature headers survive — they are what
      // a receiver is for, and they authenticate the sender, not the caller.
      const headersObj: Record<string, string> = {};
      c.req.raw.headers.forEach((v: string, k: string) => {
        if (!CREDENTIAL_HEADERS.has(k.toLowerCase())) headersObj[k] = v;
      });

      const contentType = c.req.header('content-type') ?? '';
      let body: unknown = null;
      try {
        if (contentType.includes('application/json')) body = await c.req.json();
        else if (contentType.includes('text/')) body = await c.req.text();
      } catch {
        // A malformed body is the caller's problem, not a reason to 500 before
        // the function has seen it. The handler gets null.
      }

      const result = await runFunction(
        live.code,
        {
          method: c.req.method,
          headers: headersObj,
          query: Object.fromEntries(new URL(c.req.url).searchParams),
          body,
          path: c.req.path,
        },
        liveEnv,
        live.timeout_ms,
        live.egress ?? null,
      );

      const status = result.ok ? (result.response?.status ?? 200) : 500;

      // Log async. `status` is NOT NULL, and this used to pass `result.status`,
      // which a RunResult does not carry — so the insert failed every time and
      // the empty catch hid it.
      db.insertInto('zv_edge_function_logs').values({
        function_id: live.id,
        status,
        duration_ms: result.duration_ms,
        error: result.error || null,
      }).execute().catch((err: Error) => {
        console.warn('[edge-functions] invocation log failed:', err.message);
      });

      if (!result.ok) {
        return c.json({ error: result.error, logs: result.logs }, 500);
      }

      const response = new Response(JSON.stringify(result.response?.body ?? null), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
      for (const [k, v] of Object.entries(result.response?.headers ?? {})) {
        response.headers.set(k, v as string);
      }
      return response;
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
