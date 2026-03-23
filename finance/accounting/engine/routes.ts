import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function accountingRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Chart of Accounts ────────────────────────────────────────
  app.get('/accounts', async (c) => {
    const rows = await sql`
      SELECT a.*, p.name as parent_name
      FROM zvd_accounts a
      LEFT JOIN zvd_accounts p ON p.id = a.parent_id
      ORDER BY a.code
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/accounts', zValidator('json', z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1),
    type: z.enum(['asset','liability','equity','revenue','expense']),
    parent_id: z.string().uuid().optional(),
    description: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_accounts (code, name, type, parent_id, description, created_by)
      VALUES (${d.code}, ${d.name}, ${d.type}, ${d.parent_id ?? null}, ${d.description ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/accounts/:id', zValidator('json', z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_accounts SET
        name = COALESCE(${d.name ?? null}, name),
        description = COALESCE(${d.description ?? null}, description),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/accounts/:id', async (c) => {
    await sql`DELETE FROM zvd_accounts WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Journal Entries ──────────────────────────────────────────
  app.get('/journal', async (c) => {
    const { limit = '50', page = '1', status } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT e.*,
        COALESCE(json_agg(json_build_object(
          'id', l.id, 'account_id', l.account_id,
          'debit', l.debit, 'credit', l.credit, 'description', l.description,
          'account_name', a.name, 'account_code', a.code
        )) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_journal_entries e
      LEFT JOIN zvd_journal_lines l ON l.entry_id = e.id
      LEFT JOIN zvd_accounts a ON a.id = l.account_id
      WHERE (${status ? sql`e.status = ${status}` : sql`TRUE`})
      GROUP BY e.id
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/journal', zValidator('json', z.object({
    date: z.string(),
    description: z.string().min(1),
    reference: z.string().optional(),
    lines: z.array(z.object({
      account_id: z.string().uuid(),
      debit: z.number().min(0).default(0),
      credit: z.number().min(0).default(0),
      description: z.string().optional(),
    })).min(2),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const totalDebit = d.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = d.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return c.json({ error: 'Journal entry is not balanced (debits must equal credits)' }, 400);
    }
    const entry = await sql`
      INSERT INTO zvd_journal_entries (date, description, reference, created_by)
      VALUES (${d.date}, ${d.description}, ${d.reference ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    const entryId = (entry.rows[0] as any).id;
    for (const line of d.lines) {
      await sql`
        INSERT INTO zvd_journal_lines (entry_id, account_id, debit, credit, description)
        VALUES (${entryId}, ${line.account_id}, ${line.debit}, ${line.credit}, ${line.description ?? null})
      `.execute(db);
    }
    return c.json({ data: entry.rows[0] }, 201);
  });

  app.post('/journal/:id/post', async (c) => {
    const row = await sql`
      UPDATE zvd_journal_entries SET status = 'posted', updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Entry not found or already posted' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/journal/:id/void', async (c) => {
    const row = await sql`
      UPDATE zvd_journal_entries SET status = 'voided', updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.delete('/journal/:id', async (c) => {
    const existing = await sql`SELECT status FROM zvd_journal_entries WHERE id = ${c.req.param('id')}`.execute(db);
    if (!existing.rows.length) return c.json({ error: 'Not found' }, 404);
    if ((existing.rows[0] as any).status === 'posted') return c.json({ error: 'Cannot delete a posted entry. Void it instead.' }, 400);
    await sql`DELETE FROM zvd_journal_entries WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Reports ──────────────────────────────────────────────────
  app.get('/reports/trial-balance', async (c) => {
    const rows = await sql`
      SELECT a.id, a.code, a.name, a.type,
        COALESCE(SUM(l.debit), 0) as total_debit,
        COALESCE(SUM(l.credit), 0) as total_credit,
        COALESCE(SUM(l.debit) - SUM(l.credit), 0) as balance
      FROM zvd_accounts a
      LEFT JOIN zvd_journal_lines l ON l.account_id = a.id
      LEFT JOIN zvd_journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
      WHERE a.is_active = true
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/reports/pl', async (c) => {
    const { from, to } = c.req.query();
    const fromDate = from || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const toDate = to || new Date().toISOString().slice(0, 10);
    const rows = await sql`
      SELECT a.type,
        COALESCE(SUM(l.credit) - SUM(l.debit), 0) as amount
      FROM zvd_accounts a
      JOIN zvd_journal_lines l ON l.account_id = a.id
      JOIN zvd_journal_entries e ON e.id = l.entry_id
        AND e.status = 'posted'
        AND e.date BETWEEN ${fromDate} AND ${toDate}
      WHERE a.type IN ('revenue','expense')
      GROUP BY a.type
    `.execute(db);
    const revenue = rows.rows.find((r: any) => r.type === 'revenue')?.amount ?? 0;
    const expense = rows.rows.find((r: any) => r.type === 'expense')?.amount ?? 0;
    return c.json({ data: { from: fromDate, to: toDate, revenue: +revenue, expenses: +expense, net: +revenue - +expense } });
  });

  app.get('/reports/balance-sheet', async (c) => {
    const rows = await sql`
      SELECT a.type, a.code, a.name,
        COALESCE(SUM(l.debit) - SUM(l.credit), 0) as balance
      FROM zvd_accounts a
      LEFT JOIN zvd_journal_lines l ON l.account_id = a.id
      LEFT JOIN zvd_journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
      WHERE a.type IN ('asset','liability','equity') AND a.is_active = true
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.type, a.code
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  return app;
}
