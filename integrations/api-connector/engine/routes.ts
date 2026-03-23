import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

// Safe fetch — no SSRF against internal networks
async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    throw new Error('SSRF: Private/loopback addresses are not allowed');
  }
  return fetch(url, options);
}

export function apiConnectorRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Connections ───────────────────────────────────────────────
  app.get('/connections', async (c) => {
    const rows = await sql`SELECT id, name, base_url, auth_type, is_active, created_at FROM zvd_api_connections ORDER BY name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/connections/:id', async (c) => {
    const row = await sql`SELECT id, name, base_url, auth_type, is_active, created_at FROM zvd_api_connections WHERE id = ${c.req.param('id')}`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/connections', zValidator('json', z.object({
    name: z.string().min(1),
    base_url: z.string().url(),
    auth_type: z.enum(['none','api_key','bearer','basic','oauth2']).default('none'),
    auth_config: z.record(z.string()).default({}),
    default_headers: z.record(z.string()).default({}),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    // Validate base_url is not internal
    try {
      await safeFetch(d.base_url + '/', { method: 'HEAD', signal: AbortSignal.timeout(100) }).catch(() => {});
    } catch (e: any) {
      if (e.message?.startsWith('SSRF')) return c.json({ error: e.message }, 400);
    }
    const row = await sql`
      INSERT INTO zvd_api_connections (name, base_url, auth_type, auth_config, default_headers, created_by)
      VALUES (${d.name}, ${d.base_url}, ${d.auth_type}, ${JSON.stringify(d.auth_config)}, ${JSON.stringify(d.default_headers)}, ${user.id})
      RETURNING id, name, base_url, auth_type, is_active, created_at
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/connections/:id', zValidator('json', z.object({
    name: z.string().optional(),
    auth_config: z.record(z.string()).optional(),
    default_headers: z.record(z.string()).optional(),
    is_active: z.boolean().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_api_connections SET
        name = COALESCE(${d.name ?? null}, name),
        auth_config = COALESCE(${d.auth_config ? JSON.stringify(d.auth_config) : null}, auth_config),
        default_headers = COALESCE(${d.default_headers ? JSON.stringify(d.default_headers) : null}, default_headers),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING id, name, base_url, auth_type, is_active
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/connections/:id', async (c) => {
    await sql`DELETE FROM zvd_api_connections WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Endpoints ─────────────────────────────────────────────────
  app.get('/connections/:id/endpoints', async (c) => {
    const rows = await sql`SELECT * FROM zvd_api_endpoints WHERE connection_id = ${c.req.param('id')} ORDER BY name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/connections/:id/endpoints', zValidator('json', z.object({
    name: z.string().min(1),
    method: z.enum(ALLOWED_METHODS),
    path: z.string().min(1),
    description: z.string().optional(),
    default_body: z.string().optional(),
    default_headers: z.record(z.string()).default({}),
    response_mapping: z.record(z.string()).default({}),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_api_endpoints (connection_id, name, method, path, description, default_body, default_headers, response_mapping, created_by)
      VALUES (${c.req.param('id')}, ${d.name}, ${d.method}, ${d.path}, ${d.description ?? null},
        ${d.default_body ?? null}, ${JSON.stringify(d.default_headers)}, ${JSON.stringify(d.response_mapping)}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/endpoints/:id', async (c) => {
    await sql`DELETE FROM zvd_api_endpoints WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Execute ───────────────────────────────────────────────────
  app.post('/endpoints/:id/execute', zValidator('json', z.object({
    path_params: z.record(z.string()).default({}),
    query_params: z.record(z.string()).default({}),
    body: z.any().optional(),
    headers: z.record(z.string()).default({}),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const ep = await sql`
      SELECT e.*, conn.base_url, conn.auth_type, conn.auth_config, conn.default_headers
      FROM zvd_api_endpoints e
      JOIN zvd_api_connections conn ON conn.id = e.connection_id
      WHERE e.id = ${c.req.param('id')} AND conn.is_active = true
    `.execute(db);
    if (!ep.rows.length) return c.json({ error: 'Endpoint not found or connection inactive' }, 404);
    const endpoint = ep.rows[0] as any;
    // Build URL
    let path = endpoint.path;
    for (const [k, v] of Object.entries(d.path_params)) {
      path = path.replace(`{${k}}`, encodeURIComponent(v as string));
    }
    const qs = new URLSearchParams(d.query_params as Record<string, string>).toString();
    const url = endpoint.base_url.replace(/\/$/, '') + path + (qs ? `?${qs}` : '');
    // Build headers
    const connHeaders = JSON.parse(endpoint.default_headers || '{}');
    const authConfig = JSON.parse(endpoint.auth_config || '{}');
    const headers: Record<string, string> = { ...connHeaders, ...d.headers };
    if (endpoint.auth_type === 'bearer') headers['Authorization'] = `Bearer ${authConfig.token}`;
    else if (endpoint.auth_type === 'api_key') headers[authConfig.header ?? 'X-API-Key'] = authConfig.key;
    else if (endpoint.auth_type === 'basic') headers['Authorization'] = `Basic ${btoa(`${authConfig.username}:${authConfig.password}`)}`;
    const startedAt = Date.now();
    let status_code = 0;
    let response_body = '';
    let error_message = null;
    try {
      const res = await safeFetch(url, {
        method: endpoint.method,
        headers,
        body: ['GET', 'HEAD'].includes(endpoint.method) ? undefined : JSON.stringify(d.body),
        signal: AbortSignal.timeout(30000),
      });
      status_code = res.status;
      response_body = await res.text();
    } catch (e: any) {
      error_message = e.message;
      status_code = 0;
    }
    const duration_ms = Date.now() - startedAt;
    await sql`
      INSERT INTO zvd_api_logs (endpoint_id, user_id, url, method, request_body, response_status, response_body, duration_ms, error_message)
      VALUES (${endpoint.id}, ${user.id}, ${url}, ${endpoint.method}, ${d.body ? JSON.stringify(d.body) : null},
        ${status_code}, ${response_body.slice(0, 10000)}, ${duration_ms}, ${error_message})
    `.execute(db);
    if (error_message) return c.json({ error: error_message }, 502);
    let parsed: any = response_body;
    try { parsed = JSON.parse(response_body); } catch {}
    return c.json({ data: parsed, status: status_code, duration_ms });
  });

  // ── Logs ──────────────────────────────────────────────────────
  app.get('/connections/:id/logs', async (c) => {
    const { limit = '50', page = '1' } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT l.*, e.name as endpoint_name
      FROM zvd_api_logs l
      JOIN zvd_api_endpoints e ON e.id = l.endpoint_id
      WHERE e.connection_id = ${c.req.param('id')}
      ORDER BY l.created_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  return app;
}
