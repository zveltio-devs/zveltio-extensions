import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

export function assetsRoutes(ctx: ExtensionContext): Hono {
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

  app.use('*', permissionGate(ctx, 'assets'));

  // ── Assets ────────────────────────────────────────────────────
  app.get('/', async (c) => {
    const { limit = '50', page = '1', status, category } = c.req.query();
    const lim = Math.min(+limit, 200);
    const offset = (Math.max(1, +page) - 1) * lim;
    const rows = await sql`SELECT * FROM zvd_assets WHERE (${status ? sql`status = ${status}` : sql`TRUE`}) AND (${category ? sql`category = ${category}` : sql`TRUE`}) ORDER BY created_at DESC LIMIT ${lim} OFFSET ${offset}`.execute(reqDb(c));
    return c.json({ data: rows.rows });
  });

  // GET /stats — MUST precede /:id, else the param route captures "stats"
  // as :id and the UUID cast on zvd_assets.id 500s.
  app.get('/stats', async (c) => {
    const row = await sql`
      SELECT COUNT(*) as total_assets, COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'disposed') as disposed,
        COALESCE(SUM(purchase_cost), 0) as total_purchase_cost,
        COALESCE(SUM(current_value), 0) as total_current_value,
        COALESCE(SUM(accumulated_depreciation), 0) as total_depreciation,
        COUNT(*) FILTER (WHERE warranty_expiry < CURRENT_DATE) as warranty_expired,
        COUNT(*) FILTER (WHERE next_maintenance_date <= CURRENT_DATE + 30) as maintenance_due
      FROM zvd_assets
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] });
  });

  app.get('/:id', async (c) => {
    const row = await sql`
      SELECT a.*,
        COALESCE((SELECT json_agg(d ORDER BY d.period_date) FROM zvd_asset_depreciation d WHERE d.asset_id = a.id), '[]'::json) as depreciation_schedule,
        COALESCE((SELECT json_agg(m ORDER BY m.date DESC) FROM zvd_asset_maintenance m WHERE m.asset_id = a.id), '[]'::json) as maintenance_logs,
        COALESCE((SELECT json_agg(ins) FROM zvd_asset_insurance ins WHERE ins.asset_id = a.id), '[]'::json) as insurance_policies
      FROM zvd_assets a
      WHERE a.id = ${c.req.param('id')}
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/', zValidator('json', z.object({
    name: z.string().min(1),
    asset_code: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    serial_number: z.string().optional(),
    location: z.string().optional(),
    purchase_date: z.string(),
    purchase_cost: z.number().positive(),
    useful_life_years: z.number().int().positive(),
    residual_value: z.number().min(0).default(0),
    depreciation_method: z.enum(['straight_line','declining_balance']).default('straight_line'),
    warranty_expiry: z.string().optional(),
    depreciation_account_id: z.string().uuid().optional(),
    accumulated_dep_account_id: z.string().uuid().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_assets (name, asset_code, category, description, serial_number, location,
        purchase_date, purchase_cost, current_value, useful_life_years, residual_value,
        depreciation_method, warranty_expiry, depreciation_account_id, accumulated_dep_account_id, created_by)
      VALUES (${d.name}, ${d.asset_code ?? null}, ${d.category ?? null}, ${d.description ?? null},
        ${d.serial_number ?? null}, ${d.location ?? null}, ${d.purchase_date}, ${d.purchase_cost},
        ${d.purchase_cost}, ${d.useful_life_years}, ${d.residual_value}, ${d.depreciation_method},
        ${d.warranty_expiry ?? null}, ${d.depreciation_account_id ?? null}, ${d.accumulated_dep_account_id ?? null}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    const asset = row.rows[0] as any;
    // Pre-compute depreciation schedule
    const annualRate = d.depreciation_method === 'straight_line'
      ? (d.purchase_cost - d.residual_value) / d.useful_life_years : null;
    const decliningRate = d.depreciation_method === 'declining_balance' ? 2 / d.useful_life_years : null;
    let bookValue = d.purchase_cost;
    for (let year = 1; year <= d.useful_life_years; year++) {
      const periodDate = new Date(d.purchase_date);
      periodDate.setFullYear(periodDate.getFullYear() + year);
      let amount: number;
      if (d.depreciation_method === 'straight_line') {
        amount = annualRate!;
      } else {
        amount = Math.max(bookValue * decliningRate!, 0);
        if (bookValue - amount < d.residual_value) amount = Math.max(bookValue - d.residual_value, 0);
      }
      bookValue = Math.max(bookValue - amount, d.residual_value);
      await sql`INSERT INTO zvd_asset_depreciation (asset_id, period_date, amount, book_value_after) VALUES (${asset.id}, ${periodDate.toISOString().slice(0, 10)}, ${amount}, ${bookValue})`.execute(reqDb(c));
    }
    return c.json({ data: asset }, 201);
  });

  app.patch('/:id', zValidator('json', z.object({
    name: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(['active','disposed','under_maintenance']).optional(),
    current_value: z.number().optional(),
    notes: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_assets SET
        name = COALESCE(${d.name ?? null}, name), location = COALESCE(${d.location ?? null}, location),
        status = COALESCE(${d.status ?? null}, status), current_value = COALESCE(${d.current_value ?? null}, current_value),
        notes = COALESCE(${d.notes ?? null}, notes), updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  // ── Depreciation posting ──────────────────────────────────────
  app.post('/:id/post-depreciation', zValidator('json', z.object({
    period_date: z.string(),
    journal_date: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const dep = await sql`
      SELECT dep.*, a.depreciation_account_id, a.accumulated_dep_account_id, a.name as asset_name
      FROM zvd_asset_depreciation dep JOIN zvd_assets a ON a.id = dep.asset_id
      WHERE dep.asset_id = ${c.req.param('id')} AND dep.period_date = ${d.period_date} AND dep.is_posted = false
    `.execute(reqDb(c));
    if (!dep.rows.length) return c.json({ error: 'Depreciation period not found or already posted' }, 400);
    const depRow = dep.rows[0] as any;
    if (!depRow.depreciation_account_id || !depRow.accumulated_dep_account_id) {
      return c.json({ error: 'Asset must have depreciation_account_id and accumulated_dep_account_id set' }, 400);
    }
    // Create journal entry
    const entry = await sql`
      INSERT INTO zvd_journal_entries (date, description, reference, created_by)
      VALUES (${d.journal_date ?? d.period_date}, ${'Depreciation: ' + depRow.asset_name}, ${'DEP-' + depRow.id}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    const entryId = (entry.rows[0] as any).id;
    await sql`INSERT INTO zvd_journal_lines (entry_id, account_id, debit, credit, description) VALUES (${entryId}, ${depRow.depreciation_account_id}, ${depRow.amount}, 0, ${'Depreciation expense'})`.execute(reqDb(c));
    await sql`INSERT INTO zvd_journal_lines (entry_id, account_id, debit, credit, description) VALUES (${entryId}, ${depRow.accumulated_dep_account_id}, 0, ${depRow.amount}, ${'Accumulated depreciation'})`.execute(reqDb(c));
    await sql`UPDATE zvd_journal_entries SET status = 'posted' WHERE id = ${entryId}`.execute(reqDb(c));
    await sql`UPDATE zvd_asset_depreciation SET is_posted = true, journal_entry_id = ${entryId} WHERE id = ${depRow.id}`.execute(reqDb(c));
    await sql`UPDATE zvd_assets SET accumulated_depreciation = accumulated_depreciation + ${depRow.amount}, current_value = ${depRow.book_value_after}, updated_at = NOW() WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ data: entry.rows[0] }, 201);
  });

  app.post('/:id/dispose', zValidator('json', z.object({
    disposal_date: z.string(),
    disposal_value: z.number().min(0).default(0),
    reason: z.string().optional(),
  })), async (c) => {
    const d = c.req.valid('json');
    const row = await sql`
      UPDATE zvd_assets SET status = 'disposed', disposal_date = ${d.disposal_date},
        disposal_value = ${d.disposal_value}, disposal_reason = ${d.reason ?? null}, current_value = 0, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status != 'disposed' RETURNING *
    `.execute(reqDb(c));
    if (!row.rows.length) return c.json({ error: 'Asset not found or already disposed' }, 400);
    return c.json({ data: row.rows[0] });
  });

  // ── Transfers ─────────────────────────────────────────────────
  app.post('/:id/transfer', zValidator('json', z.object({
    to_location: z.string().min(1),
    transfer_date: z.string(),
    reason: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const asset = await sql`SELECT location FROM zvd_assets WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    if (!asset.rows.length) return c.json({ error: 'Not found' }, 404);
    const fromLocation = (asset.rows[0] as any).location;
    await sql`UPDATE zvd_assets SET location = ${d.to_location}, updated_at = NOW() WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    const row = await sql`
      INSERT INTO zvd_asset_transfers (asset_id, from_location, to_location, transfer_date, reason, transferred_by)
      VALUES (${c.req.param('id')}, ${fromLocation ?? null}, ${d.to_location}, ${d.transfer_date}, ${d.reason ?? null}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Insurance ─────────────────────────────────────────────────
  app.post('/:id/insurance', zValidator('json', z.object({
    policy_number: z.string().min(1),
    insurer: z.string().min(1),
    type: z.string().default('property'),
    insured_value: z.number().positive(),
    premium: z.number().optional(),
    start_date: z.string(),
    end_date: z.string(),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_asset_insurance (asset_id, policy_number, insurer, type, insured_value, premium, start_date, end_date, notes, created_by)
      VALUES (${c.req.param('id')}, ${d.policy_number}, ${d.insurer}, ${d.type}, ${d.insured_value}, ${d.premium ?? null}, ${d.start_date}, ${d.end_date}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ data: row.rows[0] }, 201);
  });

  // ── Revaluation ───────────────────────────────────────────────
  app.post('/:id/revalue', zValidator('json', z.object({
    revaluation_date: z.string(),
    new_value: z.number().positive(),
    method: z.enum(['market','cost','expert_opinion']).default('market'),
    notes: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const asset = await sql`SELECT current_value FROM zvd_assets WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    if (!asset.rows.length) return c.json({ error: 'Not found' }, 404);
    const prev = (asset.rows[0] as any).current_value;
    const rev = await sql`
      INSERT INTO zvd_asset_revaluations (asset_id, revaluation_date, previous_value, new_value, method, notes, created_by)
      VALUES (${c.req.param('id')}, ${d.revaluation_date}, ${prev}, ${d.new_value}, ${d.method}, ${d.notes ?? null}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    await sql`UPDATE zvd_assets SET current_value = ${d.new_value}, updated_at = NOW() WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    return c.json({ data: rev.rows[0] });
  });

  // ── Maintenance ───────────────────────────────────────────────
  app.post('/:id/maintenance', zValidator('json', z.object({
    date: z.string(),
    type: z.enum(['scheduled','repair','inspection']).default('scheduled'),
    description: z.string().min(1),
    cost: z.number().min(0).default(0),
    performed_by: z.string().optional(),
    next_maintenance_date: z.string().optional(),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');
    const row = await sql`
      INSERT INTO zvd_asset_maintenance (asset_id, date, type, description, cost, performed_by, next_maintenance_date, created_by)
      VALUES (${c.req.param('id')}, ${d.date}, ${d.type}, ${d.description}, ${d.cost}, ${d.performed_by ?? null}, ${d.next_maintenance_date ?? null}, ${user.id})
      RETURNING *
    `.execute(reqDb(c));
    if (d.next_maintenance_date) {
      await sql`UPDATE zvd_assets SET next_maintenance_date = ${d.next_maintenance_date}, updated_at = NOW() WHERE id = ${c.req.param('id')}`.execute(reqDb(c));
    }
    return c.json({ data: row.rows[0] }, 201);
  });

  return app;
}
