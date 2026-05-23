import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

async function nextQuoteNumber(db: any): Promise<string> {
  const row = await sql`SELECT COUNT(*) as cnt FROM zvd_quotes`.execute(db);
  const n = parseInt((row.rows[0] as any).cnt) + 1;
  return `QUO-${String(n).padStart(5, '0')}`;
}

async function saveRevision(db: any, quoteId: string, userId: string, changeNote: string | null) {
  const quote = await sql`
    SELECT q.*, json_agg(l.* ORDER BY l.sort_order) as lines
    FROM zvd_quotes q LEFT JOIN zvd_quote_lines l ON l.quote_id = q.id
    WHERE q.id = ${quoteId} GROUP BY q.id
  `.execute(db);
  if (!quote.rows.length) return;
  const rev = await sql`SELECT COALESCE(MAX(revision_number), 0) as max FROM zvd_quote_revisions WHERE quote_id = ${quoteId}`.execute(db);
  await sql`
    INSERT INTO zvd_quote_revisions (quote_id, revision_number, snapshot, change_note, created_by)
    VALUES (${quoteId}, ${+(rev.rows[0] as any).max + 1}, ${JSON.stringify(quote.rows[0])}, ${changeNote ?? null}, ${userId})
  `.execute(db);
}

export function quotesRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  // Public token route — no auth
  app.get('/public/:token', async (c) => {
    const token = c.req.param('token');
    const qt = await sql`
      SELECT qt.*, q.* FROM zvd_quote_tokens qt
      JOIN zvd_quotes q ON q.id = qt.quote_id
      WHERE qt.token = ${token}
        AND (qt.expires_at IS NULL OR qt.expires_at > NOW())
    `.execute(db);
    if (!qt.rows.length) return c.json({ error: 'Quote link not found or expired' }, 404);
    const quoteId = (qt.rows[0] as any).quote_id;
    await sql`UPDATE zvd_quote_tokens SET viewed_at = COALESCE(viewed_at, NOW()), view_count = view_count + 1 WHERE token = ${token}`.execute(db);
    const lines = await sql`SELECT * FROM zvd_quote_lines WHERE quote_id = ${quoteId} ORDER BY sort_order`.execute(db);
    return c.json({ data: { ...(qt.rows[0] as any), lines: lines.rows } });
  });

  app.use('*', async (c, next) => {
    if (c.req.path.startsWith('/public/')) return next();
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  app.use('*', permissionGate(ctx, 'quotes'));

  app.get('/', async (c) => {
    const { limit = '50', page = '1', status } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT q.*,
        COALESCE(json_agg(json_build_object(
          'id', l.id, 'description', l.description, 'quantity', l.quantity,
          'unit_price', l.unit_price, 'tax_rate', l.tax_rate, 'discount', l.discount, 'total', l.total
        ) ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_quotes q
      LEFT JOIN zvd_quote_lines l ON l.quote_id = q.id
      WHERE (${status ? sql`q.status = ${status}` : sql`TRUE`})
      GROUP BY q.id
      ORDER BY q.created_at DESC LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'sent') as pending,
        COUNT(*) FILTER (WHERE valid_until < CURRENT_DATE AND status IN ('sent','draft')) as expired,
        COALESCE(SUM(total) FILTER (WHERE status = 'accepted'), 0) as accepted_value,
        ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'accepted') / NULLIF(COUNT(*) FILTER (WHERE status IN ('accepted','rejected')), 0), 1) as win_rate
      FROM zvd_quotes
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  app.get('/:id', async (c) => {
    const row = await sql`
      SELECT q.*, COALESCE(json_agg(l.* ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_quotes q LEFT JOIN zvd_quote_lines l ON l.quote_id = q.id
      WHERE q.id = ${c.req.param('id')} GROUP BY q.id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const revisions = await sql`SELECT id, revision_number, change_note, created_at, created_by FROM zvd_quote_revisions WHERE quote_id = ${c.req.param('id')} ORDER BY revision_number DESC`.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), revisions: revisions.rows } });
  });

  app.post('/', zValidator('json', z.object({
    title: z.string().min(1),
    contact_id: z.string().optional(),
    organization_id: z.string().optional(),
    client_name: z.string().min(1),
    client_email: z.string().email().optional(),
    valid_until: z.string(),
    currency: z.string().default('RON'),
    tax_rate: z.number().default(19),
    discount_percent: z.number().min(0).max(100).default(0),
    notes: z.string().optional(),
    terms: z.string().optional(),
    footer_notes: z.string().optional(),
    po_number: z.string().optional(),
    lines: z.array(z.object({
      description: z.string().min(1),
      quantity: z.number().default(1),
      unit_price: z.number().default(0),
      tax_rate: z.number().default(19),
      discount: z.number().default(0),
      sort_order: z.number().default(0),
    })).min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const number = await nextQuoteNumber(db);
    const subtotalGross = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - l.discount / 100), 0);
    const discount_amount = subtotalGross * (d.discount_percent / 100);
    const subtotal = subtotalGross - discount_amount;
    const tax_amount = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - l.discount / 100) * (1 - d.discount_percent / 100) * l.tax_rate / 100, 0);
    const total = subtotal + tax_amount;
    const q = await sql`
      INSERT INTO zvd_quotes (number, title, contact_id, organization_id, client_name, client_email,
        valid_until, currency, subtotal, tax_rate, tax_amount, total, discount_percent, discount_amount,
        notes, terms, footer_notes, po_number, created_by)
      VALUES (${number}, ${d.title}, ${d.contact_id ?? null}, ${d.organization_id ?? null},
        ${d.client_name}, ${d.client_email ?? null}, ${d.valid_until}, ${d.currency},
        ${subtotal}, ${d.tax_rate}, ${tax_amount}, ${total}, ${d.discount_percent}, ${discount_amount},
        ${d.notes ?? null}, ${d.terms ?? null}, ${d.footer_notes ?? null}, ${d.po_number ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    const qId = (q.rows[0] as any).id;
    for (const line of d.lines) {
      const lineTotal = line.quantity * line.unit_price * (1 - line.discount / 100) * (1 - d.discount_percent / 100) * (1 + line.tax_rate / 100);
      await sql`INSERT INTO zvd_quote_lines (quote_id, description, quantity, unit_price, tax_rate, discount, total, sort_order)
        VALUES (${qId}, ${line.description}, ${line.quantity}, ${line.unit_price}, ${line.tax_rate}, ${line.discount}, ${lineTotal}, ${line.sort_order})
      `.execute(db);
    }
    return c.json({ data: q.rows[0] }, 201);
  });

  // Edit quote (creates revision)
  app.patch('/:id', zValidator('json', z.object({
    title: z.string().optional(),
    client_name: z.string().optional(),
    client_email: z.string().email().optional(),
    valid_until: z.string().optional(),
    notes: z.string().optional(),
    terms: z.string().optional(),
    footer_notes: z.string().optional(),
    change_note: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const existing = await sql`SELECT * FROM zvd_quotes WHERE id = ${c.req.param('id')} AND status = 'draft'`.execute(db);
    if (!existing.rows.length) return c.json({ error: 'Quote not found or not editable' }, 400);
    await saveRevision(db, c.req.param('id'), user.id, d.change_note ?? null);
    const row = await sql`
      UPDATE zvd_quotes SET
        title = COALESCE(${d.title ?? null}, title),
        client_name = COALESCE(${d.client_name ?? null}, client_name),
        client_email = COALESCE(${d.client_email ?? null}, client_email),
        valid_until = COALESCE(${d.valid_until ?? null}, valid_until),
        notes = COALESCE(${d.notes ?? null}, notes),
        terms = COALESCE(${d.terms ?? null}, terms),
        footer_notes = COALESCE(${d.footer_notes ?? null}, footer_notes),
        revision = revision + 1,
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  // ── Lifecycle ─────────────────────────────────────────────────
  app.post('/:id/request-approval', async (c) => {
    const user = c.get('user') as any;
    const row = await sql`UPDATE zvd_quotes SET approval_status = 'pending', updated_at = NOW() WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Quote not found or not draft' }, 400);
    await sql`INSERT INTO zvd_quote_approvals (quote_id, requested_by) VALUES (${c.req.param('id')}, ${user.id})`.execute(db);
    return c.json({ data: row.rows[0] });
  });

  app.post('/:id/approve-internal', async (c) => {
    const user = c.get('user') as any;
    await sql`UPDATE zvd_quote_approvals SET status = 'approved', approved_by = ${user.id}, approved_at = NOW() WHERE quote_id = ${c.req.param('id')} AND status = 'pending'`.execute(db);
    const row = await sql`UPDATE zvd_quotes SET approval_status = 'approved', updated_at = NOW() WHERE id = ${c.req.param('id')} RETURNING *`.execute(db);
    return c.json({ data: row.rows[0] });
  });

  app.post('/:id/send', async (c) => {
    const row = await sql`UPDATE zvd_quotes SET status='sent', updated_at=NOW() WHERE id=${c.req.param('id')} AND status='draft' RETURNING *`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Quote not found or not in draft' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/:id/accept', async (c) => {
    const row = await sql`UPDATE zvd_quotes SET status='accepted', updated_at=NOW() WHERE id=${c.req.param('id')} AND status='sent' RETURNING *`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Quote not found or not sent' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/:id/reject', async (c) => {
    const row = await sql`UPDATE zvd_quotes SET status='rejected', updated_at=NOW() WHERE id=${c.req.param('id')} RETURNING *`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Public token ──────────────────────────────────────────────
  app.post('/:id/generate-link', zValidator('json', z.object({
    expires_days: z.number().int().positive().default(30),
  })), async (c) => {
    const { expires_days } = c.req.valid('json');
    const expiresAt = new Date(Date.now() + expires_days * 86400000).toISOString();
    const row = await sql`
      INSERT INTO zvd_quote_tokens (quote_id, expires_at)
      VALUES (${c.req.param('id')}, ${expiresAt})
      ON CONFLICT (quote_id) DO UPDATE SET expires_at = EXCLUDED.expires_at
      RETURNING token, expires_at
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  app.post('/:id/revoke-link', async (c) => {
    await sql`DELETE FROM zvd_quote_tokens WHERE quote_id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  app.get('/:id/revisions', async (c) => {
    const rows = await sql`
      SELECT * FROM zvd_quote_revisions WHERE quote_id = ${c.req.param('id')} ORDER BY revision_number DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/:id/convert-to-invoice', async (c) => {
    const quote = await sql`SELECT * FROM zvd_quotes WHERE id=${c.req.param('id')} AND status='accepted'`.execute(db);
    if (!quote.rows.length) return c.json({ error: 'Quote not found or not accepted' }, 400);
    const q = quote.rows[0] as any;
    const invoiceNumber = `INV-Q-${q.number}`;
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const inv = await sql`
      INSERT INTO zvd_invoices (number, client_id, client_name, client_email, due_date, currency, subtotal, tax_rate, tax_amount, total, discount_amount, discount_percent, notes, created_by)
      VALUES (${invoiceNumber}, ${q.contact_id ?? q.organization_id}, ${q.client_name}, ${q.client_email},
        ${dueDate}, ${q.currency}, ${q.subtotal}, ${q.tax_rate}, ${q.tax_amount}, ${q.total},
        ${q.discount_amount}, ${q.discount_percent}, ${q.notes}, ${q.created_by})
      RETURNING *
    `.execute(db);
    const invId = (inv.rows[0] as any).id;
    const lines = await sql`SELECT * FROM zvd_quote_lines WHERE quote_id = ${q.id}`.execute(db);
    for (const line of lines.rows as any[]) {
      await sql`INSERT INTO zvd_invoice_lines (invoice_id, description, quantity, unit_price, tax_rate, total, sort_order)
        VALUES (${invId}, ${line.description}, ${line.quantity}, ${line.unit_price}, ${line.tax_rate}, ${line.total}, ${line.sort_order})`.execute(db);
    }
    await sql`UPDATE zvd_quotes SET converted_to_invoice_id=${invId}, updated_at=NOW() WHERE id=${q.id}`.execute(db);
    return c.json({ data: inv.rows[0] }, 201);
  });

  app.delete('/:id', async (c) => {
    const row = await sql`DELETE FROM zvd_quotes WHERE id=${c.req.param('id')} AND status NOT IN ('accepted') RETURNING id`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Cannot delete an accepted quote' }, 400);
    return c.json({ success: true });
  });

  return app;
}
