import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';

export function bankingRoutes(db: any, auth: any): Hono {
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // ── Bank Accounts ─────────────────────────────────────────────
  app.get('/accounts', async (c) => {
    const rows = await sql`SELECT * FROM zvd_bank_accounts ORDER BY created_at DESC`.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/accounts', zValidator('json', z.object({
    name: z.string().min(1),
    bank_name: z.string().min(1),
    iban: z.string().optional(),
    currency: z.string().default('RON'),
    account_type: z.enum(['checking','savings','credit','cash']).default('checking'),
    opening_balance: z.number().default(0),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_bank_accounts (name, bank_name, iban, currency, account_type, balance, opening_balance, notes, created_by)
      VALUES (${d.name}, ${d.bank_name}, ${d.iban ?? null}, ${d.currency}, ${d.account_type},
        ${d.opening_balance}, ${d.opening_balance}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.patch('/accounts/:id', zValidator('json', z.object({
    name: z.string().optional(),
    notes: z.string().optional(),
    is_active: z.boolean().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_bank_accounts SET
        name = COALESCE(${d.name ?? null}, name),
        notes = COALESCE(${d.notes ?? null}, notes),
        is_active = COALESCE(${d.is_active ?? null}, is_active),
        updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Transactions ──────────────────────────────────────────────
  app.get('/accounts/:id/transactions', async (c) => {
    const { limit = '50', page = '1', type } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT * FROM zvd_bank_transactions
      WHERE account_id = ${c.req.param('id')}
        AND (${type ? sql`type = ${type}` : sql`TRUE`})
      ORDER BY date DESC, created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/accounts/:id/transactions', zValidator('json', z.object({
    date: z.string(),
    type: z.enum(['credit','debit']),
    amount: z.number().positive(),
    description: z.string().min(1),
    reference: z.string().optional(),
    counterparty_name: z.string().optional(),
    category: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const accountId = c.req.param('id');
    const row = await sql`
      INSERT INTO zvd_bank_transactions (account_id, date, type, amount, description, reference, counterparty_name, category, created_by)
      VALUES (${accountId}, ${d.date}, ${d.type}, ${d.amount}, ${d.description},
        ${d.reference ?? null}, ${d.counterparty_name ?? null}, ${d.category ?? null}, ${user.id})
      RETURNING *
    `.execute(db);
    const delta = d.type === 'credit' ? d.amount : -d.amount;
    await sql`UPDATE zvd_bank_accounts SET balance = balance + ${delta}, updated_at = NOW() WHERE id = ${accountId}`.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Import (CSV/MT940 parsed client-side, POST rows) ──────────
  app.post('/accounts/:id/import', zValidator('json', z.object({
    source: z.string().default('csv'),
    transactions: z.array(z.object({
      date: z.string(),
      type: z.enum(['credit','debit']),
      amount: z.number().positive(),
      description: z.string(),
      reference: z.string().optional(),
      counterparty_name: z.string().optional(),
    })).min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const accountId = c.req.param('id');
    const importRow = await sql`
      INSERT INTO zvd_bank_imports (account_id, source, row_count, created_by)
      VALUES (${accountId}, ${d.source}, ${d.transactions.length}, ${user.id})
      RETURNING id
    `.execute(db);
    const importId = (importRow.rows[0] as any).id;
    let balance_delta = 0;
    for (const t of d.transactions) {
      await sql`
        INSERT INTO zvd_bank_transactions (account_id, import_id, date, type, amount, description, reference, counterparty_name, created_by)
        VALUES (${accountId}, ${importId}, ${t.date}, ${t.type}, ${t.amount}, ${t.description},
          ${t.reference ?? null}, ${t.counterparty_name ?? null}, ${user.id})
        ON CONFLICT DO NOTHING
      `.execute(db);
      balance_delta += t.type === 'credit' ? t.amount : -t.amount;
    }
    await sql`UPDATE zvd_bank_accounts SET balance = balance + ${balance_delta}, updated_at = NOW() WHERE id = ${accountId}`.execute(db);
    return c.json({ data: { import_id: importId, imported: d.transactions.length } }, 201);
  });

  // ── Reconciliation ────────────────────────────────────────────
  app.post('/accounts/:id/transactions/:txId/reconcile', async (c) => {
    const row = await sql`
      UPDATE zvd_bank_transactions SET is_reconciled = true, updated_at = NOW()
      WHERE id = ${c.req.param('txId')} AND account_id = ${c.req.param('id')} RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const accounts = await sql`
      SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as total_balance
      FROM zvd_bank_accounts WHERE is_active = true
    `.execute(db);
    const monthly = await sql`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'credit' AND date >= date_trunc('month', NOW())), 0) as income_mtd,
        COALESCE(SUM(amount) FILTER (WHERE type = 'debit'  AND date >= date_trunc('month', NOW())), 0) as expenses_mtd
      FROM zvd_bank_transactions
    `.execute(db);
    return c.json({ data: { ...(accounts.rows[0] as any), ...(monthly.rows[0] as any) } });
  });

  return app;
}
