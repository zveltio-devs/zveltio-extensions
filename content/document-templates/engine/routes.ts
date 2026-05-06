/**
 * Document Templates (admin-only) — Enterprise Edition
 *
 * GET    /api/document-templates              — list templates
 * GET    /api/document-templates/stats        — usage stats
 * GET    /api/document-templates/batch-jobs   — list batch render jobs
 * POST   /api/document-templates/batch-jobs   — create batch job
 * GET    /api/document-templates/batch-jobs/:id — get job status
 * GET    /api/document-templates/:id          — get single template
 * POST   /api/document-templates              — create template
 * PATCH  /api/document-templates/:id          — update template
 * DELETE /api/document-templates/:id          — delete template
 * POST   /api/document-templates/:id/generate — generate PDF from template
 * GET    /api/document-templates/:id/generations — list generation history
 * GET    /api/document-templates/:id/versions — list versions
 * POST   /api/document-templates/:id/versions — snapshot current as new version
 * POST   /api/document-templates/:id/versions/:versionNumber/restore — restore version
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// ── Schemas ───────────────────────────────────────────────────────────────────

const DocumentTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  template_type: z.enum(['html', 'markdown', 'handlebars', 'mustache']).default('html'),
  output_format: z.enum(['pdf', 'docx', 'html', 'markdown', 'txt']).default('pdf'),
  content: z.string().min(1),
  variables: z.record(z.string(), z.string()).optional().default({}),
  style_config: z.record(z.string(), z.any()).optional().default({}),
  is_active: z.boolean().default(true),
  tags: z.array(z.string()).optional().default([]),
});

const UpdateDocumentTemplateSchema = DocumentTemplateSchema.partial();

const GenerateSchema = z.object({
  variables: z.record(z.string(), z.any()).optional().default({}),
  output_format: z.enum(['pdf', 'docx', 'html', 'markdown', 'txt']).optional(),
});

const BatchJobSchema = z.object({
  template_id: z.string().uuid(),
  job_name: z.string().min(1).max(255),
  data_source: z.string().min(1),
  filter_config: z.record(z.string(), z.any()).optional().default({}),
  output_format: z.enum(['pdf', 'html', 'zip']).default('pdf'),
});

const VersionSnapshotSchema = z.object({
  change_notes: z.string().optional(),
});

// ── Template renderer ─────────────────────────────────────────────────────────

function populatePlaceholders(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, key) => {
    const keys = key.split('.');
    let value: any = variables;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined || value === null) return '';
    }
    if (value instanceof Date) return value.toLocaleDateString('ro-RO');
    return String(value);
  });
}

// ── Route factory ─────────────────────────────────────────────────────────────

export function documentTemplatesRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission } = ctx;
  const { generatePDFAsync } = ctx.internals;

  const app = new Hono<{ Variables: { user: any } }>();

  // Admin-only middleware
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    const hasAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!hasAdmin) return c.json({ error: 'Admin access required' }, 403);
    return next();
  });

  // GET /stats — must be before /:id
  app.get('/stats', async (c) => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalTemplates, totalRenders, rendersThisMonth, topTemplates] = await Promise.all([
      (db as any)
        .selectFrom('zv_document_templates')
        .select((eb: any) => eb.fn.count('id').as('count'))
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_document_renders')
        .select((eb: any) => eb.fn.count('id').as('count'))
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_document_renders')
        .select((eb: any) => eb.fn.count('id').as('count'))
        .where('rendered_at', '>=', firstOfMonth)
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_document_templates')
        .select(['id', 'name', 'usage_count'])
        .where('is_active', '=', true)
        .orderBy('usage_count', 'desc')
        .limit(5)
        .execute(),
    ]);

    return c.json({
      total_templates: Number(totalTemplates?.count || 0),
      total_renders: Number(totalRenders?.count || 0),
      renders_this_month: Number(rendersThisMonth?.count || 0),
      top_templates: topTemplates,
    });
  });

  // GET /batch-jobs — must be before /:id
  app.get('/batch-jobs', async (c) => {
    const jobs = await (db as any)
      .selectFrom('zv_document_render_jobs')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(50)
      .execute();
    return c.json({ jobs });
  });

  // POST /batch-jobs
  app.post('/batch-jobs', zValidator('json', BatchJobSchema), async (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');

    const job = await (db as any)
      .insertInto('zv_document_render_jobs')
      .values({
        template_id: data.template_id,
        job_name: data.job_name,
        data_source: data.data_source,
        filter_config: JSON.stringify(data.filter_config),
        output_format: data.output_format,
        status: 'pending',
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ job }, 201);
  });

  // GET /batch-jobs/:id — must be before /:id
  app.get('/batch-jobs/:id', async (c) => {
    const id = c.req.param('id');
    const job = await (db as any)
      .selectFrom('zv_document_render_jobs')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!job) return c.json({ error: 'Job not found' }, 404);
    return c.json({ job });
  });

  // GET /
  app.get('/', async (c) => {
    const result = await (db as any)
      .selectFrom('zv_document_templates')
      .selectAll()
      .orderBy('name')
      .execute();
    return c.json({ templates: result });
  });

  // GET /:id
  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const template = await (db as any)
      .selectFrom('zv_document_templates')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    if (!template) return c.json({ error: 'Template not found' }, 404);
    return c.json({ template });
  });

  // POST /
  app.post('/', zValidator('json', DocumentTemplateSchema), async (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');
    const result = await sql<any>`
      INSERT INTO zv_document_templates (name, description, template_type, output_format, content, variables, style_config, is_active, tags, created_by)
      VALUES (${data.name}, ${data.description || null}, ${data.template_type}, ${data.output_format},
              ${data.content}, ${JSON.stringify(data.variables)}::jsonb, ${JSON.stringify(data.style_config)}::jsonb,
              ${data.is_active}, ${data.tags as any}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ template: result.rows[0] }, 201);
  });

  // PATCH /:id
  app.patch('/:id', zValidator('json', UpdateDocumentTemplateSchema), async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const existing = await (db as any)
      .selectFrom('zv_document_templates')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst();
    if (!existing) return c.json({ error: 'Template not found' }, 404);

    const updateFields: Record<string, any> = { updated_at: new Date() };
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      if (key === 'variables' || key === 'style_config') {
        updateFields[key] = JSON.stringify(value) as any;
      } else {
        updateFields[key] = value;
      }
    }

    const template = await (db as any)
      .updateTable('zv_document_templates')
      .set(updateFields)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst();
    return c.json({ template });
  });

  // DELETE /:id
  app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const result = await sql`DELETE FROM zv_document_templates WHERE id = ${id} RETURNING id`.execute(db);
    if (result.rows.length === 0) return c.json({ error: 'Template not found' }, 404);
    return c.json({ success: true });
  });

  // POST /:id/generate
  app.post('/:id/generate', zValidator('json', GenerateSchema), async (c) => {
    const templateId = c.req.param('id');
    const data = c.req.valid('json');
    const user = c.get('user');

    const template = await (db as any)
      .selectFrom('zv_document_templates')
      .selectAll()
      .where('id', '=', templateId)
      .executeTakeFirst();
    if (!template) return c.json({ error: 'Template not found' }, 404);
    if (!template.is_active) return c.json({ error: 'Template is not active' }, 400);

    const populated = populatePlaceholders(template.content, data.variables || {});
    const pdfBuffer = await generatePDFAsync(populated, template.style_config ?? {}) as Buffer;

    // Increment usage_count and last_used_at
    await (db as any)
      .updateTable('zv_document_templates')
      .set({
        usage_count: sql`usage_count + 1`,
        last_used_at: new Date(),
      })
      .where('id', '=', templateId)
      .execute();

    try {
      await (db as any)
        .insertInto('zv_document_renders')
        .values({
          template_id: templateId,
          variables: JSON.stringify(data.variables || {}),
          output_format: 'pdf',
          rendered_by: user?.id || null,
          rendered_at: new Date(),
        })
        .execute();
    } catch { /* non-critical audit log */ }

    const filename = `${template.name.replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}.pdf`;
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="${filename}"`);
    return c.body(new Uint8Array(pdfBuffer));
  });

  // GET /:id/generations
  app.get('/:id/generations', async (c) => {
    const templateId = c.req.param('id');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    const result = await (db as any)
      .selectFrom('zv_document_renders')
      .selectAll()
      .where('template_id', '=', templateId)
      .orderBy('rendered_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return c.json({ generations: result });
  });

  // GET /:id/versions
  app.get('/:id/versions', async (c) => {
    const templateId = c.req.param('id');

    const versions = await (db as any)
      .selectFrom('zv_document_template_versions')
      .selectAll()
      .where('template_id', '=', templateId)
      .orderBy('version_number', 'desc')
      .execute();

    return c.json({ versions });
  });

  // POST /:id/versions — snapshot current template
  app.post('/:id/versions', zValidator('json', VersionSnapshotSchema), async (c) => {
    const user = c.get('user');
    const templateId = c.req.param('id');
    const data = c.req.valid('json');

    const template = await (db as any)
      .selectFrom('zv_document_templates')
      .select(['id', 'content', 'style_config', 'variables', 'version_number'])
      .where('id', '=', templateId)
      .executeTakeFirst();

    if (!template) return c.json({ error: 'Template not found' }, 404);

    // Get max existing version number
    const maxVersionResult = await (db as any)
      .selectFrom('zv_document_template_versions')
      .select((eb: any) => eb.fn.max('version_number').as('max_version'))
      .where('template_id', '=', templateId)
      .executeTakeFirst();

    const nextVersion = (Number(maxVersionResult?.max_version || 0)) + 1;

    const version = await (db as any)
      .insertInto('zv_document_template_versions')
      .values({
        template_id: templateId,
        version_number: nextVersion,
        html_body: template.content || '',
        css_styles: null,
        variables: JSON.stringify(
          typeof template.variables === 'string'
            ? JSON.parse(template.variables)
            : template.variables || {}
        ),
        change_notes: data.change_notes || null,
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ version }, 201);
  });

  // POST /:id/versions/:versionNumber/restore
  app.post('/:id/versions/:versionNumber/restore', async (c) => {
    const user = c.get('user');
    const templateId = c.req.param('id');
    const versionNumber = parseInt(c.req.param('versionNumber'));

    if (isNaN(versionNumber)) return c.json({ error: 'Invalid version number' }, 400);

    const version = await (db as any)
      .selectFrom('zv_document_template_versions')
      .selectAll()
      .where('template_id', '=', templateId)
      .where('version_number', '=', versionNumber)
      .executeTakeFirst();

    if (!version) return c.json({ error: 'Version not found' }, 404);

    // Snapshot current state before restoring
    const current = await (db as any)
      .selectFrom('zv_document_templates')
      .select(['content', 'style_config', 'variables', 'version_number'])
      .where('id', '=', templateId)
      .executeTakeFirst();

    if (current) {
      const maxVersionResult = await (db as any)
        .selectFrom('zv_document_template_versions')
        .select((eb: any) => eb.fn.max('version_number').as('max_version'))
        .where('template_id', '=', templateId)
        .executeTakeFirst();

      const nextVersion = (Number(maxVersionResult?.max_version || 0)) + 1;

      await (db as any)
        .insertInto('zv_document_template_versions')
        .values({
          template_id: templateId,
          version_number: nextVersion,
          html_body: current.content || '',
          css_styles: null,
          variables: JSON.stringify(
            typeof current.variables === 'string'
              ? JSON.parse(current.variables)
              : current.variables || {}
          ),
          change_notes: `Auto-snapshot before restore to v${versionNumber}`,
          created_by: user.id,
        })
        .execute();
    }

    // Restore to the requested version
    const template = await (db as any)
      .updateTable('zv_document_templates')
      .set({
        content: version.html_body,
        variables: JSON.stringify(
          typeof version.variables === 'string'
            ? JSON.parse(version.variables)
            : version.variables || {}
        ),
        updated_at: new Date(),
      })
      .where('id', '=', templateId)
      .returningAll()
      .executeTakeFirst();

    return c.json({ template, restored_from_version: versionNumber });
  });

  return app;
}
