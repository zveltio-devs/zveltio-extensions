import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

// Minimal MT940 parser — handles :60F:, :61:, :86: tags
function parseMT940(text: string): Array<{date: string, type: 'credit'|'debit', amount: number, description: string, reference: string}> {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const transactions: any[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith(':61:')) {
      // Format: :61:YYMMDD[MMDD]C/D<Amount>N<TxType><TxRef>
      const match = line.match(/:61:(\d{6})(\d{4})?(C|D)(\d+,\d+)N(\w+)(.*)?/);
      if (match) {
        const yy = match[1].slice(0, 2), mm = match[1].slice(2, 4), dd = match[1].slice(4, 6);
        const year = parseInt(yy) < 50 ? `20${yy}` : `19${yy}`;
        const date = `${year}-${mm}-${dd}`;
        const type = match[3] === 'C' ? 'credit' : 'debit';
        const amount = parseFloat(match[4].replace(',', '.'));
        const reference = match[5] ?? '';
        let description = '';
        // Next line(s) starting with :86: are the narrative
        if (lines[i + 1]?.startsWith(':86:')) {
          description = lines[i + 1].slice(4).trim();
          i++;
        }
        transactions.push({ date, type, amount, description, reference });
      }
    }
    i++;
  }
  return transactions;
}

// Apply categorization rules to a transaction
async function applyRules(db: any, accountId: string, tx: any): Promise<string | null> {
  const rules = await sql`
    SELECT * FROM zvd_bank_rules
    WHERE (account_id = ${accountId} OR account_id IS NULL) AND is_active = true
    ORDER BY priority DESC, created_at ASC
  `.execute(db);
  for (const rule of rules.rows as any[]) {
    const fieldValue = String(tx[rule.match_field] ?? '').toLowerCase();
    const matchVal = rule.match_value.toLowerCase();
    let matches = false;
    switch (rule.match_operator) {
      case 'contains': matches = fieldValue.includes(matchVal); break;
      case 'equals': matches = fieldValue === matchVal; break;
      case 'starts_with': matches = fieldValue.startsWith(matchVal); break;
      case 'ends_with': matches = fieldValue.endsWith(matchVal); break;
      case 'regex': try { matches = new RegExp(rule.match_value, 'i').test(fieldValue); } catch {} break;
      case 'gt': matches = parseFloat(fieldValue) > parseFloat(rule.match_value); break;
      case 'lt': matches = parseFloat(fieldValue) < parseFloat(rule.match_value); break;
    }
    if (matches) return rule.category;
  }
  return null;
}

export function bankingRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  app.use('*', permissionGate(ctx, 'banking'));

  // ── Bank Accounts ─────────────────────────────────────────────
  app.get('/accounts', async (c) => {
    const rows = await sql`SELECT * FROM zvd_bank_accounts ORDER BY created_at DESC`.execute(reqDb(c));
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
    `.execute(reqDb(c));
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
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Transactions ──────────────────────────────────────────────
  app.get('/accounts/:id/transactions', async (c) => {
    const { limit = '50', page = '1', type, category, from, to, reconciled } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`
      SELECT * FROM zvd_bank_transactions
      WHERE account_id = ${c.req.param('id')}
        AND (${type ? sql`type = ${type}` : sql`TRUE`})
        AND (${category ? sql`category = ${category}` : sql`TRUE`})
        AND (${from ? sql`date >= ${from}` : sql`TRUE`})
        AND (${to ? sql`date <= ${to}` : sql`TRUE`})
        AND (${reconciled === 'true' ? sql`is_reconciled = true` : reconciled === 'false' ? sql`is_reconciled = false` : sql`TRUE`})
      ORDER BY date DESC, created_at DESC
      LIMIT ${lim} OFFSET ${offset}
    `.execute(reqDb(c));
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
    const autoCategory = d.category ?? await applyRules(db, accountId, d);
    const row = await sql`
      INSERT INTO zvd_bank_transactions (account_id, date, type, amount, description, reference, counterparty_name, category, auto_categorized, created_by)
      VALUES (${accountId}, ${d.date}, ${d.type}, ${d.amount}, ${d.description},
        ${d.reference ?? null}, ${d.counterparty_name ?? null}, ${autoCategory ?? null}, ${!d.category && !!autoCategory}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    const delta = d.type === 'credit' ? d.amount : -d.amount;
    await sql`UPDATE zvd_bank_accounts SET balance = balance + ${delta}, updated_at = NOW() WHERE id = ${accountId}`.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── MT940 Import ──────────────────────────────────────────────
  app.post('/accounts/:id/import/mt940', zValidator('json', z.object({
    content: z.string().min(10),
  })), async (c) => {
    const user = c.get('user') as any;
    const { content } = c.req.valid('json');
    const accountId = c.req.param('id');
    const transactions = parseMT940(content);
    if (!transactions.length) return c.json({ error: 'No transactions found in MT940 content' }, 400);
    const importRow = await sql`
      INSERT INTO zvd_bank_imports (account_id, source, row_count, created_by)
      VALUES (${accountId}, 'mt940', ${transactions.length}, ${user.id}) RETURNING id
    `.execute(reqDb(c));
    const importId = (importRow.rows[0] as any).id;
    let imported = 0;
    let balance_delta = 0;
    for (const t of transactions) {
      const autoCategory = await applyRules(db, accountId, t);
      const result = await sql`
        INSERT INTO zvd_bank_transactions (account_id, import_id, date, type, amount, description, reference, category, auto_categorized, created_by)
        VALUES (${accountId}, ${importId}, ${t.date}, ${t.type}, ${t.amount}, ${t.description}, ${t.reference}, ${autoCategory}, ${!!autoCategory}, ${user.id})
        ON CONFLICT DO NOTHING RETURNING id
      `.execute(reqDb(c));
      if (result.rows.length) {
        balance_delta += t.type === 'credit' ? t.amount : -t.amount;
        imported++;
      }
    }
    await sql`UPDATE zvd_bank_accounts SET balance = balance + ${balance_delta}, updated_at = NOW() WHERE id = ${accountId}`.execute(reqDb(c));
    return c.json({ data: { import_id: importId, total: transactions.length, imported, skipped: transactions.length - imported } }, 201);
  });

  // ── CSV Import ────────────────────────────────────────────────
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
      VALUES (${accountId}, ${d.source}, ${d.transactions.length}, ${user.id}) RETURNING id
    `.execute(reqDb(c));
    const importId = (importRow.rows[0] as any).id;
    let balance_delta = 0;
    let imported = 0;
    for (const t of d.transactions) {
      const autoCategory = await applyRules(db, accountId, t);
      const result = await sql`
        INSERT INTO zvd_bank_transactions (account_id, import_id, date, type, amount, description, reference, counterparty_name, category, auto_categorized, created_by)
        VALUES (${accountId}, ${importId}, ${t.date}, ${t.type}, ${t.amount}, ${t.description},
          ${t.reference ?? null}, ${t.counterparty_name ?? null}, ${autoCategory}, ${!!autoCategory}, ${user.id})
        ON CONFLICT DO NOTHING RETURNING id
      `.execute(reqDb(c));
      if (result.rows.length) {
        balance_delta += t.type === 'credit' ? t.amount : -t.amount;
        imported++;
      }
    }
    await sql`UPDATE zvd_bank_accounts SET balance = balance + ${balance_delta}, updated_at = NOW() WHERE id = ${accountId}`.execute(reqDb(c));
    return c.json({ data: { import_id: importId, imported } }, 201);
  });

  // ── Categorization Rules ──────────────────────────────────────
  app.get('/accounts/:id/rules', async (c) => {
    const rows = await sql`SELECT * FROM zvd_bank_rules WHERE account_id = ${c.req.param('id')} OR account_id IS NULL ORDER BY priority DESC, created_at`.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  app.post('/accounts/:id/rules', zValidator('json', z.object({
    name: z.string().min(1),
    match_field: z.enum(['description','counterparty_name','reference','amount']).default('description'),
    match_operator: z.enum(['contains','equals','starts_with','ends_with','regex','gt','lt']).default('contains'),
    match_value: z.string().min(1),
    category: z.string().min(1),
    type_override: z.enum(['credit','debit']).optional(),
    priority: z.number().int().default(0),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_bank_rules (account_id, name, match_field, match_operator, match_value, category, type_override, priority, created_by)
      VALUES (${c.req.param('id')}, ${d.name}, ${d.match_field}, ${d.match_operator}, ${d.match_value},
        ${d.category}, ${d.type_override ?? null}, ${d.priority}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/rules/:id', async (c) => {
    await sql`DELETE FROM zvd_bank_rules WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ success: true });
  });

  // Re-apply rules to all unreconciled transactions
  app.post('/accounts/:id/re-categorize', async (c) => {
    const txns = await sql`SELECT * FROM zvd_bank_transactions WHERE account_id = ${c.req.param('id')} AND is_reconciled = false`.execute(reqDb(c));
    let updated = 0;
    for (const tx of txns.rows as any[]) {
      const cat = await applyRules(db, c.req.param('id'), tx);
      if (cat && cat !== tx.category) {
        await sql`UPDATE zvd_bank_transactions SET category = ${cat}, auto_categorized = true WHERE id = ${tx.id}`.execute(reqDb(c));
        updated++;
      }
    }
    return c.json({ data: { updated } });
  });

  // ── Reconciliation ────────────────────────────────────────────
  app.post('/accounts/:id/transactions/:txId/reconcile', zValidator('json', z.object({
    linked_type: z.enum(['invoice','expense','manual']).default('manual'),
    linked_id: z.string().uuid().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const tx = await sql`SELECT * FROM zvd_bank_transactions WHERE id = ${c.req.param('txId')} AND account_id = ${c.req.param('id')}`.execute(reqDb(c));
    if (!tx.rows.length) return c.json({ error: 'Not found' }, 404);
    await sql`UPDATE zvd_bank_transactions SET is_reconciled = true, updated_at = NOW() WHERE id = ${c.req.param('txId')}`.execute(reqDb(c));
    const rec = await sql`
      INSERT INTO zvd_bank_reconciliations (transaction_id, linked_type, linked_id, matched_amount, notes, created_by)
      VALUES (${c.req.param('txId')}, ${d.linked_type}, ${d.linked_id ?? null}, ${(tx.rows[0] as any).amount}, ${d.notes ?? null}, ${user.id})
      ON CONFLICT (transaction_id) DO UPDATE SET linked_type = EXCLUDED.linked_type, linked_id = EXCLUDED.linked_id, notes = EXCLUDED.notes
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: rec.rows[0] });
  });

  // Suggest unreconciled invoice matches
  app.get('/accounts/:id/suggest-matches', async (c) => {
    const txns = await sql`
      SELECT t.*, i.id as invoice_id, i.number as invoice_number, i.total as invoice_total
      FROM zvd_bank_transactions t
      JOIN zvd_invoices i ON ABS(i.total - t.amount) < 0.01 AND i.status IN ('sent','overdue')
      WHERE t.account_id = ${c.req.param('id')} AND t.is_reconciled = false AND t.type = 'credit'
      ORDER BY t.date DESC LIMIT 50
    `.execute(reqDb(c)).catch(() => ({ rows: [] }));
    return c.json({ data: txns.rows });
  });

  // ── Cash Flow Forecast ────────────────────────────────────────
  app.get('/cash-flow', async (c) => {
    const { from, to } = c.req.query();
    const fromDate = from ?? new Date().toISOString().slice(0, 10);
    const toDate = to ?? new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
    const forecast = await sql`
      SELECT * FROM zvd_cash_flow_entries
      WHERE expected_date BETWEEN ${fromDate} AND ${toDate}
      ORDER BY expected_date
    `.execute(reqDb(c));
    // Also include expected payments from open invoices
    const invoices = await sql`
      SELECT due_date as expected_date, 'inflow' as type, total - amount_paid as amount, 'Invoice ' || number as description, 'accounts_receivable' as category
      FROM zvd_invoices WHERE status IN ('sent','overdue') AND due_date BETWEEN ${fromDate} AND ${toDate}
    `.execute(reqDb(c)).catch(() => ({ rows: [] }));
    return c.json({ data: [...forecast.rows, ...invoices.rows].sort((a: any, b: any) => a.expected_date.localeCompare(b.expected_date)) });
  });

  app.post('/cash-flow', zValidator('json', z.object({
    account_id: z.string().uuid().optional(),
    expected_date: z.string(),
    type: z.enum(['inflow','outflow']),
    amount: z.number().positive(),
    description: z.string().min(1),
    category: z.string().optional(),
    probability: z.number().int().min(0).max(100).default(100),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_cash_flow_entries (account_id, expected_date, type, amount, description, category, probability, created_by)
      VALUES (${d.account_id ?? null}, ${d.expected_date}, ${d.type}, ${d.amount}, ${d.description}, ${d.category ?? null}, ${d.probability}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Balance history snapshot ──────────────────────────────────
  app.post('/accounts/:id/snapshot', async (c) => {
    const acc = await sql`SELECT balance FROM zvd_bank_accounts WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    if (!acc.rows.length) return c.json({ error: 'Not found' }, 404);
    const today = new Date().toISOString().slice(0, 10);
    await sql`
      INSERT INTO zvd_bank_balance_history (account_id, snapshot_date, balance)
      VALUES (${c.req.param('id')}, ${today}, ${(acc.rows[0] as any).balance})
      ON CONFLICT (account_id, snapshot_date) DO UPDATE SET balance = EXCLUDED.balance
    `.execute(reqDb(c));
    return c.json({ success: true });
  });

  app.get('/accounts/:id/balance-history', async (c) => {
    const rows = await sql`SELECT * FROM zvd_bank_balance_history WHERE account_id = ${c.req.param('id')} ORDER BY snapshot_date DESC LIMIT 365`.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  // ── Stats ─────────────────────────────────────────────────────
  app.get('/stats', async (c) => {
    const accounts = await sql`
      SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as total_balance
      FROM zvd_bank_accounts WHERE is_active = true
    `.execute(reqDb(c));
    const monthly = await sql`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'credit' AND date >= date_trunc('month', NOW())), 0) as income_mtd,
        COALESCE(SUM(amount) FILTER (WHERE type = 'debit'  AND date >= date_trunc('month', NOW())), 0) as expenses_mtd,
        COUNT(*) FILTER (WHERE is_reconciled = false) as unreconciled_count
      FROM zvd_bank_transactions
    `.execute(reqDb(c));
    return c.json({ data: { ...(accounts.rows[0] as any), ...(monthly.rows[0] as any) } });
  });

  return app;
}
