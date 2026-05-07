import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

async function nextInvoiceNumber(db: any, prefix = 'INV'): Promise<string> {
  const row = await sql`SELECT nextval('zvd_invoice_seq') as n`.execute(db);
  const n = (row.rows[0] as any).n;
  return `${prefix}-${String(n).padStart(5, '0')}`;
}

async function nextCreditNoteNumber(db: any): Promise<string> {
  const row = await sql`SELECT nextval('zvd_credit_note_seq') as n`.execute(db);
  const n = (row.rows[0] as any).n;
  return `CN-${String(n).padStart(5, '0')}`;
}

export function invoicingRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Invoices ──────────────────────────────────────────────────
  app.get('/invoices', async (c) => {
    const { limit = '50', page = '1', status, client_id, overdue_only } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT i.*,
        COALESCE(json_agg(json_build_object(
          'id', l.id, 'description', l.description, 'quantity', l.quantity, 'unit', l.unit,
          'unit_price', l.unit_price, 'tax_rate', l.tax_rate, 'total', l.total, 'metadata', l.metadata
        ) ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lines,
        COALESCE((SELECT SUM(p.amount) FROM zvd_invoice_payments p WHERE p.invoice_id = i.id), 0) as amount_paid_actual
      FROM zvd_invoices i
      LEFT JOIN zvd_invoice_lines l ON l.invoice_id = i.id
      WHERE (${status ? sql`i.status = ${status}` : sql`TRUE`})
        AND (${client_id ? sql`i.client_id = ${client_id}` : sql`TRUE`})
        AND (${overdue_only === 'true' ? sql`i.due_date < CURRENT_DATE AND i.status IN ('sent','overdue')` : sql`TRUE`})
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    const total = await sql`SELECT COUNT(*) as cnt FROM zvd_invoices
      WHERE (${status ? sql`status = ${status}` : sql`TRUE`})`.execute(db);
    return c.json({ data: rows.rows, meta: { total: +(total.rows[0] as any).cnt } });
  });

  app.get('/invoices/stats', async (c) => {
    const row = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status NOT IN ('cancelled')) as total,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as revenue,
        COALESCE(SUM(total - amount_paid) FILTER (WHERE status IN ('sent','overdue')), 0) as outstanding,
        COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
        COALESCE(AVG(EXTRACT(DAYS FROM (paid_at - issue_date))) FILTER (WHERE paid_at IS NOT NULL), 0) as avg_days_to_pay
      FROM zvd_invoices
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  app.get('/invoices/:id', async (c) => {
    const row = await sql`
      SELECT i.*,
        COALESCE(json_agg(json_build_object(
          'id', l.id, 'description', l.description, 'quantity', l.quantity, 'unit', l.unit,
          'unit_price', l.unit_price, 'tax_rate', l.tax_rate, 'total', l.total, 'sort_order', l.sort_order,
          'metadata', l.metadata
        ) ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_invoices i
      LEFT JOIN zvd_invoice_lines l ON l.invoice_id = i.id
      WHERE i.id = ${c.req.param('id')}
      GROUP BY i.id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const payments = await sql`SELECT * FROM zvd_invoice_payments WHERE invoice_id = ${c.req.param('id')} ORDER BY payment_date`.execute(db);
    const reminders = await sql`SELECT * FROM zvd_payment_reminders WHERE invoice_id = ${c.req.param('id')} ORDER BY sent_at DESC`.execute(db);
    return c.json({ data: { ...(row.rows[0] as any), payments: payments.rows, reminders: reminders.rows } });
  });

  app.post('/invoices', zValidator('json', z.object({
    client_id: z.string().optional(),
    client_type: z.enum(['contact','organization']).optional(),
    client_name: z.string().min(1),
    client_email: z.string().email().optional(),
    client_address: z.string().optional(),
    issue_date: z.string().optional(),
    due_date: z.string(),
    currency: z.string().default('RON'),
    tax_rate: z.number().default(19),
    notes: z.string().optional(),
    footer_notes: z.string().optional(),
    po_number: z.string().optional(),
    discount_percent: z.number().min(0).max(100).default(0),
    recurring_interval: z.enum(['monthly','quarterly','yearly']).optional(),
    lines: z.array(z.object({
      description: z.string().min(1),
      quantity: z.number().default(1),
      unit: z.string().optional(),
      unit_price: z.number().default(0),
      tax_rate: z.number().default(19),
      sort_order: z.number().default(0),
      metadata: z.record(z.unknown()).optional(),
    })).min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const number = await nextInvoiceNumber(db);
    const subtotalBeforeDiscount = d.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const discount_amount = subtotalBeforeDiscount * (d.discount_percent / 100);
    const subtotal = subtotalBeforeDiscount - discount_amount;
    const tax_amount = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - d.discount_percent / 100) * l.tax_rate / 100, 0);
    const total = subtotal + tax_amount;
    const inv = await sql`
      INSERT INTO zvd_invoices (number, client_id, client_type, client_name, client_email, client_address,
        issue_date, due_date, currency, subtotal, tax_rate, tax_amount, total, discount_amount, discount_percent,
        notes, footer_notes, po_number, recurring_interval, amount_paid, created_by)
      VALUES (${number}, ${d.client_id ?? null}, ${d.client_type ?? null}, ${d.client_name},
        ${d.client_email ?? null}, ${d.client_address ?? null},
        ${d.issue_date ?? new Date().toISOString().slice(0,10)}, ${d.due_date},
        ${d.currency}, ${subtotal}, ${d.tax_rate}, ${tax_amount}, ${total}, ${discount_amount},
        ${d.discount_percent}, ${d.notes ?? null}, ${d.footer_notes ?? null}, ${d.po_number ?? null},
        ${d.recurring_interval ?? null}, 0, ${user.id})
      RETURNING *
    `.execute(db);
    const invId = (inv.rows[0] as any).id;
    for (const line of d.lines) {
      const lineTotal = line.quantity * line.unit_price * (1 - d.discount_percent / 100) * (1 + line.tax_rate / 100);
      await sql`
        INSERT INTO zvd_invoice_lines (invoice_id, description, quantity, unit, unit_price, tax_rate, total, sort_order, metadata)
        VALUES (${invId}, ${line.description}, ${line.quantity}, ${line.unit ?? null}, ${line.unit_price}, ${line.tax_rate}, ${lineTotal}, ${line.sort_order}, ${JSON.stringify(line.metadata ?? {})}::jsonb)
      `.execute(db);
    }

    // Notify other extensions — generic event, invoicing does not know who listens
    ctx.events.emit('record.created', {
      collection: 'zvd_invoices',
      record: inv.rows[0],
      id: invId,
      userId: user.id,
    });

    return c.json({ data: inv.rows[0] }, 201);
  });

  app.patch('/invoices/:id', zValidator('json', z.object({
    client_name: z.string().optional(),
    client_email: z.string().email().optional(),
    client_address: z.string().optional(),
    due_date: z.string().optional(),
    notes: z.string().optional(),
    footer_notes: z.string().optional(),
    po_number: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_invoices SET
        client_name = COALESCE(${d.client_name ?? null}, client_name),
        client_email = COALESCE(${d.client_email ?? null}, client_email),
        client_address = COALESCE(${d.client_address ?? null}, client_address),
        due_date = COALESCE(${d.due_date ?? null}, due_date),
        notes = COALESCE(${d.notes ?? null}, notes),
        footer_notes = COALESCE(${d.footer_notes ?? null}, footer_notes),
        po_number = COALESCE(${d.po_number ?? null}, po_number),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found or not editable (must be draft)' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Lifecycle actions ─────────────────────────────────────────
  app.post('/invoices/:id/send', async (c) => {
    const row = await sql`
      UPDATE zvd_invoices SET status = 'sent', updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Invoice not found or not in draft' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Partial payments ──────────────────────────────────────────
  app.post('/invoices/:id/payments', zValidator('json', z.object({
    amount: z.number().positive(),
    payment_date: z.string(),
    payment_method: z.enum(['cash','card','transfer','check','other']).default('transfer'),
    reference: z.string().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const inv = await sql`SELECT * FROM zvd_invoices WHERE id = ${c.req.param('id')} AND status IN ('sent','overdue','partially_paid')`.execute(db);
    if (!inv.rows.length) return c.json({ error: 'Invoice not found or not payable' }, 400);
    const invoice = inv.rows[0] as any;
    if (d.amount > invoice.total - invoice.amount_paid) {
      return c.json({ error: `Payment exceeds outstanding amount (${invoice.total - invoice.amount_paid})` }, 400);
    }
    const payment = await sql`
      INSERT INTO zvd_invoice_payments (invoice_id, amount, payment_date, payment_method, reference, notes, created_by)
      VALUES (${invoice.id}, ${d.amount}, ${d.payment_date}, ${d.payment_method}, ${d.reference ?? null}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    const newPaid = +invoice.amount_paid + d.amount;
    const newStatus = newPaid >= invoice.total ? 'paid' : 'partially_paid';
    await sql`
      UPDATE zvd_invoices SET amount_paid = ${newPaid}, status = ${newStatus},
        paid_at = ${newStatus === 'paid' ? sql`NOW()` : sql`paid_at`}, updated_at = NOW()
      WHERE id = ${invoice.id}
    `.execute(db);
    return c.json({ data: payment.rows[0] }, 201);
  });

  app.post('/invoices/:id/pay', async (c) => {
    const row = await sql`
      UPDATE zvd_invoices SET status = 'paid', paid_at = NOW(), amount_paid = total, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status IN ('sent','overdue','partially_paid') RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Invoice not found or not payable' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/invoices/:id/cancel', async (c) => {
    const row = await sql`
      UPDATE zvd_invoices SET status = 'cancelled', updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status NOT IN ('paid','cancelled') RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Cannot cancel this invoice' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Payment reminders ─────────────────────────────────────────
  app.post('/invoices/:id/reminders', zValidator('json', z.object({
    reminder_type: z.enum(['gentle','firm','final']).default('gentle'),
    channel: z.enum(['email','sms','manual']).default('email'),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const inv = await sql`SELECT id, status, due_date, client_email FROM zvd_invoices WHERE id = ${c.req.param('id')}`.execute(db);
    if (!inv.rows.length) return c.json({ error: 'Not found' }, 404);
    const row = await sql`
      INSERT INTO zvd_payment_reminders (invoice_id, reminder_type, channel, notes)
      VALUES (${c.req.param('id')}, ${d.reminder_type}, ${d.channel}, ${d.notes ?? null})
      RETURNING *
    `.execute(db);
    // TODO: trigger email via mail extension when channel = 'email'
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Recurring invoice generation ──────────────────────────────
  app.post('/invoices/:id/generate-next', async (c) => {
    const user = c.get('user') as any;
    const inv = await sql`SELECT * FROM zvd_invoices WHERE id = ${c.req.param('id')} AND recurring_interval IS NOT NULL`.execute(db);
    if (!inv.rows.length) return c.json({ error: 'Invoice not found or not recurring' }, 400);
    const i = inv.rows[0] as any;
    const lines = await sql`SELECT * FROM zvd_invoice_lines WHERE invoice_id = ${i.id}`.execute(db);
    const newIssue = new Date(i.due_date);
    newIssue.setDate(newIssue.getDate() + 1);
    const newDue = new Date(newIssue);
    if (i.recurring_interval === 'monthly') newDue.setMonth(newDue.getMonth() + 1);
    else if (i.recurring_interval === 'quarterly') newDue.setMonth(newDue.getMonth() + 3);
    else newDue.setFullYear(newDue.getFullYear() + 1);
    const number = await nextInvoiceNumber(db);
    const newInv = await sql`
      INSERT INTO zvd_invoices (number, client_id, client_type, client_name, client_email, client_address,
        issue_date, due_date, currency, subtotal, tax_rate, tax_amount, total, discount_amount, discount_percent,
        notes, footer_notes, recurring_interval, amount_paid, created_by)
      VALUES (${number}, ${i.client_id}, ${i.client_type}, ${i.client_name}, ${i.client_email}, ${i.client_address},
        ${newIssue.toISOString().slice(0,10)}, ${newDue.toISOString().slice(0,10)},
        ${i.currency}, ${i.subtotal}, ${i.tax_rate}, ${i.tax_amount}, ${i.total},
        ${i.discount_amount}, ${i.discount_percent}, ${i.notes}, ${i.footer_notes}, ${i.recurring_interval}, 0, ${user.id})
      RETURNING *
    `.execute(db);
    const newId = (newInv.rows[0] as any).id;
    for (const line of lines.rows as any[]) {
      await sql`INSERT INTO zvd_invoice_lines (invoice_id, description, quantity, unit_price, tax_rate, total, sort_order)
        VALUES (${newId}, ${line.description}, ${line.quantity}, ${line.unit_price}, ${line.tax_rate}, ${line.total}, ${line.sort_order})
      `.execute(db);
    }
    return c.json({ data: newInv.rows[0] }, 201);
  });

  // ── Credit Notes ──────────────────────────────────────────────
  app.get('/credit-notes', async (c) => {
    const rows = await sql`
      SELECT cn.*,
        COALESCE(json_agg(l.* ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_credit_notes cn
      LEFT JOIN zvd_credit_note_lines l ON l.credit_note_id = cn.id
      GROUP BY cn.id ORDER BY cn.created_at DESC
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/credit-notes', zValidator('json', z.object({
    original_invoice_id: z.string().uuid().optional(),
    client_name: z.string().min(1),
    client_email: z.string().email().optional(),
    reason: z.string().min(1),
    issue_date: z.string().optional(),
    currency: z.string().default('RON'),
    lines: z.array(z.object({
      description: z.string().min(1),
      quantity: z.number().default(1),
      unit_price: z.number().default(0),
      tax_rate: z.number().default(19),
    })).min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const number = await nextCreditNoteNumber(db);
    const subtotal = d.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const tax_amount = d.lines.reduce((s, l) => s + l.quantity * l.unit_price * l.tax_rate / 100, 0);
    const total = subtotal + tax_amount;
    const cn = await sql`
      INSERT INTO zvd_credit_notes (number, original_invoice_id, client_name, client_email, reason,
        issue_date, currency, subtotal, tax_amount, total, created_by)
      VALUES (${number}, ${d.original_invoice_id ?? null}, ${d.client_name}, ${d.client_email ?? null},
        ${d.reason}, ${d.issue_date ?? new Date().toISOString().slice(0,10)},
        ${d.currency}, ${subtotal}, ${tax_amount}, ${total}, ${user.id})
      RETURNING *
    `.execute(db);
    const cnId = (cn.rows[0] as any).id;
    let sort = 0;
    for (const line of d.lines) {
      const lineTotal = line.quantity * line.unit_price * (1 + line.tax_rate / 100);
      await sql`INSERT INTO zvd_credit_note_lines (credit_note_id, description, quantity, unit_price, tax_rate, total, sort_order)
        VALUES (${cnId}, ${line.description}, ${line.quantity}, ${line.unit_price}, ${line.tax_rate}, ${lineTotal}, ${sort++})
      `.execute(db);
    }
    return c.json({ data: cn.rows[0] }, 201);
  });

  app.post('/credit-notes/:id/issue', async (c) => {
    const row = await sql`UPDATE zvd_credit_notes SET status = 'issued', updated_at = NOW() WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *`.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found or not draft' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // Apply credit note against an invoice
  app.post('/credit-notes/:id/apply', zValidator('json', z.object({
    invoice_id: z.string().uuid(),
  })), async (c) => {
    const { invoice_id } = c.req.valid('json');
    const cn = await sql`SELECT * FROM zvd_credit_notes WHERE id = ${c.req.param('id')} AND status = 'issued'`.execute(db);
    if (!cn.rows.length) return c.json({ error: 'Credit note not found or not issued' }, 400);
    const inv = await sql`SELECT * FROM zvd_invoices WHERE id = ${invoice_id}`.execute(db);
    if (!inv.rows.length) return c.json({ error: 'Invoice not found' }, 404);
    const credit = cn.rows[0] as any;
    const invoice = inv.rows[0] as any;
    const applied = Math.min(credit.total, invoice.total - invoice.amount_paid);
    const newPaid = +invoice.amount_paid + applied;
    const newStatus = newPaid >= invoice.total ? 'paid' : 'partially_paid';
    await sql`UPDATE zvd_invoices SET amount_paid = ${newPaid}, status = ${newStatus}, updated_at = NOW() WHERE id = ${invoice_id}`.execute(db);
    await sql`UPDATE zvd_credit_notes SET status = 'applied', updated_at = NOW() WHERE id = ${credit.id}`.execute(db);
    return c.json({ data: { applied_amount: applied, invoice_status: newStatus } });
  });

  // ── PDF / HTML export ─────────────────────────────────────────
  app.get('/invoices/:id/html', async (c) => {
    const row = await sql`
      SELECT i.*,
        COALESCE(json_agg(json_build_object(
          'description', l.description, 'quantity', l.quantity,
          'unit_price', l.unit_price, 'tax_rate', l.tax_rate, 'total', l.total
        ) ORDER BY l.sort_order) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_invoices i LEFT JOIN zvd_invoice_lines l ON l.invoice_id = i.id
      WHERE i.id = ${c.req.param('id')} GROUP BY i.id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    const inv = row.rows[0] as any;
    const lines = JSON.parse(typeof inv.lines === 'string' ? inv.lines : JSON.stringify(inv.lines));
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:Arial,sans-serif;margin:40px;color:#333}
table{width:100%;border-collapse:collapse;margin-top:20px}
th,td{padding:8px 12px;border:1px solid #ddd;text-align:left}
th{background:#f5f5f5}.total-row{font-weight:bold}
.header{display:flex;justify-content:space-between}.meta{margin-top:20px}</style></head>
<body>
<div class="header">
  <h1>FACTURA ${inv.number}</h1>
  <div><strong>Data emiterii:</strong> ${inv.issue_date}<br>
  <strong>Scadentă:</strong> ${inv.due_date}</div>
</div>
<div class="meta">
  <strong>Către:</strong> ${inv.client_name}${inv.client_address ? '<br>' + inv.client_address : ''}
  ${inv.client_email ? '<br>' + inv.client_email : ''}
  ${inv.po_number ? '<br><strong>Nr. comandă:</strong> ' + inv.po_number : ''}
</div>
<table>
  <thead><tr><th>Descriere</th><th>Cantitate</th><th>Preț unitar</th><th>TVA %</th><th>Total</th></tr></thead>
  <tbody>
  ${lines.map((l: any) => `<tr><td>${l.description}</td><td>${l.quantity}</td><td>${(+l.unit_price).toFixed(2)} ${inv.currency}</td><td>${l.tax_rate}%</td><td>${(+l.total).toFixed(2)} ${inv.currency}</td></tr>`).join('')}
  </tbody>
  <tfoot>
    <tr><td colspan="4">Subtotal</td><td>${(+inv.subtotal).toFixed(2)} ${inv.currency}</td></tr>
    <tr><td colspan="4">TVA</td><td>${(+inv.tax_amount).toFixed(2)} ${inv.currency}</td></tr>
    ${inv.discount_amount > 0 ? `<tr><td colspan="4">Reducere (${inv.discount_percent}%)</td><td>-${(+inv.discount_amount).toFixed(2)} ${inv.currency}</td></tr>` : ''}
    <tr class="total-row"><td colspan="4"><strong>TOTAL</strong></td><td><strong>${(+inv.total).toFixed(2)} ${inv.currency}</strong></td></tr>
  </tfoot>
</table>
${inv.notes ? `<p><strong>Notițe:</strong> ${inv.notes}</p>` : ''}
${inv.footer_notes ? `<p style="font-size:12px;color:#666">${inv.footer_notes}</p>` : ''}
</body></html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  });

  // ── Overdue detection & Stats ─────────────────────────────────
  app.post('/invoices/mark-overdue', async (c) => {
    const row = await sql`
      UPDATE zvd_invoices SET status = 'overdue', updated_at = NOW()
      WHERE due_date < CURRENT_DATE AND status = 'sent'
      RETURNING id
    `.execute(db);
    return c.json({ data: { marked: row.rows.length } });
  });

  app.delete('/invoices/:id', async (c) => {
    const existing = await sql`SELECT status FROM zvd_invoices WHERE id = ${c.req.param('id')}`.execute(db);
    if (!existing.rows.length) return c.json({ error: 'Not found' }, 404);
    if ((existing.rows[0] as any).status === 'paid') return c.json({ error: 'Cannot delete a paid invoice' }, 400);
    await sql`DELETE FROM zvd_invoices WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  return app;
}
