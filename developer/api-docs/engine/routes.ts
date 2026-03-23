import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import * as crypto from 'crypto';
import type { Database } from '../../../../packages/engine/src/db/index.js';
import { DDLManager } from '../../../../packages/engine/src/lib/ddl-manager.js';
import { auth } from '../../../../packages/engine/src/lib/auth.js';
import { checkPermission } from '../../../../packages/engine/src/lib/permissions.js';

// ── Zod schemas ───────────────────────────────────────────────────────────────

const ChangelogCreateSchema = z.object({
  version: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  changes: z.string().min(1),
  breaking_changes: z.string().optional(),
  migration_guide: z.string().optional(),
});

const ChangelogUpdateSchema = ChangelogCreateSchema.partial();

const TokenCreateSchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.string()).default([]),
  expires_at: z.string().datetime().optional(),
});

const CustomDocCreateSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  body: z.string().min(1),
  sort_order: z.number().int().default(0),
  is_published: z.boolean().default(true),
});

const CustomDocUpdateSchema = CustomDocCreateSchema.partial();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getSettingValue(db: Database, key: string): Promise<any> {
  try {
    const row = await (db as any)
      .selectFrom('zv_settings')
      .select('value')
      .where('key', '=', key)
      .executeTakeFirst();
    if (!row) return null;
    return typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
  } catch {
    return null;
  }
}

async function generateOpenAPISpec(db: Database, baseUrl: string): Promise<Record<string, any>> {
  const collections = await DDLManager.getCollections(db).catch(() => []);
  const paths: Record<string, any> = {};
  const schemas: Record<string, any> = {};

  paths['/api/auth/sign-in'] = {
    post: {
      summary: 'Sign in',
      tags: ['Authentication'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Session created' },
        '401': { description: 'Invalid credentials' },
      },
    },
  };

  for (const col of collections as any[]) {
    const typeName = col.name.charAt(0).toUpperCase() + col.name.slice(1);
    const listPath = `/api/data/${col.name}`;
    const itemPath = `/api/data/${col.name}/{id}`;

    const properties: Record<string, any> = {
      id:         { type: 'string', format: 'uuid', readOnly: true },
      created_at: { type: 'string', format: 'date-time', readOnly: true },
      updated_at: { type: 'string', format: 'date-time', readOnly: true },
      status:     { type: 'string', default: 'draft' },
    };

    for (const field of (col.fields || []) as any[]) {
      const fieldSchema: any = {};
      if (field.description) fieldSchema.description = field.description;
      switch (field.type) {
        case 'text':
        case 'string':
        case 'richtext':  fieldSchema.type = 'string'; break;
        case 'email':     fieldSchema.type = 'string'; fieldSchema.format = 'email'; break;
        case 'url':       fieldSchema.type = 'string'; fieldSchema.format = 'uri'; break;
        case 'number':
        case 'float':     fieldSchema.type = 'number'; break;
        case 'integer':   fieldSchema.type = 'integer'; break;
        case 'boolean':   fieldSchema.type = 'boolean'; break;
        case 'date':      fieldSchema.type = 'string'; fieldSchema.format = 'date'; break;
        case 'datetime':  fieldSchema.type = 'string'; fieldSchema.format = 'date-time'; break;
        case 'uuid':
        case 'reference':
        case 'file':      fieldSchema.type = 'string'; fieldSchema.format = 'uuid'; break;
        case 'json':      fieldSchema.type = 'object'; break;
        default:          fieldSchema.type = 'string';
      }
      if (field.required) fieldSchema['x-required'] = true;
      properties[field.name] = fieldSchema;
    }

    schemas[typeName] = {
      type: 'object',
      description: col.description || `${typeName} record`,
      properties,
    };

    const exampleRecord: Record<string, any> = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      created_at: '2026-01-01T10:00:00.000Z',
      updated_at: '2026-01-15T14:30:00.000Z',
      status: 'published',
    };
    const fieldExamples: Record<string, any> = {
      text: 'Example text', string: 'Example', number: 42, boolean: true,
      email: 'user@example.com', url: 'https://example.com',
      date: '2026-01-01', datetime: '2026-01-01T10:00:00.000Z',
      uuid: '550e8400-e29b-41d4-a716-446655440001',
    };
    for (const field of (col.fields || []) as any[]) {
      exampleRecord[field.name] = fieldExamples[field.type] ?? null;
    }

    paths[listPath] = {
      get: {
        summary: `List ${typeName}s`,
        tags: [typeName],
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'page',  in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'sort',  in: 'query', schema: { type: 'string' } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
          {
            name: 'as_of',
            in: 'query',
            description: 'Time travel: ISO 8601 timestamp to query historical state',
            schema: { type: 'string', format: 'date-time' },
          },
        ],
        responses: {
          '200': {
            description: `List of ${typeName} records`,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    records: { type: 'array', items: { $ref: `#/components/schemas/${typeName}` } },
                    pagination: {
                      type: 'object',
                      properties: {
                        total: { type: 'integer' }, page: { type: 'integer' },
                        limit: { type: 'integer' }, pages: { type: 'integer' },
                      },
                    },
                  },
                },
                example: { records: [exampleRecord], pagination: { total: 1, page: 1, limit: 20, pages: 1 } },
              },
            },
          },
        },
      },
      post: {
        summary: `Create ${typeName}`,
        tags: [typeName],
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: `#/components/schemas/${typeName}` } } },
        },
        responses: {
          '201': { description: `${typeName} created` },
          '422': { description: 'Validation failed' },
        },
      },
    };

    paths[itemPath] = {
      get: {
        summary: `Get ${typeName} by ID`,
        tags: [typeName],
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'as_of', in: 'query', description: 'Time travel: ISO 8601 timestamp', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': {
            description: `${typeName} record`,
            content: {
              'application/json': {
                schema: { type: 'object', properties: { record: { $ref: `#/components/schemas/${typeName}` } } },
                example: { record: exampleRecord },
              },
            },
          },
          '404': { description: 'Not found' },
        },
      },
      put: {
        summary: `Update ${typeName}`,
        tags: [typeName],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: `#/components/schemas/${typeName}` } } },
        },
        responses: { '200': { description: 'Updated' }, '404': { description: 'Not found' } },
      },
      delete: {
        summary: `Delete ${typeName}`,
        tags: [typeName],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Deleted' }, '404': { description: 'Not found' } },
      },
    };

    paths[`${itemPath}/timeline`] = {
      get: {
        summary: `Get ${typeName} change history`,
        description: 'Returns a chronological timeline of all changes to this record.',
        tags: [typeName],
        security: [{ cookieAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Change timeline' } },
      },
    };
  }

  const branding = await getSettingValue(db, 'branding');
  const appName = (branding as any)?.company_name || 'Zveltio API';

  return {
    openapi: '3.0.3',
    info: {
      title: `${appName} API`,
      description: `Auto-generated API documentation for ${appName}. This documentation reflects your actual data model.`,
      version: '1.0.0',
      contact: { email: (branding as any)?.contact_email || 'admin@yourdomain.com' },
    },
    servers: [{ url: baseUrl, description: 'API Server' }],
    tags: [
      { name: 'Authentication', description: 'User authentication' },
      ...(collections as any[]).map((c: any) => ({
        name: c.name.charAt(0).toUpperCase() + c.name.slice(1),
        description: c.description || '',
      })),
    ],
    paths,
    components: {
      schemas,
      securitySchemes: {
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'better-auth.session_token' },
      },
    },
  };
}

function resolveBaseUrl(c: any): string {
  const proto = c.req.header('x-forwarded-proto') || 'http';
  const host  = c.req.header('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

async function checkDocsAccess(db: Database, c: any): Promise<boolean> {
  const docsPublic = await getSettingValue(db, 'api_docs_public');
  if (docsPublic === true || docsPublic === 'true') return true;
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return !!session;
}

// ── Route factory ─────────────────────────────────────────────────────────────

export function apiDocsRoutes(db: Database, _auth: any): Hono {
  const router = new Hono();

  // ── GET / — Swagger UI ────────────────────────────────────────────────────

  router.get('/', async (c) => {
    const accessible = await checkDocsAccess(db, c);
    if (!accessible) return c.json({ error: 'API docs are private. Sign in to view.' }, 401);

    const spec = await generateOpenAPISpec(db, resolveBaseUrl(c));
    const appName = (spec.info as any).title;

    return c.html(`<!DOCTYPE html>
<html>
<head>
  <title>${appName} - API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.css">
  <style>
    body { margin: 0; background: #1a1a2e; }
    .swagger-ui .topbar { background: #069494; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    #version-badge {
      position: fixed; bottom: 16px; right: 16px;
      background: #069494; color: white; padding: 4px 12px;
      border-radius: 20px; font-size: 12px; font-family: monospace;
      z-index: 9999;
    }
  </style>
</head>
<body>
<div id="swagger-ui"></div>
<div id="version-badge">Powered by Zveltio</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js"></script>
<script>
  window.onload = function() {
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      tryItOutEnabled: true,
      persistAuthorization: true,
      withCredentials: true,
      syntaxHighlight: { activate: true, theme: 'monokai' },
    });
  };
</script>
</body>
</html>`);
  });

  // ── GET /openapi.json ─────────────────────────────────────────────────────

  router.get('/openapi.json', async (c) => {
    const accessible = await checkDocsAccess(db, c);
    if (!accessible) return c.json({ error: 'API docs are private. Sign in to view.' }, 401);
    const spec = await generateOpenAPISpec(db, resolveBaseUrl(c));
    return c.json(spec);
  });

  // ── GET /postman ──────────────────────────────────────────────────────────

  router.get('/postman', async (c) => {
    const accessible = await checkDocsAccess(db, c);
    if (!accessible) return c.json({ error: 'API docs are private. Sign in to view.' }, 401);

    const spec = await generateOpenAPISpec(db, resolveBaseUrl(c));
    const postman = {
      info: {
        name: (spec.info as any).title,
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: Object.entries(spec.paths as any).map(([path, methods]: any) => ({
        name: path,
        item: Object.entries(methods).map(([method, op]: any) => ({
          name: op.summary,
          request: {
            method: method.toUpperCase(),
            url: { raw: `{{baseUrl}}${path}` },
            header: [{ key: 'Content-Type', value: 'application/json' }],
          },
        })),
      })),
      variable: [{ key: 'baseUrl', value: (spec.servers as any)[0]?.url || 'http://localhost:3000' }],
    };

    c.header('Content-Disposition', 'attachment; filename="api-collection.json"');
    return c.json(postman);
  });

  // ── Changelogs ────────────────────────────────────────────────────────────

  // GET /changelogs — public endpoint (published only)
  router.get('/changelogs', async (c) => {
    const rows = await sql<any>`
      SELECT id, version, title, changes, breaking_changes, migration_guide,
             published_at, is_published, created_by, created_at
      FROM zvd_api_changelogs
      WHERE is_published = true
      ORDER BY published_at DESC NULLS LAST, created_at DESC
    `.execute(db);
    return c.json({ changelogs: rows.rows });
  });

  // POST /changelogs — admin only
  router.post('/changelogs', zValidator('json', ChangelogCreateSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const body = c.req.valid('json');
    const row = await sql<any>`
      INSERT INTO zvd_api_changelogs
        (version, title, changes, breaking_changes, migration_guide, created_by)
      VALUES
        (${body.version}, ${body.title}, ${body.changes},
         ${body.breaking_changes ?? null}, ${body.migration_guide ?? null},
         ${session.user.id})
      RETURNING *
    `.execute(db);
    return c.json({ changelog: row.rows[0] }, 201);
  });

  // PATCH /changelogs/:id — admin only
  router.patch('/changelogs/:id', zValidator('json', ChangelogUpdateSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const id = c.req.param('id');
    const body = c.req.valid('json');

    const setClauses: string[] = [];
    const values: any[] = [];

    if (body.version !== undefined) { setClauses.push(`version = $${setClauses.length + 1}`); values.push(body.version); }
    if (body.title !== undefined) { setClauses.push(`title = $${setClauses.length + 1}`); values.push(body.title); }
    if (body.changes !== undefined) { setClauses.push(`changes = $${setClauses.length + 1}`); values.push(body.changes); }
    if (body.breaking_changes !== undefined) { setClauses.push(`breaking_changes = $${setClauses.length + 1}`); values.push(body.breaking_changes); }
    if (body.migration_guide !== undefined) { setClauses.push(`migration_guide = $${setClauses.length + 1}`); values.push(body.migration_guide); }

    if (setClauses.length === 0) return c.json({ error: 'No fields to update' }, 400);

    const row = await (db as any)
      .updateTable('zvd_api_changelogs')
      .set(Object.fromEntries(
        Object.entries(body).filter(([, v]) => v !== undefined),
      ))
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json({ changelog: row });
  });

  // DELETE /changelogs/:id — admin only
  router.delete('/changelogs/:id', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const id = c.req.param('id');
    const res = await (db as any)
      .deleteFrom('zvd_api_changelogs')
      .where('id', '=', id)
      .executeTakeFirst();

    if ((res?.numDeletedRows ?? 0n) === 0n) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });

  // POST /changelogs/:id/publish — admin only
  router.post('/changelogs/:id/publish', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const id = c.req.param('id');
    const row = await (db as any)
      .updateTable('zvd_api_changelogs')
      .set({ is_published: true, published_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json({ changelog: row });
  });

  // ── API Access Tokens ─────────────────────────────────────────────────────

  // GET /tokens — list tokens for current user (redacted)
  router.get('/tokens', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const rows = await sql<any>`
      SELECT id, name, token_prefix, scopes, expires_at, last_used_at,
             use_count, created_at, revoked_at
      FROM zvd_api_access_tokens
      WHERE created_by = ${session.user.id}
        AND revoked_at IS NULL
      ORDER BY created_at DESC
    `.execute(db);
    return c.json({ tokens: rows.rows });
  });

  // POST /tokens — create token (returns plaintext once)
  router.post('/tokens', zValidator('json', TokenCreateSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const plaintext = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plaintext).digest('hex');
    const tokenPrefix = plaintext.slice(0, 8);

    const row = await sql<any>`
      INSERT INTO zvd_api_access_tokens
        (name, token_hash, token_prefix, scopes, expires_at, created_by)
      VALUES
        (${body.name}, ${tokenHash}, ${tokenPrefix},
         ${body.scopes as any}, ${body.expires_at ? new Date(body.expires_at) : null},
         ${session.user.id})
      RETURNING id, name, token_prefix, scopes, expires_at, created_at
    `.execute(db);

    return c.json({
      token: row.rows[0],
      plaintext_token: plaintext,
      warning: 'Store this token securely — it will not be shown again.',
    }, 201);
  });

  // DELETE /tokens/:id — revoke token
  router.delete('/tokens/:id', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const id = c.req.param('id');
    const row = await (db as any)
      .updateTable('zvd_api_access_tokens')
      .set({ revoked_at: new Date() })
      .where('id', '=', id)
      .where('created_by', '=', session.user.id)
      .where('revoked_at', 'is', null)
      .returningAll()
      .executeTakeFirst();

    if (!row) return c.json({ error: 'Token not found or already revoked' }, 404);
    return c.json({ success: true });
  });

  // ── Custom Docs ───────────────────────────────────────────────────────────

  // GET /custom-docs — list published sections (public)
  router.get('/custom-docs', async (c) => {
    const rows = await sql<any>`
      SELECT id, title, slug, body, sort_order, is_published, created_at, updated_at
      FROM zvd_api_custom_docs
      WHERE is_published = true
      ORDER BY sort_order ASC, created_at ASC
    `.execute(db);
    return c.json({ docs: rows.rows });
  });

  // POST /custom-docs — create section (admin only)
  router.post('/custom-docs', zValidator('json', CustomDocCreateSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const body = c.req.valid('json');
    const row = await sql<any>`
      INSERT INTO zvd_api_custom_docs
        (title, slug, body, sort_order, is_published, created_by)
      VALUES
        (${body.title}, ${body.slug}, ${body.body},
         ${body.sort_order}, ${body.is_published}, ${session.user.id})
      RETURNING *
    `.execute(db);
    return c.json({ doc: row.rows[0] }, 201);
  });

  // PATCH /custom-docs/:id — update section (admin only)
  router.patch('/custom-docs/:id', zValidator('json', CustomDocUpdateSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const id = c.req.param('id');
    const body = c.req.valid('json');
    const updates: Record<string, any> = {
      ...Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined)),
      updated_at: new Date(),
    };

    const row = await (db as any)
      .updateTable('zvd_api_custom_docs')
      .set(updates)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();

    if (!row) return c.json({ error: 'Not found' }, 404);
    return c.json({ doc: row });
  });

  // DELETE /custom-docs/:id — delete section (admin only)
  router.delete('/custom-docs/:id', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const id = c.req.param('id');
    const res = await (db as any)
      .deleteFrom('zvd_api_custom_docs')
      .where('id', '=', id)
      .executeTakeFirst();

    if ((res?.numDeletedRows ?? 0n) === 0n) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });

  return router;
}
