import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

export function accountingRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
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
      SELECT a.*, p.name as parent_name,
        COALESCE(SUM(l.debit) - SUM(l.credit), 0) as balance
      FROM zvd_accounts a
      LEFT JOIN zvd_accounts p ON p.id = a.parent_id
      LEFT JOIN zvd_journal_lines l ON l.account_id = a.id
      LEFT JOIN zvd_journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
      GROUP BY a.id, p.name
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
    currency: z.string().default('RON'),
    cost_center_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_accounts (code, name, type, parent_id, description, currency, cost_center_id, created_by)
      VALUES (${d.code}, ${d.name}, ${d.type}, ${d.parent_id ?? null}, ${d.description ?? null},
        ${d.currency}, ${d.cost_center_id ?? null}, ${user.id})
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
    const used = await sql`SELECT COUNT(*) as cnt FROM zvd_journal_lines WHERE account_id = ${c.req.param('id')}`.execute(db);
    if (+(used.rows[0] as any).cnt > 0) return c.json({ error: 'Account has journal entries — deactivate instead' }, 400);
    await sql`DELETE FROM zvd_accounts WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Cost Centers ─────────────────────────────────────────────
  app.get('/cost-centers', async (c) => {
    const rows = await sql`SELECT * FROM zvd_cost_centers ORDER BY code`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/cost-centers', zValidator('json', z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    parent_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_cost_centers (code, name, parent_id, created_by)
      VALUES (${d.code}, ${d.name}, ${d.parent_id ?? null}, ${user.id}) RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Fiscal Years ─────────────────────────────────────────────
  app.get('/fiscal-years', async (c) => {
    const rows = await sql`SELECT * FROM zvd_fiscal_years ORDER BY year DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/fiscal-years', zValidator('json', z.object({
    year: z.number().int().min(2000).max(2100),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const start = d.start_date ?? `${d.year}-01-01`;
    const end = d.end_date ?? `${d.year}-12-31`;
    const row = await sql`
      INSERT INTO zvd_fiscal_years (year, start_date, end_date)
      VALUES (${d.year}, ${start}, ${end}) RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/fiscal-years/:id/close', async (c) => {
    const user = c.get('user') as any;
    // Check no draft entries in this year
    const fy = await sql`SELECT * FROM zvd_fiscal_years WHERE id = ${c.req.param('id')} AND status = 'open'`.execute(db);
    if (!fy.rows.length) return c.json({ error: 'Fiscal year not found or already closed' }, 400);
    const f = fy.rows[0] as any;
    const drafts = await sql`
      SELECT COUNT(*) as cnt FROM zvd_journal_entries
      WHERE status = 'draft' AND date BETWEEN ${f.start_date} AND ${f.end_date}
    `.execute(db);
    if (+(drafts.rows[0] as any).cnt > 0) return c.json({ error: 'Post all draft journal entries before closing the year' }, 400);
    const row = await sql`
      UPDATE zvd_fiscal_years SET status = 'closed', closed_at = NOW(), closed_by = ${user.id}
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  // ── Exchange Rates ────────────────────────────────────────────
  app.get('/exchange-rates', async (c) => {
    const { from, to, date } = c.req.query();
    const rows = await sql`
      SELECT * FROM zvd_exchange_rates
      WHERE (${from ? sql`from_currency = ${from}` : sql`TRUE`})
        AND (${to ? sql`to_currency = ${to}` : sql`TRUE`})
        AND (${date ? sql`date = ${date}` : sql`TRUE`})
      ORDER BY date DESC LIMIT 100
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/exchange-rates', zValidator('json', z.object({
    from_currency: z.string().length(3),
    to_currency: z.string().length(3),
    rate: z.number().positive(),
    date: z.string(),
    source: z.string().default('manual'),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_exchange_rates (from_currency, to_currency, rate, date, source)
      VALUES (${d.from_currency}, ${d.to_currency}, ${d.rate}, ${d.date}, ${d.source})
      ON CONFLICT (from_currency, to_currency, date) DO UPDATE SET rate = EXCLUDED.rate
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] });
  });

  // ── Budgets ───────────────────────────────────────────────────
  app.get('/budgets', async (c) => {
    const { fiscal_year_id } = c.req.query();
    const rows = await sql`
      SELECT b.*, a.code as account_code, a.name as account_name, a.type as account_type,
        COALESCE((
          SELECT SUM(l.debit) - SUM(l.credit)
          FROM zvd_journal_lines l
          JOIN zvd_journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
          WHERE l.account_id = b.account_id
            AND (${fiscal_year_id ? sql`e.date >= (SELECT start_date FROM zvd_fiscal_years WHERE id = ${fiscal_year_id})` : sql`TRUE`})
        ), 0) as actual
      FROM zvd_budgets b
      JOIN zvd_accounts a ON a.id = b.account_id
      WHERE (${fiscal_year_id ? sql`b.fiscal_year_id = ${fiscal_year_id}` : sql`TRUE`})
      ORDER BY a.code, b.month
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/budgets', zValidator('json', z.object({
    fiscal_year_id: z.string().uuid(),
    account_id: z.string().uuid(),
    month: z.number().int().min(1).max(12).optional(),
    amount: z.number(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_budgets (fiscal_year_id, account_id, month, amount, notes, created_by)
      VALUES (${d.fiscal_year_id}, ${d.account_id}, ${d.month ?? null}, ${d.amount}, ${d.notes ?? null}, ${user.id})
      ON CONFLICT (fiscal_year_id, account_id, month) DO UPDATE SET amount = EXCLUDED.amount, notes = EXCLUDED.notes
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Journal Entries ──────────────────────────────────────────
  app.get('/journal', async (c) => {
    const { limit = '50', page = '1', status, from, to, account_id, cost_center_id } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT e.*,
        COALESCE(json_agg(json_build_object(
          'id', l.id, 'account_id', l.account_id, 'account_name', a.name, 'account_code', a.code,
          'debit', l.debit, 'credit', l.credit, 'description', l.description,
          'currency', l.currency, 'exchange_rate', l.exchange_rate, 'cost_center_id', l.cost_center_id
        )) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_journal_entries e
      LEFT JOIN zvd_journal_lines l ON l.entry_id = e.id
      LEFT JOIN zvd_accounts a ON a.id = l.account_id
      WHERE (${status ? sql`e.status = ${status}` : sql`TRUE`})
        AND (${from ? sql`e.date >= ${from}` : sql`TRUE`})
        AND (${to ? sql`e.date <= ${to}` : sql`TRUE`})
        AND (${account_id ? sql`EXISTS (SELECT 1 FROM zvd_journal_lines jl WHERE jl.entry_id = e.id AND jl.account_id = ${account_id})` : sql`TRUE`})
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
    fiscal_year_id: z.string().uuid().optional(),
    lines: z.array(z.object({
      account_id: z.string().uuid(),
      debit: z.number().min(0).default(0),
      credit: z.number().min(0).default(0),
      description: z.string().optional(),
      currency: z.string().default('RON'),
      exchange_rate: z.number().positive().default(1),
      amount_foreign: z.number().optional(),
      cost_center_id: z.string().uuid().optional(),
    })).min(2),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const totalDebit = d.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = d.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return c.json({ error: 'Journal entry is not balanced (debits must equal credits)' }, 400);
    }
    // Auto-detect fiscal year if not provided
    let fyId = d.fiscal_year_id ?? null;
    if (!fyId) {
      const fy = await sql`SELECT id FROM zvd_fiscal_years WHERE ${d.date} BETWEEN start_date AND end_date AND status = 'open'`.execute(db);
      fyId = (fy.rows[0] as any)?.id ?? null;
    }
    const entry = await sql`
      INSERT INTO zvd_journal_entries (date, description, reference, fiscal_year_id, created_by)
      VALUES (${d.date}, ${d.description}, ${d.reference ?? null}, ${fyId}, ${user.id})
      RETURNING *
    `.execute(db);
    const entryId = (entry.rows[0] as any).id;
    for (const line of d.lines) {
      await sql`
        INSERT INTO zvd_journal_lines (entry_id, account_id, debit, credit, description, currency, exchange_rate, amount_foreign, cost_center_id)
        VALUES (${entryId}, ${line.account_id}, ${line.debit}, ${line.credit}, ${line.description ?? null},
          ${line.currency}, ${line.exchange_rate}, ${line.amount_foreign ?? null}, ${line.cost_center_id ?? null})
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
    const user = c.get('user') as any;
    const entry = await sql`SELECT * FROM zvd_journal_entries WHERE id = ${c.req.param('id')} AND status = 'posted'`.execute(db);
    if (!entry.rows.length) return c.json({ error: 'Entry not found or not posted' }, 400);
    const e = entry.rows[0] as any;
    const lines = await sql`SELECT * FROM zvd_journal_lines WHERE entry_id = ${e.id}`.execute(db);
    // Create reversal entry
    const reversal = await sql`
      INSERT INTO zvd_journal_entries (date, description, reference, fiscal_year_id, status, created_by)
      VALUES (${new Date().toISOString().slice(0,10)}, ${'VOID: ' + e.description}, ${'VOID-' + (e.reference ?? e.id)}, ${e.fiscal_year_id}, 'posted', ${user.id})
      RETURNING *
    `.execute(db);
    const revId = (reversal.rows[0] as any).id;
    for (const line of lines.rows as any[]) {
      await sql`
        INSERT INTO zvd_journal_lines (entry_id, account_id, debit, credit, description, currency, exchange_rate)
        VALUES (${revId}, ${line.account_id}, ${line.credit}, ${line.debit}, ${line.description}, ${line.currency}, ${line.exchange_rate})
      `.execute(db);
    }
    await sql`UPDATE zvd_journal_entries SET status = 'voided', updated_at = NOW() WHERE id = ${e.id}`.execute(db);
    return c.json({ data: reversal.rows[0] });
  });

  app.delete('/journal/:id', async (c) => {
    const existing = await sql`SELECT status FROM zvd_journal_entries WHERE id = ${c.req.param('id')}`.execute(db);
    if (!existing.rows.length) return c.json({ error: 'Not found' }, 404);
    if ((existing.rows[0] as any).status === 'posted') return c.json({ error: 'Cannot delete a posted entry. Void it instead.' }, 400);
    await sql`DELETE FROM zvd_journal_entries WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // ── Recurring Journals ────────────────────────────────────────
  app.get('/recurring', async (c) => {
    const rows = await sql`
      SELECT r.*,
        COALESCE(json_agg(json_build_object(
          'account_id', l.account_id, 'account_name', a.name, 'debit', l.debit, 'credit', l.credit
        )) FILTER (WHERE l.id IS NOT NULL), '[]') as lines
      FROM zvd_recurring_journals r
      LEFT JOIN zvd_recurring_journal_lines l ON l.recurring_id = r.id
      LEFT JOIN zvd_accounts a ON a.id = l.account_id
      WHERE r.is_active = true
      GROUP BY r.id ORDER BY r.next_run_date
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/recurring', zValidator('json', z.object({
    description: z.string().min(1),
    reference: z.string().optional(),
    frequency: z.enum(['daily','weekly','monthly','quarterly','yearly']),
    next_run_date: z.string(),
    end_date: z.string().optional(),
    lines: z.array(z.object({
      account_id: z.string().uuid(),
      debit: z.number().min(0).default(0),
      credit: z.number().min(0).default(0),
      description: z.string().optional(),
    })).min(2),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const totalD = d.lines.reduce((s, l) => s + l.debit, 0);
    const totalC = d.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalD - totalC) > 0.001) return c.json({ error: 'Lines are not balanced' }, 400);
    const rec = await sql`
      INSERT INTO zvd_recurring_journals (description, reference, frequency, next_run_date, end_date, created_by)
      VALUES (${d.description}, ${d.reference ?? null}, ${d.frequency}, ${d.next_run_date}, ${d.end_date ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    const recId = (rec.rows[0] as any).id;
    for (const line of d.lines) {
      await sql`INSERT INTO zvd_recurring_journal_lines (recurring_id, account_id, debit, credit, description) VALUES (${recId}, ${line.account_id}, ${line.debit}, ${line.credit}, ${line.description ?? null})`.execute(db);
    }
    return c.json({ data: rec.rows[0] }, 201);
  });

  app.post('/recurring/:id/run', async (c) => {
    const user = c.get('user') as any;
    const rec = await sql`SELECT * FROM zvd_recurring_journals WHERE id = ${c.req.param('id')} AND is_active = true`.execute(db);
    if (!rec.rows.length) return c.json({ error: 'Recurring template not found or inactive' }, 400);
    const r = rec.rows[0] as any;
    const lines = await sql`SELECT * FROM zvd_recurring_journal_lines WHERE recurring_id = ${r.id}`.execute(db);
    const entry = await sql`
      INSERT INTO zvd_journal_entries (date, description, reference, created_by)
      VALUES (${r.next_run_date}, ${r.description}, ${r.reference}, ${user.id}) RETURNING *
    `.execute(db);
    const entryId = (entry.rows[0] as any).id;
    for (const line of lines.rows as any[]) {
      await sql`INSERT INTO zvd_journal_lines (entry_id, account_id, debit, credit, description) VALUES (${entryId}, ${line.account_id}, ${line.debit}, ${line.credit}, ${line.description ?? null})`.execute(db);
    }
    // Advance next_run_date
    const next = new Date(r.next_run_date);
    if (r.frequency === 'daily') next.setDate(next.getDate() + 1);
    else if (r.frequency === 'weekly') next.setDate(next.getDate() + 7);
    else if (r.frequency === 'monthly') next.setMonth(next.getMonth() + 1);
    else if (r.frequency === 'quarterly') next.setMonth(next.getMonth() + 3);
    else if (r.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
    const nextStr = next.toISOString().slice(0, 10);
    const shouldDeactivate = r.end_date && nextStr > r.end_date;
    await sql`UPDATE zvd_recurring_journals SET next_run_date = ${nextStr}, last_run_date = ${r.next_run_date}, is_active = ${!shouldDeactivate}, updated_at = NOW() WHERE id = ${r.id}`.execute(db);
    return c.json({ data: entry.rows[0] }, 201);
  });

  // ── Reports ──────────────────────────────────────────────────
  app.get('/reports/trial-balance', async (c) => {
    const { fiscal_year_id, as_of } = c.req.query();
    const rows = await sql`
      SELECT a.id, a.code, a.name, a.type,
        COALESCE(SUM(l.debit), 0) as total_debit,
        COALESCE(SUM(l.credit), 0) as total_credit,
        COALESCE(SUM(l.debit) - SUM(l.credit), 0) as balance
      FROM zvd_accounts a
      LEFT JOIN zvd_journal_lines l ON l.account_id = a.id
      LEFT JOIN zvd_journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
        AND (${as_of ? sql`e.date <= ${as_of}` : sql`TRUE`})
        AND (${fiscal_year_id ? sql`e.fiscal_year_id = ${fiscal_year_id}` : sql`TRUE`})
      WHERE a.is_active = true
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/reports/pl', async (c) => {
    const { from, to, cost_center_id } = c.req.query();
    const fromDate = from ?? new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
    const toDate = to ?? new Date().toISOString().slice(0, 10);
    const rows = await sql`
      SELECT a.code, a.name, a.type,
        COALESCE(SUM(l.credit) - SUM(l.debit), 0) as amount
      FROM zvd_accounts a
      JOIN zvd_journal_lines l ON l.account_id = a.id
        AND (${cost_center_id ? sql`l.cost_center_id = ${cost_center_id}` : sql`TRUE`})
      JOIN zvd_journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
        AND e.date BETWEEN ${fromDate} AND ${toDate}
      WHERE a.type IN ('revenue','expense')
      GROUP BY a.code, a.name, a.type
      ORDER BY a.type, a.code
    `.execute(db);
    const revenue = rows.rows.filter((r: any) => r.type === 'revenue').reduce((s: number, r: any) => s + +r.amount, 0);
    const expense = rows.rows.filter((r: any) => r.type === 'expense').reduce((s: number, r: any) => s + +r.amount, 0);
    return c.json({ data: { from: fromDate, to: toDate, revenue, expenses: expense, net: revenue - expense, breakdown: rows.rows } });
  });

  app.get('/reports/balance-sheet', async (c) => {
    const { as_of } = c.req.query();
    const rows = await sql`
      SELECT a.type, a.code, a.name,
        COALESCE(SUM(l.debit) - SUM(l.credit), 0) as balance
      FROM zvd_accounts a
      LEFT JOIN zvd_journal_lines l ON l.account_id = a.id
      LEFT JOIN zvd_journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
        AND (${as_of ? sql`e.date <= ${as_of}` : sql`TRUE`})
      WHERE a.type IN ('asset','liability','equity') AND a.is_active = true
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.type, a.code
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.get('/reports/budget-vs-actual', async (c) => {
    const { fiscal_year_id } = c.req.query();
    if (!fiscal_year_id) return c.json({ error: 'fiscal_year_id required' }, 400);
    const rows = await sql`
      SELECT b.account_id, a.code, a.name, a.type,
        b.month, b.amount as budget,
        COALESCE((
          SELECT SUM(l.debit) - SUM(l.credit)
          FROM zvd_journal_lines l
          JOIN zvd_journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
            AND e.fiscal_year_id = b.fiscal_year_id
            AND (${sql`b.month IS NOT NULL`} AND EXTRACT(MONTH FROM e.date) = b.month OR b.month IS NULL)
          WHERE l.account_id = b.account_id
        ), 0) as actual
      FROM zvd_budgets b
      JOIN zvd_accounts a ON a.id = b.account_id
      WHERE b.fiscal_year_id = ${fiscal_year_id}
      ORDER BY a.code, b.month
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  // ── Tax Reports ───────────────────────────────────────────────
  app.get('/tax-reports', async (c) => {
    const rows = await sql`SELECT id, type, period_from, period_to, status, submitted_at, anaf_ref, created_at FROM zvd_tax_reports ORDER BY created_at DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/tax-reports/d300', zValidator('json', z.object({
    period_from: z.string(),
    period_to: z.string(),
  })), async (c) => {
    const user = c.get('user') as any;
    const { period_from, period_to } = c.req.valid('json');
    // Collect VAT data from journal
    const vatData = await sql`
      SELECT a.code, a.name, a.type,
        SUM(l.credit - l.debit) as amount
      FROM zvd_journal_lines l
      JOIN zvd_journal_entries e ON e.id = l.entry_id AND e.status = 'posted'
        AND e.date BETWEEN ${period_from} AND ${period_to}
      JOIN zvd_accounts a ON a.id = l.account_id AND a.code LIKE '4427%' OR a.code LIKE '4426%'
      GROUP BY a.id, a.code, a.name, a.type
    `.execute(db).catch(() => ({ rows: [] }));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Declaration xmlns="mfp:anaf:dgti:d300:declaratie:v2">
  <Declarant/>
  <Period from="${period_from}" to="${period_to}"/>
  <!-- VAT collected and deductible data to be completed -->
  ${(vatData.rows as any[]).map(r => `<Account code="${r.code}" name="${r.name}" amount="${r.amount}"/>`).join('\n  ')}
</Declaration>`;
    const row = await sql`
      INSERT INTO zvd_tax_reports (type, period_from, period_to, xml_content, created_by)
      VALUES ('D300', ${period_from}, ${period_to}, ${xml}, ${user.id}) RETURNING id, type, period_from, period_to, status
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.post('/tax-reports/:id/submit', async (c) => {
    const row = await sql`
      UPDATE zvd_tax_reports SET status = 'submitted', submitted_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Report not found or not in draft' }, 400);
    // TODO: integrate with ANAF e-Filing API (OAuth2 SPV)
    return c.json({ data: row.rows[0] });
  });

  return app;
}
