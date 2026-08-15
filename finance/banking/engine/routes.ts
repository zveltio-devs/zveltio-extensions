import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import { createHash } from 'node:crypto';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate, toNumber } from '@zveltio/sdk/extension';

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
async function applyRules(dbh: any, accountId: string, tx: any): Promise<string | null> {
  const rules = await sql`
    SELECT * FROM zvd_bank_rules
    WHERE (account_id = ${accountId} OR account_id IS NULL) AND is_active = true
    ORDER BY priority DESC, created_at ASC
  `.execute(dbh);
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

/**
 * A stable fingerprint for one imported bank transaction.
 *
 * `zvd_bank_transactions.import_hash` has carried a UNIQUE constraint since the
 * table was created, and both import routes end `ON CONFLICT DO NOTHING` — so
 * the deduplication reads as implemented. It never ran: neither INSERT supplied
 * the column, and PostgreSQL does not consider two NULLs equal, so every row
 * conflicted with nothing. Re-importing the same statement inserted every
 * transaction again AND added the whole file's delta to the account balance a
 * second time, because `imported` counts rows returned by RETURNING.
 *
 * The fields are the ones a bank restates identically across two downloads of
 * the same statement. Deliberately NOT the import id or the row's own id: those
 * differ per upload, which is exactly the case this has to catch.
 */
function transactionFingerprint(
  accountId: string,
  t: { date: string; type: string; amount: number; description?: string | null; reference?: string | null },
): string {
  return createHash('sha256')
    .update(
      [accountId, String(t.date), t.type, String(t.amount), t.description ?? '', t.reference ?? ''].join('\u0000'),
    )
    .digest('hex');
}

export function bankingRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

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
    const autoCategory = d.category ?? await applyRules(db, accountId, d);
    const row = await sql`
      INSERT INTO zvd_bank_transactions (account_id, date, type, amount, description, reference, counterparty_name, category, auto_categorized, created_by)
      VALUES (${accountId}, ${d.date}, ${d.type}, ${d.amount}, ${d.description},
        ${d.reference ?? null}, ${d.counterparty_name ?? null}, ${autoCategory ?? null}, ${!d.category && !!autoCategory}, ${user.id})
      RETURNING *
    `.execute(db);
    const delta = d.type === 'credit' ? d.amount : -d.amount;
    await sql`UPDATE zvd_bank_accounts SET balance = balance + ${delta}, updated_at = NOW() WHERE id = ${accountId}`.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── MT940 Import ──────────────────────────────────────────────
  app.post('/accounts/:id/import/mt940', zValidator('json', z.object({
    content: z.string().min(10),
    // Optional because this endpoint takes the statement as a string, not an
    // upload — a UI that read a file has the name, a script pasting content
    // does not. `filename` is nullable (migration 005) rather than defaulted,
    // so an import with no file records no name instead of an invented one.
    filename: z.string().max(255).optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const { content, filename } = c.req.valid('json');
    const accountId = c.req.param('id');
    const transactions = parseMT940(content);
    if (!transactions.length) return c.json({ error: 'No transactions found in MT940 content' }, 400);
    const importRow = await sql`
      INSERT INTO zvd_bank_imports (account_id, source, filename, rows_imported, imported_by)
      VALUES (${accountId}, 'mt940', ${filename ?? null}, ${transactions.length}, ${user.id}) RETURNING id
    `.execute(db);
    const importId = (importRow.rows[0] as any).id;
    let imported = 0;
    let balance_delta = 0;
    for (const t of transactions) {
      const autoCategory = await applyRules(db, accountId, t);
      const result = await sql`
        INSERT INTO zvd_bank_transactions (account_id, import_id, date, type, amount, description, reference, category, auto_categorized, created_by, import_hash)
        VALUES (${accountId}, ${importId}, ${t.date}, ${t.type}, ${t.amount}, ${t.description}, ${t.reference}, ${autoCategory}, ${!!autoCategory}, ${user.id}, ${transactionFingerprint(accountId, t)})
        ON CONFLICT DO NOTHING RETURNING id
      `.execute(db);
      if (result.rows.length) {
        balance_delta += t.type === 'credit' ? t.amount : -t.amount;
        imported++;
      }
    }
    await sql`UPDATE zvd_bank_accounts SET balance = balance + ${balance_delta}, updated_at = NOW() WHERE id = ${accountId}`.execute(db);
    return c.json({ data: { import_id: importId, total: transactions.length, imported, skipped: transactions.length - imported } }, 201);
  });

  // ── CSV Import ────────────────────────────────────────────────
  app.post('/accounts/:id/import', zValidator('json', z.object({
    source: z.string().default('csv'),
    // Same reasoning as the MT940 route: this takes parsed transactions, not a
    // file, so the name is only available when a UI did the parsing.
    filename: z.string().max(255).optional(),
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
      INSERT INTO zvd_bank_imports (account_id, source, filename, rows_imported, imported_by)
      VALUES (${accountId}, ${d.source}, ${d.filename ?? null}, ${d.transactions.length}, ${user.id}) RETURNING id
    `.execute(db);
    const importId = (importRow.rows[0] as any).id;
    let balance_delta = 0;
    let imported = 0;
    for (const t of d.transactions) {
      const autoCategory = await applyRules(db, accountId, t);
      const result = await sql`
        INSERT INTO zvd_bank_transactions (account_id, import_id, date, type, amount, description, reference, counterparty_name, category, auto_categorized, created_by, import_hash)
        VALUES (${accountId}, ${importId}, ${t.date}, ${t.type}, ${t.amount}, ${t.description},
          ${t.reference ?? null}, ${t.counterparty_name ?? null}, ${autoCategory}, ${!!autoCategory}, ${user.id},
          ${transactionFingerprint(accountId, t)})
        ON CONFLICT DO NOTHING RETURNING id
      `.execute(db);
      if (result.rows.length) {
        balance_delta += t.type === 'credit' ? t.amount : -t.amount;
        imported++;
      }
    }
    await sql`UPDATE zvd_bank_accounts SET balance = balance + ${balance_delta}, updated_at = NOW() WHERE id = ${accountId}`.execute(db);
    return c.json({ data: { import_id: importId, imported } }, 201);
  });

  // ── Categorization Rules ──────────────────────────────────────
  app.get('/accounts/:id/rules', async (c) => {
    const rows = await sql`SELECT * FROM zvd_bank_rules WHERE account_id = ${c.req.param('id')} OR account_id IS NULL ORDER BY priority DESC, created_at`.execute(db);
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
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  app.delete('/rules/:id', async (c) => {
    await sql`DELETE FROM zvd_bank_rules WHERE id = ${c.req.param('id')}`.execute(db);
    return c.json({ success: true });
  });

  // Re-apply rules to all unreconciled transactions
  app.post('/accounts/:id/re-categorize', async (c) => {
    const txns = await sql`SELECT * FROM zvd_bank_transactions WHERE account_id = ${c.req.param('id')} AND is_reconciled = false`.execute(db);
    let updated = 0;
    for (const tx of txns.rows as any[]) {
      const cat = await applyRules(db, c.req.param('id'), tx);
      if (cat && cat !== tx.category) {
        await sql`UPDATE zvd_bank_transactions SET category = ${cat}, auto_categorized = true WHERE id = ${tx.id}`.execute(db);
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
    const tx = await sql`SELECT * FROM zvd_bank_transactions WHERE id = ${c.req.param('txId')} AND account_id = ${c.req.param('id')}`.execute(db);
    if (!tx.rows.length) return c.json({ error: 'Not found' }, 404);
    await sql`UPDATE zvd_bank_transactions SET is_reconciled = true, updated_at = NOW() WHERE id = ${c.req.param('txId')}`.execute(db);
    const rec = await sql`
      INSERT INTO zvd_bank_reconciliations (transaction_id, linked_type, linked_id, matched_amount, notes, created_by)
      VALUES (${c.req.param('txId')}, ${d.linked_type}, ${d.linked_id ?? null}, ${(tx.rows[0] as any).amount}, ${d.notes ?? null}, ${user.id})
      ON CONFLICT (transaction_id) DO UPDATE SET linked_type = EXCLUDED.linked_type, linked_id = EXCLUDED.linked_id, notes = EXCLUDED.notes
      RETURNING *
    `.execute(db);

    // Reconciling against an invoice has to PAY the invoice.
    //
    // This route used to set `is_reconciled` on the bank side and stop. The
    // invoice stayed `sent`, aged into `overdue`, kept appearing in the
    // cash-flow forecast as expected inflow — `GET /cash-flow` selects
    // `status IN ('sent','overdue')` — and kept appearing in the very
    // suggest-matches list it had just been matched from, because that list
    // filters on the same statuses. The user does the workflow the manifest
    // advertises, and nothing on the other side moves.
    //
    // Through the service rather than an UPDATE on `zvd_invoices`: that table
    // belongs to `finance/invoicing`, and one extension writing another's table
    // is what produced H-6 in `ecommerce/store` — a NOT NULL violated silently
    // for the life of the feature. When invoicing is not installed there is
    // nothing to pay and the reconciliation still stands on its own.
    let paid: unknown = null;
    if (d.linked_type === 'invoice' && d.linked_id) {
      const recordPayment = ctx.services.get<
        (input: {
          invoiceId: string;
          amount: number;
          paymentDate?: string;
          method?: string;
          reference?: string;
          notes?: string;
          userId: string;
        }) => Promise<unknown>
      >('invoicing.recordPayment');
      if (recordPayment) {
        const t = tx.rows[0] as any;
        try {
          paid = await recordPayment({
            invoiceId: d.linked_id,
            amount: Math.abs(toNumber(t.amount, 0, 'transaction.amount')),
            paymentDate: t.date instanceof Date ? t.date.toISOString().slice(0, 10) : String(t.date),
            method: 'transfer',
            reference: t.reference ?? null ? String(t.reference) : undefined,
            notes: d.notes,
            userId: user.id,
          });
        } catch (err) {
          // Not silent. The reconciliation is recorded either way — that is the
          // bank's own bookkeeping and it is true — but an operator who thinks
          // an invoice was settled and finds it open deserves to know which half
          // failed.
          console.warn(
            `[banking] reconciled transaction ${c.req.param('txId')} but could not record the payment on invoice ${d.linked_id}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    }

    return c.json({ data: rec.rows[0], invoice: paid });
  });

  // Suggest unreconciled invoice matches
  app.get('/accounts/:id/suggest-matches', async (c) => {
    const txns = await sql`
      SELECT t.*, i.id as invoice_id, i.number as invoice_number, i.total as invoice_total
      FROM zvd_bank_transactions t
      JOIN zvd_invoices i ON ABS(i.total - t.amount) < 0.01 AND i.status IN ('sent','overdue')
      WHERE t.account_id = ${c.req.param('id')} AND t.is_reconciled = false AND t.type = 'credit'
      ORDER BY t.date DESC LIMIT 50
    `.execute(db).catch(() => ({ rows: [] }));
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
    `.execute(db);
    // Also include expected payments from open invoices
    const invoices = await sql`
      SELECT due_date as expected_date, 'inflow' as type, total - amount_paid as amount, 'Invoice ' || number as description, 'accounts_receivable' as category
      FROM zvd_invoices WHERE status IN ('sent','overdue') AND due_date BETWEEN ${fromDate} AND ${toDate}
    `.execute(db).catch(() => ({ rows: [] }));
    // `expected_date` is a DATE column and Bun's driver returns DATE as a
    // JavaScript `Date`, which has no `localeCompare`. `Array.prototype.sort`
    // does not call the comparator for arrays of length 0 or 1, so this answered
    // 200 while the tenant had at most one cash-flow row and threw a TypeError
    // from the moment it had two — permanently, with no way back to a 200
    // except deleting data.
    const toTime = (v: unknown): number =>
      v instanceof Date ? v.getTime() : new Date(String(v)).getTime();
    return c.json({
      data: [...forecast.rows, ...invoices.rows].sort(
        (a: any, b: any) => toTime(a.expected_date) - toTime(b.expected_date),
      ),
    });
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
    `.execute(db);
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Balance history snapshot ──────────────────────────────────
  app.post('/accounts/:id/snapshot', async (c) => {
    const acc = await sql`SELECT balance FROM zvd_bank_accounts WHERE id = ${c.req.param('id')}`.execute(db);
    if (!acc.rows.length) return c.json({ error: 'Not found' }, 404);
    const today = new Date().toISOString().slice(0, 10);
    await sql`
      INSERT INTO zvd_bank_balance_history (account_id, snapshot_date, balance)
      VALUES (${c.req.param('id')}, ${today}, ${(acc.rows[0] as any).balance})
      ON CONFLICT (account_id, snapshot_date) DO UPDATE SET balance = EXCLUDED.balance
    `.execute(db);
    return c.json({ success: true });
  });

  app.get('/accounts/:id/balance-history', async (c) => {
    const rows = await sql`SELECT * FROM zvd_bank_balance_history WHERE account_id = ${c.req.param('id')} ORDER BY snapshot_date DESC LIMIT 365`.execute(db);
    return c.json({ data: rows.rows });
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
        COALESCE(SUM(amount) FILTER (WHERE type = 'debit'  AND date >= date_trunc('month', NOW())), 0) as expenses_mtd,
        COUNT(*) FILTER (WHERE is_reconciled = false) as unreconciled_count
      FROM zvd_bank_transactions
    `.execute(db);
    return c.json({ data: { ...(accounts.rows[0] as any), ...(monthly.rows[0] as any) } });
  });

  return app;
}
