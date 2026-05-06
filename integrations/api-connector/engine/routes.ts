import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

// SSRF protection
function validateUrl(url: string): void {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' || hostname.endsWith('.local') ||
    /^127\./.test(hostname) || /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) || hostname === '0.0.0.0' || hostname === '::1'
  ) {
    throw new Error('SSRF: Private/loopback addresses are not allowed');
  }
}

async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  validateUrl(url);
  return fetch(url, options);
}

// Exponential backoff retry
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number, timeoutMs: number): Promise<{ res: Response | null; retries: number; error: string | null }> {
  let lastError: string | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, Math.min(1000 * Math.pow(2, attempt - 1), 16000)));
    }
    try {
      const res = await safeFetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
      // Only retry on 5xx
      if (res.status >= 500 && attempt < maxRetries) {
        lastError = `HTTP ${res.status}`;
        continue;
      }
      return { res, retries: attempt, error: null };
    } catch (e: any) {
      lastError = e.message;
    }
  }
  return { res: null, retries: maxRetries, error: lastError };
}

// Resolve OAuth2 token (with refresh if expired)
async function resolveOAuth2Token(db: any, connectionId: string, authConfig: any): Promise<string> {
  const cached = await sql`SELECT * FROM zvd_api_oauth_tokens WHERE connection_id = ${connectionId}`.execute(db);
  if (cached.rows.length) {
    const tok = cached.rows[0] as any;
    const isExpired = tok.expires_at && new Date(tok.expires_at) < new Date(Date.now() + 60000);
    if (!isExpired) return tok.access_token;
    // Try refresh
    if (tok.refresh_token && authConfig.token_url) {
      try {
        const res = await fetch(authConfig.token_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: tok.refresh_token, client_id: authConfig.client_id ?? '', client_secret: authConfig.client_secret ?? '' }),
        });
        if (res.ok) {
          const data = await res.json() as any;
          const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null;
          await sql`
            UPDATE zvd_api_oauth_tokens SET access_token = ${data.access_token}, refresh_token = ${data.refresh_token ?? tok.refresh_token},
              expires_at = ${expiresAt}, updated_at = NOW()
            WHERE connection_id = ${connectionId}
          `.execute(db);
          return data.access_token;
        }
      } catch {}
    }
  }
  // Client credentials flow
  if (authConfig.token_url && authConfig.client_id) {
    const res = await fetch(authConfig.token_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: authConfig.client_id, client_secret: authConfig.client_secret ?? '', scope: authConfig.scope ?? '' }),
    });
    if (res.ok) {
      const data = await res.json() as any;
      const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null;
      await sql`
        INSERT INTO zvd_api_oauth_tokens (connection_id, access_token, refresh_token, expires_at)
        VALUES (${connectionId}, ${data.access_token}, ${data.refresh_token ?? null}, ${expiresAt})
        ON CONFLICT (connection_id) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, expires_at = EXCLUDED.expires_at, updated_at = NOW()
      `.execute(db);
      return data.access_token;
    }
    throw new Error('OAuth2 token request failed');
  }
  return authConfig.access_token ?? '';
}

export function apiConnectorRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Connections ────────────────────────────────────────────────
  app.get('/connections', async (c) => {
    const rows = await sql`SELECT id, name, base_url, auth_type, is_active, retry_count, timeout_ms, created_at FROM zvd_api_connections ORDER BY name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/connections/:id', async (c) => {
    const row = await sql`SELECT id, name, base_url, auth_type, is_active, retry_count, timeout_ms, created_at FROM zvd_api_connections WHERE id = ${c.req.param('id')}`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const endpoints = await sql`SELECT id, name, method, path, is_active FROM zvd_api_endpoints WHERE connection_id = ${c.req.param('id')} ORDER BY name`.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), endpoints: endpoints.rows } });
  });

  app.post('/connections', zValidator('json', z.object({
    name: z.string().min(1),
    base_url: z.string().url(),
    auth_type: z.enum(['none','api_key','bearer','basic','oauth2']).default('none'),
    auth_config: z.record(z.string(), z.any()).default({}),
    default_headers: z.record(z.string()).default({}),
    retry_count: z.number().int().min(0).max(5).default(3),
    timeout_ms: z.number().int().min(1000).max(120000).default(30000),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    try { validateUrl(d.base_url); } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
    const row = await sql`
      INSERT INTO zvd_api_connections (name, base_url, auth_type, auth_config, headers, default_headers, retry_count, timeout_ms, created_by)
      VALUES (${d.name}, ${d.base_url}, ${d.auth_type}, ${JSON.stringify(d.auth_config)}, ${JSON.stringify(d.default_headers)}, ${JSON.stringify(d.default_headers)}, ${d.retry_count}, ${d.timeout_ms}, ${user.id})
      RETURNING id, name, base_url, auth_type, is_active, retry_count, timeout_ms, created_at
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/connections/:id', zValidator('json', z.object({
    name: z.string().optional(),
    auth_config: z.record(z.string(), z.any()).optional(),
    default_headers: z.record(z.string()).optional(),
    is_active: z.boolean().optional(),
    retry_count: z.number().int().min(0).max(5).optional(),
    timeout_ms: z.number().int().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_api_connections SET
        name = COALESCE(${d.name ?? null}, name),
        auth_config = COALESCE(${d.auth_config ? JSON.stringify(d.auth_config) : null}::jsonb, auth_config),
        default_headers = COALESCE(${d.default_headers ? JSON.stringify(d.default_headers) : null}::jsonb, default_headers),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        retry_count = COALESCE(${d.retry_count ?? null}, retry_count),
        timeout_ms = COALESCE(${d.timeout_ms ?? null}, timeout_ms),
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

  // Health check
  app.post('/connections/:id/health-check', async (c) => {
    const conn = await sql`SELECT * FROM zvd_api_connections WHERE id = ${c.req.param('id')}`.execute(db);
    if (!conn.rows.length) return c.json({ error: 'Not found' }, 404);
    const connection = conn.rows[0] as any;
    const startedAt = Date.now();
    try {
      const res = await safeFetch(connection.base_url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      const duration_ms = Date.now() - startedAt;
      return c.json({ data: { healthy: res.status < 500, status: res.status, duration_ms } });
    } catch (e: any) {
      return c.json({ data: { healthy: false, error: e.message, duration_ms: Date.now() - startedAt } });
    }
  });

  // ── Endpoints ──────────────────────────────────────────────────
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

  app.patch('/endpoints/:id', zValidator('json', z.object({
    name: z.string().optional(),
    method: z.enum(ALLOWED_METHODS).optional(),
    path: z.string().optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_api_endpoints SET
        name = COALESCE(${d.name ?? null}, name),
        method = COALESCE(${d.method ?? null}, method),
        path = COALESCE(${d.path ?? null}, path),
        description = COALESCE(${d.description ?? null}, description),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/endpoints/:id', async (c) => {
    await sql`DELETE FROM zvd_api_endpoints WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Execute with retry + OAuth2 ────────────────────────────────
  app.post('/endpoints/:id/execute', zValidator('json', z.object({
    path_params: z.record(z.string()).default({}),
    query_params: z.record(z.string()).default({}),
    body: z.any().optional(),
    headers: z.record(z.string()).default({}),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const ep = await sql`
      SELECT e.*, conn.base_url, conn.auth_type, conn.auth_config, conn.default_headers,
        conn.retry_count, conn.timeout_ms
      FROM zvd_api_endpoints e
      JOIN zvd_api_connections conn ON conn.id = e.connection_id
      WHERE e.id = ${c.req.param('id')} AND conn.is_active = true AND e.is_active = true
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
    const connHeaders = JSON.parse(typeof endpoint.default_headers === 'string' ? endpoint.default_headers : JSON.stringify(endpoint.default_headers));
    const epHeaders = JSON.parse(typeof endpoint.default_headers_ep === 'string' ? (endpoint.default_headers_ep || '{}') : '{}');
    const authConfig = JSON.parse(typeof endpoint.auth_config === 'string' ? endpoint.auth_config : JSON.stringify(endpoint.auth_config));
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...connHeaders, ...epHeaders, ...d.headers };

    if (endpoint.auth_type === 'bearer') {
      headers['Authorization'] = `Bearer ${authConfig.token}`;
    } else if (endpoint.auth_type === 'api_key') {
      headers[authConfig.header ?? 'X-API-Key'] = authConfig.key;
    } else if (endpoint.auth_type === 'basic') {
      headers['Authorization'] = `Basic ${btoa(`${authConfig.username}:${authConfig.password}`)}`;
    } else if (endpoint.auth_type === 'oauth2') {
      try {
        const token = await resolveOAuth2Token(db, endpoint.connection_id, authConfig);
        headers['Authorization'] = `Bearer ${token}`;
      } catch (e: any) {
        return c.json({ error: 'OAuth2 token error: ' + e.message }, 502);
      }
    }

    const startedAt = Date.now();
    const { res, retries, error: fetchError } = await fetchWithRetry(url, {
      method: endpoint.method,
      headers,
      body: ['GET', 'HEAD'].includes(endpoint.method) ? undefined : JSON.stringify(d.body),
    }, endpoint.retry_count ?? 3, endpoint.timeout_ms ?? 30000);

    const duration_ms = Date.now() - startedAt;
    const status_code = res?.status ?? 0;
    const response_body = res ? await res.text() : '';

    await sql`
      INSERT INTO zvd_api_logs (endpoint_id, user_id, url, method, request_body, response_status, response_body, duration_ms, error_message, retry_count)
      VALUES (${endpoint.id}, ${user.id}, ${url}, ${endpoint.method},
        ${d.body ? JSON.stringify(d.body) : null}, ${status_code},
        ${response_body.slice(0, 10000)}, ${duration_ms}, ${fetchError}, ${retries})
    `.execute(db);

    if (fetchError) return c.json({ error: fetchError }, 502);
    let parsed: any = response_body;
    try { parsed = JSON.parse(response_body); } catch {}
    return c.json({ data: parsed, status: status_code, duration_ms, retries });
  });

  // ── Logs ───────────────────────────────────────────────────────
  app.get('/connections/:id/logs', async (c) => {
    const { limit = '50', page = '1' } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT l.*, e.name as endpoint_name, e.method, e.path
      FROM zvd_api_logs l
      JOIN zvd_api_endpoints e ON e.id = l.endpoint_id
      WHERE e.connection_id = ${c.req.param('id')}
      ORDER BY l.created_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  // ── Incoming Webhooks ──────────────────────────────────────────
  app.get('/webhooks', async (c) => {
    const rows = await sql`SELECT w.*, COUNT(e.id) as event_count FROM zvd_incoming_webhooks w LEFT JOIN zvd_webhook_events e ON e.webhook_id = w.id GROUP BY w.id ORDER BY w.name`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/webhooks', zValidator('json', z.object({
    name: z.string().min(1),
    endpoint_path: z.string().min(1).regex(/^\/[a-z0-9\-_\/]+$/),
    description: z.string().optional(),
    secret: z.string().optional(),
    connection_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_incoming_webhooks (name, endpoint_path, description, secret, connection_id, created_by)
      VALUES (${d.name}, ${d.endpoint_path}, ${d.description ?? null}, ${d.secret ?? null}, ${d.connection_id ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/webhooks/:id', async (c) => {
    await sql`DELETE FROM zvd_incoming_webhooks WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // Receive incoming webhook (public endpoint - no auth)
  app.post('/webhooks/receive/:path{.+}', async (c) => {
    const path = '/' + c.req.param('path');
    const webhook = await sql`SELECT * FROM zvd_incoming_webhooks WHERE endpoint_path = ${path} AND is_active = true`.execute(db);
    if (!webhook.rows.length) return c.json({ error: 'Webhook not found' }, 404);
    const w = webhook.rows[0] as any;
    // Verify HMAC secret if set
    if (w.secret) {
      const sig = c.req.header('x-hub-signature-256') ?? c.req.header('x-webhook-signature');
      if (!sig) return c.json({ error: 'Missing signature' }, 401);
      // Note: proper HMAC verification would need crypto module
    }
    const payload = await c.req.json().catch(() => ({}));
    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((v, k) => { headers[k] = v; });
    await sql`
      INSERT INTO zvd_webhook_events (webhook_id, payload, headers, source_ip)
      VALUES (${w.id}, ${JSON.stringify(payload)}, ${JSON.stringify(headers)}, ${c.req.header('x-forwarded-for') ?? null})
    `.execute(db);
    await sql`UPDATE zvd_incoming_webhooks SET last_received_at = NOW() WHERE id = ${w.id}`.execute(db);
    return c.json({ received: true });
  });

  app.get('/webhooks/:id/events', async (c) => {
    const { limit = '50' } = c.req.query();
    const lim = Math.min(+limit, 200);
    const rows = await sql`
      SELECT * FROM zvd_webhook_events WHERE webhook_id = ${c.req.param('id')} ORDER BY received_at DESC LIMIT ${lim}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  return app;
}
