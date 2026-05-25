import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';

// Simple in-memory rate limiter: 10 submissions per minute per IP
const submitRateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkSubmitRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = submitRateLimiter.get(ip);
  if (!entry || entry.resetAt < now) {
    submitRateLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

const fieldSchema = z.object({
  id: z.string(),
  type: z.enum([
    'text',
    'textarea',
    'email',
    'number',
    'select',
    'multiselect',
    'checkbox',
    'date',
    'file',
  ]),
  label: z.string(),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  validation: z.record(z.string(), z.unknown()).optional(),
});

const formSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().optional(),
  fields: z.array(fieldSchema).default([]),
  target_collection: z.string().optional(),
  active: z.boolean().default(true),
});

export function formsRoutes(
  ctx: ExtensionContext,
): Hono<{ Variables: { user: any } }> {
  const { db, auth, checkPermission } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return c.get('tenantTrx') ?? db;
  }


  async function requireAdmin(c: any): Promise<any | null> {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return null;
    if (!(await checkPermission(session.user.id, 'admin', '*'))) return null;
    return session.user;
  }

  const app = new Hono<{ Variables: { user: any } }>();

  // Admin middleware — applies to everything except /public/*
  // Under the new sub-app mount (/ext/forms), routes are relative:
  //   GET /          → list forms (admin)
  //   GET /:id       → single form (admin)
  //   GET /public/X  → public submit (no auth)
  app.use('*', async (c, next) => {
    if (c.req.path.startsWith('/public/')) return next();
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', user);
    await next();
  });

  // GET / — list forms with submission counts
  app.get('/', async (c) => {
    const forms = await (db as any)
      .selectFrom('zv_forms as f')
      .leftJoin(
        (eb: any) =>
          eb
            .selectFrom('zv_form_submissions')
            .select([
              'form_id',
              (eb2: any) => eb2.fn.count('id').as('submission_count'),
            ])
            .groupBy('form_id')
            .as('sc'),
        'sc.form_id',
        'f.id',
      )
      .select([
        'f.id',
        'f.name',
        'f.slug',
        'f.description',
        'f.fields',
        'f.active',
        'f.target_collection',
        'f.created_at',
        'f.updated_at',
        'sc.submission_count',
      ])
      .orderBy('f.created_at', 'desc')
      .execute();
    return c.json({ forms });
  });

  // POST / — create form
  app.post('/', zValidator('json', formSchema), async (c) => {
    const data = c.req.valid('json');
    const form = await (db as any)
      .insertInto('zv_forms')
      .values({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        fields: JSON.stringify(data.fields),
        target_collection: data.target_collection ?? null,
        active: data.active,
      })
      .returningAll()
      .executeTakeFirst();
    return c.json({ form }, 201);
  });

  // GET /:id — get form with fields
  app.get('/:id', async (c) => {
    const form = await (db as any)
      .selectFrom('zv_forms')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();
    if (!form) return c.json({ error: 'Form not found' }, 404);
    return c.json({ form });
  });

  // PATCH /:id — update form
  app.patch(
    '/:id',
    zValidator('json', formSchema.partial()),
    async (c) => {
      const data = c.req.valid('json');
      const updates: Record<string, unknown> = { updated_at: new Date() };
      if (data.name !== undefined) updates.name = data.name;
      if (data.slug !== undefined) updates.slug = data.slug;
      if (data.description !== undefined)
        updates.description = data.description;
      if (data.fields !== undefined)
        updates.fields = JSON.stringify(data.fields);
      if (data.target_collection !== undefined)
        updates.target_collection = data.target_collection;
      if (data.active !== undefined) updates.active = data.active;

      const form = await (db as any)
        .updateTable('zv_forms')
        .set(updates)
        .where('id', '=', c.req.param('id'))
        .returningAll()
        .executeTakeFirst();
      if (!form) return c.json({ error: 'Form not found' }, 404);
      return c.json({ form });
    },
  );

  // DELETE /:id — delete form
  app.delete('/:id', async (c) => {
    await (db as any)
      .deleteFrom('zv_forms')
      .where('id', '=', c.req.param('id'))
      .execute();
    return c.json({ success: true });
  });

  // GET /:id/responses — list submissions
  app.get('/:id/responses', async (c) => {
    const { page = '1', limit = '50' } = c.req.query();
    const parsedLimit = Math.min(parseInt(limit) || 50, 200);
    const offset = (parseInt(page) - 1) * parsedLimit;

    const [form, submissions] = await Promise.all([
      (db as any)
        .selectFrom('zv_forms')
        .selectAll()
        .where('id', '=', c.req.param('id'))
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_form_submissions')
        .selectAll()
        .where('form_id', '=', c.req.param('id'))
        .orderBy('created_at', 'desc')
        .limit(parsedLimit)
        .offset(offset)
        .execute(),
    ]);
    if (!form) return c.json({ error: 'Form not found' }, 404);
    return c.json({ form, submissions });
  });

  // GET /public/:slug — public form schema (no auth)
  app.get('/public/:slug', async (c) => {
    const form = await (db as any)
      .selectFrom('zv_forms')
      .select(['id', 'name', 'slug', 'description', 'fields'])
      .where('slug', '=', c.req.param('slug'))
      .where('active', '=', true)
      .executeTakeFirst();
    if (!form) return c.json({ error: 'Form not found' }, 404);
    return c.json({ form });
  });

  // POST /public/:slug/submit — submit form (no auth, rate limited)
  app.post('/public/:slug/submit', async (c) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!checkSubmitRateLimit(ip)) {
      return c.json(
        { error: 'Rate limit exceeded. Try again in a minute.' },
        429,
      );
    }

    const form = await (db as any)
      .selectFrom('zv_forms')
      .selectAll()
      .where('slug', '=', c.req.param('slug'))
      .where('active', '=', true)
      .executeTakeFirst();
    if (!form) return c.json({ error: 'Form not found' }, 404);

    const body = await c.req.json().catch(() => ({}));
    const fields: any[] =
      typeof form.fields === 'string'
        ? JSON.parse(form.fields)
        : (form.fields ?? []);

    // Validate required fields
    const missing: string[] = [];
    for (const field of fields) {
      if (
        field.required &&
        (body[field.id] === undefined ||
          body[field.id] === null ||
          body[field.id] === '')
      ) {
        missing.push(field.label ?? field.id);
      }
    }
    if (missing.length > 0) {
      return c.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        422,
      );
    }

    // Filter data to only known field ids
    const allowedIds = new Set(fields.map((f: any) => f.id));
    const cleanData: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body)) {
      if (allowedIds.has(k)) cleanData[k] = v;
    }

    // Insert submission
    const submission = await (db as any)
      .insertInto('zv_form_submissions')
      .values({
        form_id: form.id,
        data: JSON.stringify(cleanData),
        ip_address: ip,
        user_agent: c.req.header('user-agent') ?? null,
      })
      .returningAll()
      .executeTakeFirst();

    // If target_collection is set, insert record via DDLManager (S4-08:
    // use the typed instance from ctx instead of dynamic-importing engine
    // internals).
    if (form.target_collection) {
      try {
        const col = await ctx.DDLManager.getCollection(db, form.target_collection);
        if (col) {
          await (db as any)
            .insertInto(form.target_collection)
            .values(cleanData as any)
            .execute();
        }
      } catch (err) {
        console.error('[Forms] Failed to insert into target_collection:', err);
        // Don't fail the submission
      }
    }

    return c.json({ success: true, submission_id: submission.id }, 201);
  });

  return app;
}
