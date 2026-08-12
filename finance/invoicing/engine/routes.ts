import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

// These helpers receive an already-scoped db (the caller passes
// `db`), so they use that parameter directly. They're declared
// outside the route factory closure, so they cannot reference `c`.
/**
 * Claim the next number in a series.
 *
 * This used to be `nextval('zvd_invoice_seq')` — ONE Postgres sequence for the
 * whole instance. A sequence has no tenant, so two companies sharing an install
 * interleave: the first takes 1, 3, 7, the second 2, 4, 5, and each is left with
 * permanent holes in its own numbering. Cod fiscal art. 319 alin. (20) lit. a)
 * wants a sequential number based on one or more series, continuous for the
 * issuer, and a hole is precisely what an inspection asks about. The `prefix`
 * parameter existed and nobody ever passed one, so 'INV' was not a default so
 * much as the only possible answer.
 *
 * `UPDATE ... RETURNING` claims the number in a single statement, so two
 * requests issuing at once cannot read the same value: the second waits on the
 * row lock and gets the number after. Returning nothing means the series does
 * not belong to this tenant — RLS filters the row out — which the caller turns
 * into a 400 rather than inventing a number.
 */
async function claimNumber(
  dbh: any,
  docType: string,
  series?: string,
): Promise<{ number: string; series: string } | null> {
  const row = await sql<{ series: string; next_number: string; padding: number }>`
    UPDATE zvd_document_series
       SET next_number = next_number + 1, updated_at = NOW()
     WHERE id = (
       SELECT id FROM zvd_document_series
        WHERE doc_type = ${docType}
          AND (${series ?? null}::text IS NULL OR series = ${series ?? null})
        ORDER BY is_default DESC, created_at
        LIMIT 1
     )
    RETURNING series, next_number - 1 AS next_number, padding
  `.execute(dbh);
  const r = row.rows[0];
  if (!r) return null;
  return {
    number: `${r.series}-${String(r.next_number).padStart(r.padding, '0')}`,
    series: r.series,
  };
}

/**
 * The issuing company, or null when nobody has filled it in yet.
 *
 * Copied onto each invoice at issue time rather than joined at read time: a
 * company moves, changes bank, is renamed — and a document already issued has
 * to keep showing what was printed on it. A foreign key would quietly rewrite
 * every past invoice the moment someone edits the profile.
 */
async function companyProfile(dbh: any): Promise<any | null> {
  const row = await sql`SELECT * FROM zvd_company_profile LIMIT 1`.execute(dbh);
  return (row.rows[0] as any) ?? null;
}

/**
 * HTML-escape. Every value printed on the invoice goes through this.
 *
 * None of them did. The client name, the address, the line descriptions and the
 * notes are all free text somebody types, and they were interpolated straight
 * into the document — so a client called `<script>...` ran when the invoice was
 * previewed, printed or opened out of an email. On a document whose entire
 * purpose is to be sent to other people, that is the wrong place to trust input.
 */
function esc(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** A DATE column as `YYYY-MM-DD`; the driver hands these over as Date objects. */
function fmtDate(value: unknown): string {
  if (!value) return '';
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

/**
 * Is this a syntactically valid Romanian tax code?
 *
 * A CUI carries a check digit, and ANAF verifies it. The validator returns
 * "CUI cumparator incorect" and refuses the whole submission — which is a bad
 * moment to find out, because by then the invoice is issued, numbered and
 * usually already sent to the client. Catching it at entry costs nothing.
 *
 * Algorithm as published: the digits before the last are weighted by
 * 7,5,3,2,1,7,5,3,2 right-aligned, the sum is multiplied by 10 and taken
 * modulo 11, and a result of 10 counts as 0. That is the last digit.
 *
 * The "RO" prefix is optional and stripped; it marks VAT registration, not
 * identity. Non-Romanian buyers are not checked here — their identifiers follow
 * their own country's rules, and rejecting them would be worse than accepting
 * one that is wrong.
 */
function isValidCui(value: string): boolean {
  const digits = String(value).trim().toUpperCase().replace(/^RO/, '').replace(/\s/g, '');
  if (!/^\d{2,10}$/.test(digits)) return false;
  const body = digits.slice(0, -1);
  const check = Number(digits.slice(-1));
  const key = '753217532';
  const padded = body.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(padded[i]) * Number(key[i]);
  const computed = (sum * 10) % 11;
  return (computed === 10 ? 0 : computed) === check;
}

async function nextCreditNoteNumber(dbh: any): Promise<string> {
  const row = await sql`SELECT nextval('zvd_credit_note_seq') as n`.execute(dbh);
  const n = (row.rows[0] as any).n;
  return `CN-${String(n).padStart(5, '0')}`;
}

/**
 * May this user record a payment against an invoice, or cancel one?
 *
 * Recording a payment says the customer paid. Nothing else in the system
 * verifies that — it is a claim, and it closes a receivable. Cancelling an
 * invoice removes a document that has already been issued, and in Romania an
 * issued invoice is cancelled by a specific procedure rather than by deletion.
 *
 * Both sat behind one `invoices` permission, which is also what somebody needs
 * to draft an invoice at all.
 *
 * `invoices:settle` and `invoices:cancel`, granted deliberately, with `admin`
 * still sufficient so an existing install keeps working before anyone edits
 * policies.
 */
async function mayDecideInvoice(
  ctx: ExtensionContext,
  user: any,
  action: 'settle' | 'cancel',
): Promise<boolean> {
  if (await ctx.checkPermission(user.id, 'invoices', action).catch(() => false)) return true;
  return ctx.checkPermission(user.id, 'admin', '*').catch(() => false);
}

export function invoicingRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  app.use('*', permissionGate(ctx, 'invoices'));

  // ── The issuing company ───────────────────────────────────────
  // One row per tenant. PUT upserts, because "save my company details" is one
  // action to the person doing it and they should not have to know whether a
  // row exists yet.
  app.get('/company', async (c) => c.json({ data: await companyProfile(db) }));

  const companySchema = z.object({
    name: z.string().min(1),
    legal_name: z.string().optional(),
    tax_id: z.string().optional(),
    reg_no: z.string().optional(),
    vat_payer: z.boolean().optional(),
    vat_on_collection: z.boolean().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    county: z.string().optional(),
    country: z.string().optional(),
    iban: z.string().optional(),
    bank: z.string().optional(),
    share_capital: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    logo_url: z.string().optional(),
  });

  // POST as well as PUT: the declarative settings renderer saves with POST,
  // and "save my company details" is one action to the person doing it — not a
  // question of whether a row already exists. Same handler, both verbs.
  const saveCompany = zValidator('json', companySchema);
  app.post('/company', saveCompany, async (c) => companyUpsert(c));
  app.put('/company', saveCompany, async (c) => companyUpsert(c));

  // biome-ignore lint/suspicious/noExplicitAny: legacy any; tracked in docs/HARDENING-9-PLAN.md H-01
  async function companyUpsert(c: any) {
    const d = c.req.valid('json');
    // The seller's own code goes on every document this company will ever
    // issue, so a typo here is not one rejected invoice, it is all of them.
    if (d.tax_id && (!d.country || d.country.toUpperCase() === 'RO') && !isValidCui(d.tax_id)) {
      return c.json(
        { error: `"${d.tax_id}" is not a valid Romanian tax code — the check digit does not match.` },
        400,
      );
    }
    const existing = await companyProfile(db);
    const row = existing
      ? await sql`
          UPDATE zvd_company_profile SET
            name = ${d.name}, legal_name = ${d.legal_name ?? null},
            tax_id = ${d.tax_id ?? null}, reg_no = ${d.reg_no ?? null},
            vat_payer = ${d.vat_payer ?? true}, vat_on_collection = ${d.vat_on_collection ?? false},
            address = ${d.address ?? null}, city = ${d.city ?? null},
            county = ${d.county ?? null}, country = ${d.country ?? 'RO'},
            iban = ${d.iban ?? null}, bank = ${d.bank ?? null},
            share_capital = ${d.share_capital ?? null}, email = ${d.email ?? null},
            phone = ${d.phone ?? null}, website = ${d.website ?? null},
            logo_url = ${d.logo_url ?? null}, updated_at = NOW()
          WHERE id = ${existing.id} RETURNING *
        `.execute(db)
      : await sql`
          INSERT INTO zvd_company_profile
            (name, legal_name, tax_id, reg_no, vat_payer, vat_on_collection, address,
             city, county, country, iban, bank, share_capital, email, phone, website, logo_url)
          VALUES
            (${d.name}, ${d.legal_name ?? null}, ${d.tax_id ?? null}, ${d.reg_no ?? null},
             ${d.vat_payer ?? true}, ${d.vat_on_collection ?? false}, ${d.address ?? null},
             ${d.city ?? null}, ${d.county ?? null}, ${d.country ?? 'RO'},
             ${d.iban ?? null}, ${d.bank ?? null}, ${d.share_capital ?? null},
             ${d.email ?? null}, ${d.phone ?? null}, ${d.website ?? null}, ${d.logo_url ?? null})
          RETURNING *
        `.execute(db);
    return c.json({ data: row.rows[0] });
  }

  // ── Document series ───────────────────────────────────────────
  app.get('/series', async (c) => {
    const rows = await sql`
      SELECT * FROM zvd_document_series ORDER BY doc_type, is_default DESC, series
    `.execute(db);
    return c.json({ data: rows.rows });
  });

  app.post('/series',
    zValidator('json', z.object({
      doc_type: z.enum(['invoice', 'proforma', 'credit_note', 'receipt', 'delivery_note']).default('invoice'),
      series: z.string().min(1).max(16),
      // Where this series starts. Someone migrating from other software
      // continues their old numbering rather than restarting at one.
      next_number: z.number().int().positive().default(1),
      padding: z.number().int().min(1).max(10).default(4),
      is_default: z.boolean().default(false),
    })),
    async (c) => {
      const d = c.req.valid('json');
      // Exactly one default per document type, or issuing has to guess.
      if (d.is_default) {
        await sql`
          UPDATE zvd_document_series SET is_default = FALSE WHERE doc_type = ${d.doc_type}
        `.execute(db);
      }
      const row = await sql`
        INSERT INTO zvd_document_series (doc_type, series, next_number, padding, is_default)
        VALUES (${d.doc_type}, ${d.series}, ${d.next_number}, ${d.padding}, ${d.is_default})
        RETURNING *
      `.execute(db).catch(() => null);
      if (!row?.rows.length) {
        return c.json({ error: `Series "${d.series}" already exists for ${d.doc_type}` }, 400);
      }
      return c.json({ data: row.rows[0] }, 201);
    },
  );

  app.delete('/series/:id', async (c) => {
    const row = await sql`
      DELETE FROM zvd_document_series WHERE id = ${c.req.param('id')} RETURNING id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });

  // ── Catalogue ─────────────────────────────────────────────────
  // What a company sells, so an invoice line is picked rather than retyped —
  // and the VAT rate comes from the item instead of from memory.
  /**
   * What can go on an invoice line: stock items and services, in one list.
   *
   * `operations/inventory` already owns products — it has done all along, with
   * `inventory.products.list` published for exactly this — and this extension
   * grew its own `zvd_catalogue_items` table anyway. That is a duplicate
   * catalogue: the same goods maintained twice, drifting apart, with the price
   * on an invoice eventually disagreeing with the price in the warehouse.
   *
   * Products now come from inventory when it is installed. The local table
   * keeps its purpose rather than being deleted: a service is not stock. A
   * consultancy has no warehouse and must still be able to invoice; a shop has
   * both and should maintain its goods in one place.
   *
   * Inventory is OPTIONAL, as CRM is for client lookup. `services.get` returns
   * null when it is not active, and the local table answers alone.
   */
  app.get('/catalogue', async (c) => {
    const rows = await sql`
      SELECT * FROM zvd_catalogue_items WHERE is_active = TRUE ORDER BY name
    `.execute(db);
    // biome-ignore lint/suspicious/noExplicitAny: cross-extension service payload
    const local = rows.rows as any[];

    const listProducts = ctx.services.get<
      // biome-ignore lint/suspicious/noExplicitAny: cross-extension service payload
      (opts?: { active?: boolean; q?: string }) => Promise<any[]>
    >('inventory.products.list');
    if (!listProducts) return c.json({ data: local });

    // biome-ignore lint/suspicious/noExplicitAny: cross-extension service payload
    const products = (await listProducts({ active: true }).catch(() => [])) as any[];
    // Mapped into the shape an invoice line expects, so the picker does not
    // have to know which extension a row came from. `sale_price` is what a
    // customer pays; `cost_price` is what we paid, and putting that on an
    // invoice would be a costly kind of wrong.
    const mapped = products.map((p) => ({
      id: p.id,
      code: p.sku,
      name: p.name,
      description: p.description,
      kind: 'product',
      unit: p.unit,
      unit_price: p.sale_price,
      currency: 'RON',
      tax_rate: p.tax_rate,
      is_active: p.is_active,
      source: 'inventory',
    }));

    // A local item whose code matches a product is the older duplicate; the
    // warehouse wins, because that is where the goods actually are.
    const codes = new Set(mapped.map((p) => String(p.code ?? '').toLowerCase()).filter(Boolean));
    const services = local
      .filter((i) => !i.code || !codes.has(String(i.code).toLowerCase()))
      .map((i) => ({ ...i, source: 'invoicing' }));

    return c.json({ data: [...mapped, ...services].sort((a, b) => String(a.name).localeCompare(String(b.name))) });
  });

  app.post('/catalogue',
    zValidator('json', z.object({
      code: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      kind: z.enum(['product', 'service']).default('service'),
      unit: z.string().default('buc'),
      unit_price: z.number().min(0).default(0),
      currency: z.string().default('RON'),
      tax_rate: z.number().min(0).max(100).default(19),
    })),
    async (c) => {
      const d = c.req.valid('json');
      const row = await sql`
        INSERT INTO zvd_catalogue_items (code, name, description, kind, unit, unit_price, currency, tax_rate)
        VALUES (${d.code ?? null}, ${d.name}, ${d.description ?? null}, ${d.kind},
                ${d.unit}, ${d.unit_price}, ${d.currency}, ${d.tax_rate})
        RETURNING *
      `.execute(db).catch(() => null);
      if (!row?.rows.length) return c.json({ error: `Code "${d.code}" already exists` }, 400);
      return c.json({ data: row.rows[0] }, 201);
    },
  );

  app.patch('/catalogue/:id',
    zValidator('json', z.object({
      code: z.string().optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      kind: z.enum(['product', 'service']).optional(),
      unit: z.string().optional(),
      unit_price: z.number().min(0).optional(),
      currency: z.string().optional(),
      tax_rate: z.number().min(0).max(100).optional(),
      is_active: z.boolean().optional(),
    })),
    async (c) => {
      const d = c.req.valid('json');
      const row = await sql`
        UPDATE zvd_catalogue_items SET
          code = COALESCE(${d.code ?? null}, code),
          name = COALESCE(${d.name ?? null}, name),
          description = COALESCE(${d.description ?? null}, description),
          kind = COALESCE(${d.kind ?? null}, kind),
          unit = COALESCE(${d.unit ?? null}, unit),
          unit_price = COALESCE(${d.unit_price ?? null}, unit_price),
          currency = COALESCE(${d.currency ?? null}, currency),
          tax_rate = COALESCE(${d.tax_rate ?? null}, tax_rate),
          is_active = COALESCE(${d.is_active ?? null}, is_active),
          updated_at = NOW()
        WHERE id = ${c.req.param('id')}
        RETURNING *
      `.execute(db);
      if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
      return c.json({ data: row.rows[0] });
    },
  );

  // Retired rather than removed: a catalogue item is referenced by the lines of
  // every invoice that ever used it, and deleting the thing you sold last year
  // is not how you stop selling it this year.
  app.delete('/catalogue/:id', async (c) => {
    const row = await sql`
      UPDATE zvd_catalogue_items SET is_active = FALSE, updated_at = NOW()
      WHERE id = ${c.req.param('id')} RETURNING id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });

  // ── Proforma → invoice ────────────────────────────────────────
  // A proforma requests payment; it records no supply and carries no VAT
  // liability. Converting copies it into a real invoice, numbered from the
  // invoice series, and remembers where it came from.
  app.post('/invoices/:id/convert', async (c) => {
    const user = c.get('user') as any;
    const src = await sql`
      SELECT * FROM zvd_invoices WHERE id = ${c.req.param('id')} AND doc_type = 'proforma'
    `.execute(db);
    if (!src.rows.length) return c.json({ error: 'Proforma not found' }, 404);
    const p = src.rows[0] as any;

    const already = await sql`
      SELECT number FROM zvd_invoices WHERE converted_from_id = ${p.id} LIMIT 1
    `.execute(db);
    if (already.rows.length) {
      return c.json(
        { error: `Already converted to ${(already.rows[0] as any).number}` },
        400,
      );
    }

    const claimed = await claimNumber(db, 'invoice');
    if (!claimed) return c.json({ error: 'No invoice series configured' }, 400);

    const inv = await sql`
      INSERT INTO zvd_invoices (
        number, series, doc_type, converted_from_id,
        client_id, client_type, client_name, client_email, client_address,
        client_tax_id, client_reg_no, client_city, client_county, client_country,
        seller_name, seller_tax_id, seller_reg_no, seller_address, seller_city, seller_county, seller_country, seller_iban, seller_bank,
        issue_date, delivery_date, due_date, currency, subtotal, tax_rate, tax_amount, total,
        discount_amount, discount_percent, vat_breakdown, vat_regime, vat_exemption_reason,
        exchange_rate, exchange_date, tax_amount_ron, notes, footer_notes, po_number,
        amount_paid, created_by
      )
      SELECT ${claimed.number}, ${claimed.series}, 'invoice', ${p.id},
        client_id, client_type, client_name, client_email, client_address,
        client_tax_id, client_reg_no, client_country,
        seller_name, seller_tax_id, seller_reg_no, seller_address, seller_iban, seller_bank,
        CURRENT_DATE, delivery_date, due_date, currency, subtotal, tax_rate, tax_amount, total,
        discount_amount, discount_percent, vat_breakdown, vat_regime, vat_exemption_reason,
        exchange_rate, exchange_date, tax_amount_ron, notes, footer_notes, po_number,
        0, ${user.id}
      FROM zvd_invoices WHERE id = ${p.id}
      RETURNING *
    `.execute(db);
    const newId = (inv.rows[0] as any).id;
    await sql`
      INSERT INTO zvd_invoice_lines (invoice_id, description, quantity, unit, unit_price, tax_rate, total, sort_order, metadata)
      SELECT ${newId}, description, quantity, unit, unit_price, tax_rate, total, sort_order, metadata
        FROM zvd_invoice_lines WHERE invoice_id = ${p.id}
    `.execute(db);

    const lines = await sql`SELECT * FROM zvd_invoice_lines WHERE invoice_id = ${newId}`.execute(db);
    await ctx.events.emitAsync('invoice.created', {
      id: newId,
      invoice: inv.rows[0],
      lines: lines.rows,
    });
    return c.json({ data: inv.rows[0] }, 201);
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
    // The buyer's tax code. Required by Cod fiscal art. 319 alin. (20) lit. e)
    // when the buyer is a taxable person, and rejected by ANAF's e-Factura when
    // absent — enforced below against `client_type`, not here, because an
    // invoice to a private individual legitimately has none and a hard
    // requirement would block every B2C sale.
    client_tax_id: z.string().optional(),
    client_reg_no: z.string().optional(),
    client_city: z.string().optional(),
    client_county: z.string().optional(),
    client_country: z.string().optional(),
    /**
     * Invoice, proforma or delivery note. Each is numbered from its OWN series,
     * so a proforma never consumes an invoice number — which matters, because a
     * proforma is not a fiscal document and a gap in the invoice sequence is.
     */
    doc_type: z.enum(['invoice', 'proforma', 'delivery_note']).default('invoice'),
    /** Who carries the goods. Required on a delivery note; see the check below. */
    delegate_name: z.string().optional(),
    delegate_id_card: z.string().optional(),
    delegate_vehicle: z.string().optional(),
    /** Which series to number this in. Omitted: the default for that type. */
    series: z.string().optional(),
    issue_date: z.string().optional(),
    /** Date of supply. Must be shown when it differs from the issue date. */
    delivery_date: z.string().optional(),
    /**
     * Which VAT regime this document is issued under. Each of these requires a
     * specific mention printed on the invoice; `exempt` also requires the legal
     * basis, which is why `vat_exemption_reason` is demanded alongside it.
     */
    vat_regime: z.enum(['standard', 'reverse_charge', 'vat_on_collection', 'exempt', 'non_taxable']).default('standard'),
    vat_exemption_reason: z.string().optional(),
    /** BNR rate to RON. Required for a foreign-currency invoice (art. 290). */
    exchange_rate: z.number().positive().optional(),
    exchange_date: z.string().optional(),
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
      metadata: z.record(z.string(), z.unknown()).optional(),
      /**
       * Which catalogue item this line was picked from, kept in the line's
       * metadata. Accepted explicitly rather than left to zod, which strips
       * unknown keys in silence — the form sends this, and a field that
       * vanishes without a word is how half the defects in this extension hid.
       */
      catalogue_item: z.string().uuid().optional(),
    })).min(1),
  })), async (c) => {
    const user = c.get('user') as any;
    const d = c.req.valid('json');

    // If client_id is provided, enrich client_name/email from CRM. CRM is optional —
    // when not active, ctx.services.get returns null and we fall back to the values
    // the caller provided.
    let clientName = d.client_name;
    let clientEmail = d.client_email;
    let clientTaxId = d.client_tax_id;
    let clientRegNo = d.client_reg_no;
    if (d.client_id) {
      const crmLookup = ctx.services.get<(idOrEmail: string) => Promise<any | null>>('crm.contacts.lookup');
      if (crmLookup) {
        const contact = await crmLookup(d.client_id).catch(() => null);
        if (contact) {
          clientName = clientName ?? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim();
          clientEmail = clientEmail ?? contact.email ?? null;
          // CRM organizations carry the codes; an invoice raised against one
          // should not make somebody retype them.
          clientTaxId = clientTaxId ?? contact.tax_id ?? contact.organization?.tax_id ?? undefined;
          clientRegNo = clientRegNo ?? contact.reg_no ?? contact.organization?.registration_no ?? undefined;
        }
      }
    }

    // Legally required for a business buyer, impossible for a private one. So
    // it is refused only when the caller has said this is an organization —
    // and refused HERE rather than at the schema, where the rule cannot see
    // which kind of client this is.
    if (d.client_type === 'organization' && !clientTaxId) {
      return c.json(
        { error: 'client_tax_id is required when invoicing an organization (Cod fiscal art. 319)' },
        400,
      );
    }
    // Only Romanian codes: a foreign buyer's identifier follows its own
    // country's rules, and refusing one because it fails a Romanian checksum
    // would be worse than accepting one that is wrong.
    const roClient = !d.client_country || d.client_country.toUpperCase() === 'RO';
    if (clientTaxId && roClient && !isValidCui(clientTaxId)) {
      return c.json(
        { error: `"${clientTaxId}" is not a valid Romanian tax code — the check digit does not match. ANAF rejects the e-invoice with "CUI cumparator incorect".` },
        400,
      );
    }

    // An exemption has to say WHICH exemption. Without the legal basis the
    // mention is not a mention, and the document is not compliant.
    if (d.vat_regime === 'exempt' && !d.vat_exemption_reason) {
      return c.json(
        { error: 'vat_exemption_reason is required when vat_regime is "exempt" (Cod fiscal art. 319)' },
        400,
      );
    }
    // VAT in lei has to be reproducible years later, and today's BNR rate will
    // not be. So a foreign-currency invoice records the rate it used.
    if (d.currency !== 'RON' && !d.exchange_rate) {
      return c.json(
        { error: `exchange_rate to RON is required for an invoice in ${d.currency} (Cod fiscal art. 290)` },
        400,
      );
    }

    // An "aviz de însoțire a mărfii" travels with the goods and has to name
    // who is carrying them. A delivery note without a delegate is not a
    // delivery note, so it is refused rather than issued incomplete.
    if (d.doc_type === 'delivery_note' && !d.delegate_name) {
      return c.json({ error: 'delegate_name is required on a delivery note' }, 400);
    }

    // Every refusal happens ABOVE this line.
    //
    // Claiming a number is the one irreversible step: the 400 below is an
    // ordinary response, not a thrown error, so the request's transaction
    // commits and the incremented counter with it. Validating afterwards burnt
    // a number on each rejected request and left permanent gaps in the
    // sequence — the exact defect the series work exists to remove. Caught by
    // watching the numbers jump 1255 → 1258 across two rejected calls.
    const claimed = await claimNumber(db, d.doc_type, d.series);
    if (!claimed) {
      return c.json(
        { error: d.series ? `Unknown ${d.doc_type} series "${d.series}"` : `No ${d.doc_type} series configured` },
        400,
      );
    }
    // What the company was at the moment of issue, not what it is now.
    const company = await companyProfile(db);
    const subtotalBeforeDiscount = d.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const discount_amount = subtotalBeforeDiscount * (d.discount_percent / 100);
    const subtotal = subtotalBeforeDiscount - discount_amount;
    // Reverse charge and exemption mean the supplier charges no VAT at all;
    // the line rates still describe the goods, so they are kept and the charge
    // is zeroed rather than the rates being rewritten.
    const chargesVat = d.vat_regime === 'standard' || d.vat_regime === 'vat_on_collection';
    const tax_amount = chargesVat
      ? d.lines.reduce((s, l) => s + l.quantity * l.unit_price * (1 - d.discount_percent / 100) * l.tax_rate / 100, 0)
      : 0;
    const total = subtotal + tax_amount;

    // The taxable base per rate, grouped from the lines rather than typed, so
    // it cannot disagree with them. An invoice mixing 19% and 9% is ordinary —
    // a farm selling produce and delivery — and the single header `tax_rate`
    // could only ever describe one of them.
    const byRate = new Map<number, { rate: number; base: number; vat: number }>();
    for (const l of d.lines) {
      const base = l.quantity * l.unit_price * (1 - d.discount_percent / 100);
      const entry = byRate.get(l.tax_rate) ?? { rate: l.tax_rate, base: 0, vat: 0 };
      entry.base += base;
      entry.vat += chargesVat ? (base * l.tax_rate) / 100 : 0;
      byRate.set(l.tax_rate, entry);
    }
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const vatBreakdown = [...byRate.values()]
      .sort((a, b) => b.rate - a.rate)
      .map((e) => ({ rate: e.rate, base: round2(e.base), vat: round2(e.vat) }));
    const taxAmountRon = d.exchange_rate ? round2(tax_amount * d.exchange_rate) : null;
    const inv = await sql`
      INSERT INTO zvd_invoices (number, series, doc_type, delegate_name, delegate_id_card, delegate_vehicle,
        client_id, client_type, client_name, client_email, client_address,
        client_tax_id, client_reg_no, client_city, client_county, client_country,
        seller_name, seller_tax_id, seller_reg_no, seller_address, seller_city, seller_county, seller_country, seller_iban, seller_bank,
        issue_date, delivery_date, due_date, currency, subtotal, tax_rate, tax_amount, total, discount_amount, discount_percent,
        vat_breakdown, vat_regime, vat_exemption_reason, exchange_rate, exchange_date, tax_amount_ron,
        notes, footer_notes, po_number, recurring_interval, amount_paid, created_by)
      VALUES (${claimed.number}, ${claimed.series}, ${d.doc_type},
        ${d.delegate_name ?? null}, ${d.delegate_id_card ?? null}, ${d.delegate_vehicle ?? null},
        ${d.client_id ?? null}, ${d.client_type ?? null}, ${clientName},
        ${clientEmail ?? null}, ${d.client_address ?? null},
        ${clientTaxId ?? null}, ${clientRegNo ?? null}, ${d.client_city ?? null}, ${d.client_county ?? null}, ${d.client_country ?? null},
        ${company?.legal_name ?? company?.name ?? null}, ${company?.tax_id ?? null},
        ${company?.reg_no ?? null}, ${company?.address ?? null},
        ${company?.city ?? null}, ${company?.county ?? null}, ${company?.country ?? 'RO'},
        ${company?.iban ?? null}, ${company?.bank ?? null},
        ${d.issue_date ?? new Date().toISOString().slice(0,10)}, ${d.delivery_date ?? null}, ${d.due_date},
        ${d.currency}, ${subtotal}, ${d.tax_rate}, ${tax_amount}, ${total}, ${discount_amount},
        ${d.discount_percent},
        ${JSON.stringify(vatBreakdown)}::jsonb, ${d.vat_regime}, ${d.vat_exemption_reason ?? null},
        ${d.exchange_rate ?? null}, ${d.exchange_date ?? null}, ${taxAmountRon},
        ${d.notes ?? null}, ${d.footer_notes ?? null}, ${d.po_number ?? null},
        ${d.recurring_interval ?? null}, 0, ${user.id})
      RETURNING *
    `.execute(db);
    const invId = (inv.rows[0] as any).id;
    const insertedLines: any[] = [];
    for (const line of d.lines) {
      const lineTotal = line.quantity * line.unit_price * (1 - d.discount_percent / 100) * (1 + line.tax_rate / 100);
      // `::text::jsonb`, not `::jsonb`. A string parameter cast straight to
      // jsonb is a no-op — the driver sends it AS a jsonb value, so the
      // document arrives as a jsonb STRING SCALAR instead of being parsed, and
      // `jsonb_typeof(metadata)` reads back "string".
      //
      // The JS readers here never noticed: both of them do
      // `typeof x === 'string' ? JSON.parse(x) : x`, so they compensate for it.
      // A SQL reader cannot compensate. `operations/traceability` subscribes to
      // record.created and looks for lines with `metadata->>'lot_id'` to raise a
      // pending dispatch — on a string scalar that operator returns NULL, its
      // query matched zero rows, and the invoice-to-dispatch handover has never
      // once fired. Every route that acts on a pending dispatch was unreachable
      // as a result.
      const lineRow = await sql`
        INSERT INTO zvd_invoice_lines (invoice_id, description, quantity, unit, unit_price, tax_rate, total, sort_order, metadata)
        VALUES (${invId}, ${line.description}, ${line.quantity}, ${line.unit ?? null}, ${line.unit_price}, ${line.tax_rate}, ${lineTotal}, ${line.sort_order}, ${JSON.stringify({ ...(line.metadata ?? {}), ...(line.catalogue_item ? { catalogue_item: line.catalogue_item } : {}) })}::text::jsonb)
        RETURNING *
      `.execute(db);
      insertedLines.push(lineRow.rows[0]);
    }

    // Generic record event — for engine-level data hooks (audit, search index, etc.)
    await ctx.events.emitAsync('record.created', {
      collection: 'zvd_invoices',
      record: inv.rows[0],
      id: invId,
      userId: user.id,
    });

    // Domain event — semantically meaningful "an invoice was created". Other
    // extensions (efactura, accounting, traceability) listen to this rather than
    // grepping record.created for collection = zvd_invoices.
    //
    // AWAITED, because listeners here are async and write to the database.
    // Plain `emit` is EventEmitter's synchronous fan-out: an async listener
    // returns a promise at its first await and the emitter drops it, so the
    // rest of the listener ran after this request had responded and its tenant
    // transaction had closed. Every one of them died on "Transaction is already
    // committed", inside its own try/catch, which is why e-Factura had never
    // drafted a single submission on any install.
    //
    // Awaiting also makes the draft atomic with the invoice: both commit, or
    // neither does. A listener that throws is logged and skipped by the bus, so
    // one broken extension cannot fail an invoice.
    await ctx.events.emitAsync('invoice.created', {
      id: invId,
      invoice: inv.rows[0],
      lines: insertedLines,
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
  app.post('/invoices/:id/send', zValidator('query', z.object({ warehouse_id: z.string().uuid().optional() })), async (c) => {
    const row = await sql`
      UPDATE zvd_invoices SET status = 'sent', updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status = 'draft' RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Invoice not found or not in draft' }, 400);
    const invoice = row.rows[0] as any;

    /**
     * Stock leaves on the DELIVERY NOTE, not on the invoice.
     *
     * An invoice and a dispatch are different events and can be days apart in
     * either order: paid in advance and shipped later, shipped now and invoiced
     * monthly, or both at once. Only the delivery note travels with the goods,
     * so only it says anything about what physically left the warehouse.
     *
     * A first version of this moved stock when the INVOICE was sent. That is
     * right for a shop that sells and ships in one motion and wrong for
     * everyone else — which is the definition of a special case dressed up as a
     * model.
     *
     * The deeper reason to keep it here rather than in a country's invoicing
     * extension: dispatch is an inventory concept. If moving stock lived in the
     * Romanian extension, a German one would reimplement it, and the second
     * implementation would differ from the first in some way nobody noticed.
     * An invoicing extension REFERENCES a dispatch; it never moves stock.
     *
     * Only lines naming an inventory product move. A service has no stock, and
     * a hand-typed line was never linked to anything — guessing what
     * "Transport" refers to is worse than moving nothing.
     *
     * The move is a consequence of the dispatch, not a precondition: if a move
     * fails, the note stays issued and the failure is reported beside it. A
     * document that silently failed to adjust stock is how a warehouse drifts
     * from the shelf; one rolled back because of the warehouse is worse.
     */
    const stockMove = ctx.services.get<
      (input: {
        productId: string;
        warehouseId: string;
        qty: number;
        type: 'in' | 'out' | 'adjust' | 'transfer';
        reference?: string;
        reason?: string;
        userId?: string;
      }) => Promise<{ balance: number }>
    >('inventory.stock.move');

    const warehouseId = c.req.query('warehouse_id');
    // biome-ignore lint/suspicious/noExplicitAny: cross-extension payload
    const moved: any[] = [];
    const stockErrors: string[] = [];

    // Invoices and proformas move nothing. Only the document that accompanies
    // the goods does.
    const movesStock = invoice.doc_type === 'delivery_note';
    if (stockMove && warehouseId && movesStock) {
      const lines = await sql<{ description: string; quantity: string; metadata: unknown }>`
        SELECT description, quantity, metadata FROM zvd_invoice_lines WHERE invoice_id = ${invoice.id}
      `.execute(db);
      for (const l of lines.rows) {
        const meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata) : (l.metadata ?? {});
        const productId = (meta as { catalogue_item?: string }).catalogue_item;
        if (!productId) continue;
        try {
          const res = await stockMove({
            productId,
            warehouseId,
            qty: Number(l.quantity),
            type: 'out',
            reference: invoice.number,
            reason: `Invoice ${invoice.number}`,
            userId: (c.get('user') as { id: string } | undefined)?.id,
          });
          moved.push({ product_id: productId, qty: Number(l.quantity), balance: res?.balance });
        } catch (err) {
          // Named, so somebody can correct the one line that failed rather than
          // rediscovering it at a stock count.
          stockErrors.push(`${l.description}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    return c.json({
      data: invoice,
      stock: !stockMove
        ? { skipped: 'inventory extension is not active' }
        : !movesStock
          ? { skipped: `stock moves on a delivery note, not on a ${invoice.doc_type}` }
          : { warehouse_id: warehouseId ?? null, moved, errors: stockErrors },
    });
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
    if (!(await mayDecideInvoice(ctx, user, 'settle'))) {
      return c.json({ error: 'You may not record payments' }, 403);
    }
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
    const _u = c.get('user') as any;
    // The shorthand beside `/payments`, and it settles an invoice just the same.
    if (!(await mayDecideInvoice(ctx, _u, 'settle'))) {
      return c.json({ error: 'You may not settle invoices' }, 403);
    }
    const row = await sql`
      UPDATE zvd_invoices SET status = 'paid', paid_at = NOW(), amount_paid = total, updated_at = NOW()
      WHERE id = ${c.req.param('id')} AND status IN ('sent','overdue','partially_paid') RETURNING *
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Invoice not found or not payable' }, 400);
    return c.json({ data: row.rows[0] });
  });

  app.post('/invoices/:id/cancel', async (c) => {
    const user = c.get('user') as any;
    if (!(await mayDecideInvoice(ctx, user, 'cancel'))) {
      return c.json({ error: 'You may not cancel invoices' }, 403);
    }
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
    // Same series as the invoice being repeated, so a recurring contract keeps
    // its numbering together rather than jumping to whatever is default today.
    const claimed = await claimNumber(db, 'invoice', i.series ?? undefined);
    if (!claimed) return c.json({ error: 'No invoice series configured' }, 400);
    const newInv = await sql`
      INSERT INTO zvd_invoices (number, series, doc_type, delegate_name, delegate_id_card, delegate_vehicle,
        client_id, client_type, client_name, client_email, client_address,
        client_tax_id, client_reg_no, client_country,
        seller_name, seller_tax_id, seller_reg_no, seller_address, seller_iban, seller_bank,
        issue_date, due_date, currency, subtotal, tax_rate, tax_amount, total, discount_amount, discount_percent,
        notes, footer_notes, recurring_interval, amount_paid, created_by)
      VALUES (${claimed.number}, ${claimed.series}, ${i.client_id}, ${i.client_type}, ${i.client_name}, ${i.client_email}, ${i.client_address},
        ${i.client_tax_id}, ${i.client_reg_no}, ${i.client_country},
        ${i.seller_name}, ${i.seller_tax_id}, ${i.seller_reg_no}, ${i.seller_address}, ${i.seller_iban}, ${i.seller_bank},
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
    const breakdown = typeof inv.vat_breakdown === 'string'
      ? JSON.parse(inv.vat_breakdown)
      : (inv.vat_breakdown ?? []);
    const cur = esc(inv.currency);
    const money = (n: unknown) => `${(+(n as number) || 0).toFixed(2)} ${cur}`;

    // The document that actually leaves the building, and the only version of
    // it most people will ever see.
    //
    // It used to print the number, the client's name and the lines, and nothing
    // else — no issuer at all. Not the company name, not the CUI, not the Reg.
    // Com., not the bank account it asks to be paid into; and on the buyer's
    // side, no tax code either. Cod fiscal art. 319 alin. (20) requires every
    // one of those, so the paper handed to a client was not an invoice, and no
    // amount of work on the database changed that while this template stayed as
    // it was.
    //
    // Everything interpolated below goes through `esc`. It did not before, and
    // these fields are free text a customer supplies: a client named
    // `<script>…` executed when the invoice was previewed or opened from an
    // email, in a document whose whole purpose is to be sent to other people.
    const regimeNote =
      inv.vat_regime === 'reverse_charge' ? 'Taxare inversă (art. 331 Cod fiscal)'
      : inv.vat_regime === 'vat_on_collection' ? 'TVA la încasare'
      : inv.vat_regime === 'exempt' ? `Scutit de TVA${inv.vat_exemption_reason ? ` — ${esc(inv.vat_exemption_reason)}` : ''}`
      : inv.vat_regime === 'non_taxable' ? 'Operațiune neimpozabilă'
      : '';

    const html = `<!DOCTYPE html><html lang="ro"><head><meta charset="UTF-8">
<title>Factura ${esc(inv.number)}</title>
<style>body{font-family:Arial,sans-serif;margin:40px;color:#222;font-size:13px}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{padding:7px 10px;border:1px solid #ddd;text-align:left}
th{background:#f5f5f5}.total-row{font-weight:bold;background:#fafafa}
.parties{display:flex;gap:40px;margin-top:24px}.party{flex:1}
.party h3{margin:0 0 6px;font-size:12px;text-transform:uppercase;color:#666}
.num{text-align:right}.dates{text-align:right}
.regime{margin-top:14px;padding:8px 10px;border-left:3px solid #444;background:#f7f7f7}
.vat-table{width:auto;min-width:320px}</style></head>
<body>
<div style="display:flex;justify-content:space-between;align-items:flex-start">
  <div><h1 style="margin:0">FACTURĂ</h1>
    <div style="font-size:16px">Seria ${esc(inv.series ?? '')} nr. ${esc(inv.number)}</div></div>
  <div class="dates">
    <strong>Data emiterii:</strong> ${esc(fmtDate(inv.issue_date))}<br>
    ${inv.delivery_date ? `<strong>Data livrării:</strong> ${esc(fmtDate(inv.delivery_date))}<br>` : ''}
    <strong>Scadență:</strong> ${esc(fmtDate(inv.due_date))}
  </div>
</div>

<div class="parties">
  <div class="party">
    <h3>Furnizor</h3>
    <strong>${esc(inv.seller_name ?? '—')}</strong><br>
    ${inv.seller_tax_id ? `CUI: ${esc(inv.seller_tax_id)}<br>` : ''}
    ${inv.seller_reg_no ? `Nr. Reg. Com.: ${esc(inv.seller_reg_no)}<br>` : ''}
    ${inv.seller_address ? `${esc(inv.seller_address)}<br>` : ''}
    ${inv.seller_iban ? `IBAN: ${esc(inv.seller_iban)}<br>` : ''}
    ${inv.seller_bank ? `Banca: ${esc(inv.seller_bank)}` : ''}
  </div>
  <div class="party">
    <h3>Client</h3>
    <strong>${esc(inv.client_name)}</strong><br>
    ${inv.client_tax_id ? `CUI: ${esc(inv.client_tax_id)}<br>` : ''}
    ${inv.client_reg_no ? `Nr. Reg. Com.: ${esc(inv.client_reg_no)}<br>` : ''}
    ${inv.client_address ? `${esc(inv.client_address)}<br>` : ''}
    ${inv.client_email ? `${esc(inv.client_email)}<br>` : ''}
    ${inv.po_number ? `Nr. comandă: ${esc(inv.po_number)}` : ''}
  </div>
</div>

<table>
  <thead><tr><th>Descriere</th><th>U.M.</th><th class="num">Cantitate</th><th class="num">Preț unitar</th><th class="num">TVA %</th><th class="num">Total</th></tr></thead>
  <tbody>
  ${lines.map((l: any) => `<tr><td>${esc(l.description)}</td><td>${esc(l.unit ?? '')}</td><td class="num">${esc(String(l.quantity))}</td><td class="num">${money(l.unit_price)}</td><td class="num">${esc(String(l.tax_rate))}%</td><td class="num">${money(l.total)}</td></tr>`).join('')}
  </tbody>
</table>

${breakdown.length > 0 ? `<table class="vat-table">
  <thead><tr><th>Cotă TVA</th><th class="num">Bază impozabilă</th><th class="num">TVA</th></tr></thead>
  <tbody>${breakdown.map((b: any) => `<tr><td>${esc(String(b.rate))}%</td><td class="num">${money(b.base)}</td><td class="num">${money(b.vat)}</td></tr>`).join('')}</tbody>
</table>` : ''}

<table style="width:auto;min-width:320px;margin-left:auto">
  <tr><td>Subtotal</td><td class="num">${money(inv.subtotal)}</td></tr>
  ${+inv.discount_amount > 0 ? `<tr><td>Reducere (${esc(String(inv.discount_percent))}%)</td><td class="num">-${money(inv.discount_amount)}</td></tr>` : ''}
  <tr><td>TVA</td><td class="num">${money(inv.tax_amount)}</td></tr>
  <tr class="total-row"><td>TOTAL DE PLATĂ</td><td class="num">${money(inv.total)}</td></tr>
</table>

${inv.exchange_rate ? `<p>Curs valutar: 1 ${cur} = ${esc(String(inv.exchange_rate))} RON${inv.exchange_date ? ` la data de ${esc(fmtDate(inv.exchange_date))}` : ''}${inv.tax_amount_ron ? ` · TVA în lei: ${(+inv.tax_amount_ron).toFixed(2)} RON` : ''}</p>` : ''}
${regimeNote ? `<div class="regime">${regimeNote}</div>` : ''}
${inv.notes ? `<p><strong>Note:</strong> ${esc(inv.notes)}</p>` : ''}
${inv.footer_notes ? `<p style="font-size:11px;color:#666">${esc(inv.footer_notes)}</p>` : ''}
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
