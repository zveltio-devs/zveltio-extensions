/**
 * Documents Management — Enterprise Edition
 *
 * GET    /api/documents/templates                    — list active templates
 * POST   /api/documents/generate/:templateId         — generate document with auto doc number
 * GET    /api/documents/generated                    — list generated docs (filters + pagination)
 * GET    /api/documents/generated/:id                — get doc details with sign requests
 * DELETE /api/documents/generated/:id                — revoke document (admin only)
 * POST   /api/documents/generated/:id/sign-request   — create sign request
 * GET    /api/documents/generated/:id/sign-requests  — list sign requests
 * POST   /api/documents/sign/:token                  — public: sign a document
 * GET    /api/documents/share/:token                 — public: view by share token
 * GET    /api/documents/sequences                    — list number sequences (admin)
 * POST   /api/documents/sequences                    — create/update sequence (admin)
 * GET    /api/documents/stats                        — stats summary
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { Database } from '../../../../packages/engine/src/db/index.js';
import { auth } from '../../../../packages/engine/src/lib/auth.js';
import { checkPermission } from '../../../../packages/engine/src/lib/permissions.js';
import { renderTemplate, generatePDF } from '../../../../packages/engine/src/lib/doc-generator.js';

// ── Schemas ───────────────────────────────────────────────────────────────────

const GenerateDocSchema = z.object({
  variables_data: z.record(z.string(), z.any()).optional().default({}),
  source_record_id: z.string().uuid().optional(),
  source_collection: z.string().optional(),
  output_format: z.enum(['pdf', 'html']).default('pdf'),
  expires_hours: z.number().int().positive().optional(),
});

const SignRequestSchema = z.object({
  signer_email: z.string().email(),
  signer_name: z.string().min(1),
  message: z.string().optional(),
  expires_hours: z.number().int().positive().default(168),
});

const SequenceSchema = z.object({
  template_id: z.string().uuid(),
  prefix: z.string().min(1).max(20),
  year_reset: z.boolean().default(true),
});

// ── Helper: get or generate next doc number ───────────────────────────────────

async function getNextDocNumber(db: Database, templateId: string, prefix: string): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();

  const seq = await (db as any)
    .selectFrom('zv_document_number_sequences')
    .selectAll()
    .where('template_id', '=', templateId)
    .executeTakeFirst();

  if (!seq) {
    // Create initial sequence
    await (db as any)
      .insertInto('zv_document_number_sequences')
      .values({
        template_id: templateId,
        prefix,
        next_number: 2,
        year_reset: true,
        reset_year: year,
      })
      .execute();
    return `${prefix}-${year}-0001`;
  }

  // Check year reset
  let nextNumber = seq.next_number;
  if (seq.year_reset && seq.reset_year !== year) {
    nextNumber = 1;
    await (db as any)
      .updateTable('zv_document_number_sequences')
      .set({ next_number: 2, reset_year: year, updated_at: new Date() })
      .where('template_id', '=', templateId)
      .execute();
  } else {
    await (db as any)
      .updateTable('zv_document_number_sequences')
      .set({ next_number: nextNumber + 1, updated_at: new Date() })
      .where('template_id', '=', templateId)
      .execute();
  }

  const padded = String(nextNumber).padStart(4, '0');
  return seq.year_reset ? `${seq.prefix}-${year}-${padded}` : `${seq.prefix}-${padded}`;
}

// ── Route factory ─────────────────────────────────────────────────────────────

export function documentsRoutes(db: Database, _auth: any): Hono {
  const app = new Hono<{ Variables: { user: any } }>();

  // Auth middleware (skipped for public routes below)
  const requireAuth = async (c: any, next: any) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    return next();
  };

  // ── Public routes (no auth) ──────────────────────────────────────────────────

  // POST /sign/:token — sign a document
  app.post('/sign/:token', async (c) => {
    const token = c.req.param('token');
    const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';

    const signReq = await (db as any)
      .selectFrom('zv_document_sign_requests')
      .selectAll()
      .where('sign_token', '=', token)
      .executeTakeFirst();

    if (!signReq) return c.json({ error: 'Invalid or expired sign token' }, 404);
    if (signReq.status !== 'pending') return c.json({ error: `Request already ${signReq.status}` }, 400);
    if (new Date(signReq.expires_at) < new Date()) {
      await (db as any)
        .updateTable('zv_document_sign_requests')
        .set({ status: 'expired' })
        .where('id', '=', signReq.id)
        .execute();
      return c.json({ error: 'Sign token has expired' }, 410);
    }

    await (db as any)
      .updateTable('zv_document_sign_requests')
      .set({ status: 'signed', signed_at: new Date(), ip_address: ip })
      .where('id', '=', signReq.id)
      .execute();

    // Update document is_signed flag
    await (db as any)
      .updateTable('zv_generated_docs')
      .set({ is_signed: true })
      .where('id', '=', signReq.document_id)
      .execute();

    // Log access
    await (db as any)
      .insertInto('zv_document_access_log')
      .values({ document_id: signReq.document_id, ip, action: 'sign' })
      .execute();

    return c.json({ success: true, signed_at: new Date() });
  });

  // GET /share/:token — view document metadata by share token
  app.get('/share/:token', async (c) => {
    const token = c.req.param('token');
    const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';

    const doc = await (db as any)
      .selectFrom('zv_generated_docs')
      .select(['id', 'template_name', 'document_number', 'output_format', 'generated_at', 'status', 'is_signed', 'expires_at'])
      .where('share_token', '=', token)
      .where('status', '=', 'active')
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found or has been revoked' }, 404);

    if (doc.expires_at && new Date(doc.expires_at) < new Date()) {
      return c.json({ error: 'Document has expired' }, 410);
    }

    // Log access
    await (db as any)
      .insertInto('zv_document_access_log')
      .values({ document_id: doc.id, ip, action: 'view' })
      .execute();

    return c.json({ document: doc });
  });

  // ── Authenticated routes ─────────────────────────────────────────────────────

  app.use('/templates', requireAuth);
  app.use('/templates/*', requireAuth);
  app.use('/generate/*', requireAuth);
  app.use('/generated', requireAuth);
  app.use('/generated/*', requireAuth);
  app.use('/sequences', requireAuth);
  app.use('/sequences/*', requireAuth);
  app.use('/stats', requireAuth);

  // GET /templates — list active templates
  app.get('/templates', async (c) => {
    const templates = await (db as any)
      .selectFrom('zv_document_templates')
      .select(['id', 'name', 'description', 'category', 'variables', 'pdf_options'])
      .where('is_active', '=', true)
      .orderBy('name', 'asc')
      .execute();
    return c.json({ templates });
  });

  // POST /generate/:templateId — generate document
  app.post('/generate/:templateId', zValidator('json', GenerateDocSchema), async (c) => {
    const user = c.get('user');
    const templateId = c.req.param('templateId');
    const data = c.req.valid('json');

    const template = await (db as any)
      .selectFrom('zv_document_templates')
      .selectAll()
      .where('id', '=', templateId)
      .where('is_active', '=', true)
      .executeTakeFirst();

    if (!template) return c.json({ error: 'Template not found or inactive' }, 404);

    // Generate document number via sequence
    const seqData = await (db as any)
      .selectFrom('zv_document_number_sequences')
      .selectAll()
      .where('template_id', '=', templateId)
      .executeTakeFirst();

    const prefix = seqData?.prefix || template.category || 'DOC';
    const docNumber = await getNextDocNumber(db, templateId, prefix);

    const allVariables = {
      ...data.variables_data,
      _document_number: docNumber,
      _generated_at: new Date().toLocaleDateString('ro-RO'),
      _generated_by: user.name || user.id,
    };

    const htmlBody = typeof template.html_body === 'string' ? template.html_body : '';
    const htmlContent = renderTemplate(htmlBody, allVariables);
    const pdfBuffer = await generatePDF(htmlContent, { title: `${template.name} ${docNumber}` });

    const expiresAt = data.expires_hours
      ? new Date(Date.now() + data.expires_hours * 3600 * 1000)
      : null;

    const doc = await (db as any)
      .insertInto('zv_generated_docs')
      .values({
        template_id: templateId,
        template_name: template.name,
        source_collection: data.source_collection || null,
        source_record_id: data.source_record_id || null,
        variables_used: JSON.stringify(allVariables),
        output_format: data.output_format,
        document_number: docNumber,
        generated_by: user.id,
        expires_at: expiresAt,
        status: 'active',
      })
      .returningAll()
      .executeTakeFirst();

    // Increment template usage
    await (db as any)
      .updateTable('zv_document_templates')
      .set({
        usage_count: sql`usage_count + 1`,
        last_used_at: new Date(),
      })
      .where('id', '=', templateId)
      .execute();

    if (data.output_format === 'pdf') {
      const filename = `${template.name.replace(/\s/g, '_')}_${docNumber.replace(/\//g, '-')}.pdf`;
      c.header('Content-Type', 'application/pdf');
      c.header('Content-Disposition', `attachment; filename="${filename}"`);
      c.header('X-Document-Id', doc.id);
      c.header('X-Document-Number', docNumber);
      return c.body(new Uint8Array(pdfBuffer));
    }

    return c.json({ document: doc, html: htmlContent }, 201);
  });

  // GET /generated — list generated docs
  app.get('/generated', async (c) => {
    const { template_id, source_collection, source_record_id, status, limit = '50', offset = '0' } = c.req.query();

    let query = (db as any)
      .selectFrom('zv_generated_docs')
      .selectAll()
      .orderBy('generated_at', 'desc');

    if (template_id) query = query.where('template_id', '=', template_id);
    if (source_collection) query = query.where('source_collection', '=', source_collection);
    if (source_record_id) query = query.where('source_record_id', '=', source_record_id);
    if (status) query = query.where('status', '=', status);

    const docs = await query.limit(Number(limit)).offset(Number(offset)).execute();

    const countResult = await (db as any)
      .selectFrom('zv_generated_docs')
      .select((eb: any) => eb.fn.count('id').as('count'))
      .executeTakeFirst();

    return c.json({
      documents: docs,
      pagination: { total: Number(countResult?.count || 0), limit: Number(limit), offset: Number(offset) },
    });
  });

  // GET /generated/:id — doc details with sign requests
  app.get('/generated/:id', async (c) => {
    const id = c.req.param('id');

    const doc = await (db as any)
      .selectFrom('zv_generated_docs')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found' }, 404);

    const signRequests = await (db as any)
      .selectFrom('zv_document_sign_requests')
      .select(['id', 'signer_email', 'signer_name', 'status', 'signed_at', 'expires_at', 'created_at'])
      .where('document_id', '=', id)
      .orderBy('created_at', 'desc')
      .execute();

    return c.json({ document: doc, sign_requests: signRequests });
  });

  // DELETE /generated/:id — revoke (admin only)
  app.delete('/generated/:id', async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');

    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const doc = await (db as any)
      .selectFrom('zv_generated_docs')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found' }, 404);

    await (db as any)
      .updateTable('zv_generated_docs')
      .set({ status: 'revoked' })
      .where('id', '=', id)
      .execute();

    return c.json({ success: true });
  });

  // POST /generated/:id/sign-request
  app.post('/generated/:id/sign-request', zValidator('json', SignRequestSchema), async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const data = c.req.valid('json');

    const doc = await (db as any)
      .selectFrom('zv_generated_docs')
      .select(['id', 'status'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!doc) return c.json({ error: 'Document not found' }, 404);
    if (doc.status !== 'active') return c.json({ error: 'Cannot create sign request for inactive document' }, 400);

    const expiresAt = new Date(Date.now() + data.expires_hours * 3600 * 1000);

    const signReq = await (db as any)
      .insertInto('zv_document_sign_requests')
      .values({
        document_id: id,
        signer_email: data.signer_email,
        signer_name: data.signer_name,
        message: data.message || null,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ sign_request: signReq }, 201);
  });

  // GET /generated/:id/sign-requests
  app.get('/generated/:id/sign-requests', async (c) => {
    const id = c.req.param('id');

    const signRequests = await (db as any)
      .selectFrom('zv_document_sign_requests')
      .selectAll()
      .where('document_id', '=', id)
      .orderBy('created_at', 'desc')
      .execute();

    return c.json({ sign_requests: signRequests });
  });

  // GET /sequences (admin)
  app.get('/sequences', async (c) => {
    const user = c.get('user');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const sequences = await (db as any)
      .selectFrom('zv_document_number_sequences')
      .selectAll()
      .orderBy('updated_at', 'desc')
      .execute();

    return c.json({ sequences });
  });

  // POST /sequences (admin)
  app.post('/sequences', zValidator('json', SequenceSchema), async (c) => {
    const user = c.get('user');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const data = c.req.valid('json');

    const result = await sql<any>`
      INSERT INTO zv_document_number_sequences (template_id, prefix, year_reset)
      VALUES (${data.template_id}, ${data.prefix}, ${data.year_reset})
      ON CONFLICT (template_id) DO UPDATE
        SET prefix = EXCLUDED.prefix,
            year_reset = EXCLUDED.year_reset,
            updated_at = NOW()
      RETURNING *
    `.execute(db);

    return c.json({ sequence: result.rows[0] }, 201);
  });

  // GET /stats
  app.get('/stats', async (c) => {
    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalDocs, docsThisMonth, pendingSigs, byTemplate] = await Promise.all([
      (db as any)
        .selectFrom('zv_generated_docs')
        .select((eb: any) => eb.fn.count('id').as('count'))
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_generated_docs')
        .select((eb: any) => eb.fn.count('id').as('count'))
        .where('generated_at', '>=', firstOfMonth)
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_document_sign_requests')
        .select((eb: any) => eb.fn.count('id').as('count'))
        .where('status', '=', 'pending')
        .executeTakeFirst(),
      (db as any)
        .selectFrom('zv_generated_docs')
        .select(['template_name', (eb: any) => eb.fn.count('id').as('count')])
        .groupBy('template_name')
        .orderBy('count', 'desc')
        .limit(10)
        .execute(),
    ]);

    return c.json({
      total_documents: Number(totalDocs?.count || 0),
      documents_this_month: Number(docsThisMonth?.count || 0),
      pending_signatures: Number(pendingSigs?.count || 0),
      by_template: byTemplate,
    });
  });

  return app;
}
