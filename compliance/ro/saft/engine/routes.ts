import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { generateSAFTXML } from './saft-generator.js';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

const exportSchema = z.object({
  period_start: z.string().min(1),
  period_end: z.string().min(1),
  company_name: z.string().min(1),
  company_cui: z.string().min(1),
  company_address: z.string().optional(),
});

const accountSchema = z.object({
  code: z.string().min(1),
  description: z.string().min(1),
  account_type: z.enum(['balance', 'income', 'expense']).default('balance'),
});

const entrySchema = z.object({
  account_code: z.string().min(1),
  entry_date: z.string().min(1),
  description: z.string().min(1),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  document_number: z.string().optional(),
});


/**
 * A DATE column as `YYYY-MM-DD`, which is the only form Postgres takes back.
 *
 * The driver returns `date` columns as JavaScript Date objects. Passing one
 * straight into a query serialises it the JavaScript way — "Wed Jul 01 2026
 * 00:00:00 GMT+0000 (Coordinated Universal Time)" — and Postgres answers
 * "invalid input syntax for type date".
 *
 * Third place today with this exact defect, after finance/invoicing and
 * compliance/ro/efactura, and hidden the same way in all three: generation was
 * only ever a precondition for a submission that was faked and never read what
 * it demanded, so nothing exercised it against a real row.
 */
function isoDay(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').slice(0, 10);
}

export function saftRoutes(ctx: ExtensionContext): Hono {
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
  app.use('*', permissionGate(ctx, 'saft'));

  // --- Exports ---

  app.get('/', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const exports = await db
      .selectFrom('zv_saft_exports')
      .select(['id', 'period_start', 'period_end', 'company_name', 'company_cui', 'status', 'created_at'])
      .orderBy('period_start', 'desc')
      .execute();

    return c.json({ exports });
  });

  // --- Accounts ---

  app.get('/accounts', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const accounts = await db
      .selectFrom('zv_saft_accounts')
      .selectAll()
      .orderBy('code', 'asc')
      .execute();

    return c.json({ accounts });
  });

  // --- Journal Entries ---

  app.get('/entries', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { from, to, account_code } = c.req.query();
    let query = db.selectFrom('zv_saft_journal_entries').selectAll();
    if (from) query = query.where('entry_date', '>=', from);
    if (to) query = query.where('entry_date', '<=', to);
    if (account_code) query = query.where('account_code', '=', account_code);

    const entries = await query.orderBy('entry_date', 'desc').execute();
    return c.json({ entries });
  });

  app.get('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const exp = await db
      .selectFrom('zv_saft_exports')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!exp) return c.json({ error: 'Export not found' }, 404);
    return c.json({ export: exp });
  });

  app.post('/', zValidator('json', exportSchema), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const exp = await db
      .insertInto('zv_saft_exports')
      .values(body)
      .returningAll()
      .executeTakeFirst();

    return c.json({ export: exp }, 201);
  });

  app.delete('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .deleteFrom('zv_saft_exports')
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .execute();

    return c.json({ success: true });
  });

  app.post('/:id/generate', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const exp = await db
      .selectFrom('zv_saft_exports')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!exp) return c.json({ error: 'Export not found' }, 404);

    const accounts = await db
      .selectFrom('zv_saft_accounts')
      .selectAll()
      .orderBy('code', 'asc')
      .execute();

    const entries = await db
      .selectFrom('zv_saft_journal_entries')
      .selectAll()
      .where('entry_date', '>=', isoDay(exp.period_start))
      .where('entry_date', '<=', isoDay(exp.period_end))
      .orderBy('entry_date', 'asc')
      .execute();

    const xml = generateSAFTXML({
      company_name: exp.company_name,
      company_cui: exp.company_cui,
      company_address: exp.company_address,
      period_start: isoDay(exp.period_start),
      period_end: isoDay(exp.period_end),
      // selectAll() rows are loosely typed; SAFTAccount / SAFTJournalEntry
      // are the strict shapes the generator expects. Schema columns
      // match — only the type system disagrees with the runtime.
      accounts: accounts as any,
      entries: entries as any,
    });

    await db
      .updateTable('zv_saft_exports')
      .set({ xml_content: xml, status: 'generated', updated_at: new Date() })
      .where('id', '=', exp.id)
      .execute();

    return c.json({ message: 'SAF-T XML generated', entries_count: entries.length });
  });

  app.get('/:id/xml', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const exp = await db
      .selectFrom('zv_saft_exports')
      .select(['xml_content', 'period_start', 'period_end', 'company_cui'])
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!exp?.xml_content) return c.json({ error: 'XML not generated yet' }, 404);

    return new Response(exp.xml_content, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="SAFT_${exp.company_cui}_${isoDay(exp.period_start)}_${isoDay(exp.period_end)}.xml"`,
      },
    });
  });

  app.post('/:id/submit', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const exp = await db
      .selectFrom('zv_saft_exports')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!exp) return c.json({ error: 'Export not found' }, 404);
    if (!exp.xml_content) return c.json({ error: 'Generate XML first' }, 400);

    // Nothing is submitted, and nothing pretends to be.
    //
    // This route used to invent `SAFT` plus a timestamp as an upload index,
    // store a made-up ANAF response with `ExecutionStatus: '0'`, move the
    // export to `submitted` and reply "Submitted to ANAF". No request left this
    // process — there is no call to anaf.ro in this extension.
    //
    // D406 is also not filed the way e-Factura is. There is no REST upload for
    // it: the XML is validated and signed with ANAF's DUK Integrator, which
    // produces a PDF carrying the XML, and that PDF is submitted in SPV like
    // any other declaration. So the honest answer is not "not implemented yet"
    // but "this is not the shape of the thing" — and the reply says which two
    // steps a person actually has to take.
    //
    // The generator is ALSO partial, which matters more than the missing
    // upload: it emits Header, the chart of accounts and general ledger
    // entries. D406 additionally requires the tax table, customers, suppliers,
    // products, units of measure, owners, assets and the whole SourceDocuments
    // section — sales and purchase invoices, payments, movement of goods. An
    // export produced here will not pass validation, and saying so now costs
    // less than discovering it at a deadline.
    return c.json(
      {
        code: 'saft_submission_not_implemented',
        error:
          'D406 is not submitted through an API. Download the XML, validate and sign it with ANAF\'s DUK Integrator, ' +
          'then submit the resulting PDF in SPV. NOTE: this generator is incomplete — it produces Header, the chart of ' +
          'accounts and ledger entries only, and omits the tax table, partners, products, assets and source documents ' +
          'that D406 requires, so the file will not validate as-is.',
        submitted: false,
      },
      501,
    );
  });

  // --- Accounts ---

  app.post('/accounts', zValidator('json', accountSchema), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const account = await db
      .insertInto('zv_saft_accounts')
      .values(body)
      .returningAll()
      .executeTakeFirst();

    return c.json({ account }, 201);
  });

  app.delete('/accounts/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db.deleteFrom('zv_saft_accounts').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // --- Journal Entries ---

  app.post('/entries', zValidator('json', entrySchema), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const entry = await db
      .insertInto('zv_saft_journal_entries')
      .values(body)
      .returningAll()
      .executeTakeFirst();

    return c.json({ entry }, 201);
  });

  app.delete('/entries/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db.deleteFrom('zv_saft_journal_entries').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  return app;
}
