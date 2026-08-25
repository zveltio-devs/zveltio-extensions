import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import { generateUBLXML } from './ubl-generator.js';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';

const lineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().default('BUC'),
  unit_price: z.number(),
  vat_rate: z.number().int().min(0).max(25),
  vat_amount: z.number(),
  line_total: z.number(),
});

const invoiceSchema = z.object({
  invoice_number: z.string().min(1),
  invoice_date: z.string(),
  due_date: z.string().optional(),
  seller_name: z.string().min(1),
  seller_cui: z.string().min(1),
  seller_reg_com: z.string().optional(),
  seller_address: z.string().optional(),
  seller_iban: z.string().optional(),
  seller_bank: z.string().optional(),
  buyer_name: z.string().min(1),
  buyer_cui: z.string().optional(),
  buyer_cui_type: z.enum(['RO', 'EU', 'OTHER']).default('RO'),
  buyer_address: z.string().optional(),
  lines: z.array(lineSchema),
  subtotal: z.number(),
  vat_total: z.number(),
  total: z.number(),
  currency: z.string().default('RON'),
  payment_method: z.string().optional(),
  payment_reference: z.string().optional(),
  reverse_charge: z.boolean().default(false),
});

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

// Not caught. A swallowed failure here would be worse than useless: the status
// log is the audit trail of what was told to ANAF and when, and — because a
// failed statement aborts the whole Postgres transaction — the JavaScript catch
// would not contain it anyway. The caller would get an opaque "current
// transaction is aborted" from the next query instead of the real cause.
async function logStatusChange(dbh: any, invoiceId: string, oldStatus: string, newStatus: string, userId: string, note?: string) {
  await sql`
    INSERT INTO zv_efactura_status_log (invoice_id, old_status, new_status, changed_by, note)
    VALUES (${invoiceId}::uuid, ${oldStatus}, ${newStatus}, ${userId}, ${note ?? null})
  `.execute(dbh);
}

/** NUMERIC arrives as a string — the driver refuses to lose precision silently. */
function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** DATE and TIMESTAMPTZ arrive as Date objects; UBL wants `YYYY-MM-DD`. */
function day(v: unknown): string {
  if (!v) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).split('T')[0];
}

/**
 * The database row is not the shape the generator declares, and an `as any` used
 * to claim it was.
 *
 * `InvoiceData` types every amount as `number` and every date as `string`.
 * Postgres hands NUMERIC back as a string and DATE back as a `Date`, so
 * `vat_total.toFixed(2)` threw "toFixed is not a function" and `d.split('T')`
 * threw "d.split is not a function" — on every invoice that came out of the
 * database rather than out of a test fixture.
 *
 * Coerced once here, at the boundary where the row becomes InvoiceData, instead
 * of defending inside each field of the template.
 */
function toInvoiceData(row: any, lines: any[]): Parameters<typeof generateUBLXML>[0] {
  return {
    invoice_number: String(row.invoice_number ?? ''),
    invoice_date: day(row.invoice_date),
    due_date: row.due_date ? day(row.due_date) : undefined,
    currency: String(row.currency ?? 'RON'),

    seller_name: String(row.seller_name ?? ''),
    seller_cui: String(row.seller_cui ?? ''),
    seller_reg_com: row.seller_reg_com ?? undefined,
    seller_address: row.seller_address ?? undefined,
    seller_iban: row.seller_iban ?? undefined,
    seller_bank: row.seller_bank ?? undefined,

    buyer_name: String(row.buyer_name ?? ''),
    buyer_cui: row.buyer_cui ?? undefined,
    buyer_address: row.buyer_address ?? undefined,

    lines: (Array.isArray(lines) ? lines : []).map((l: any) => ({
      description: String(l?.description ?? ''),
      quantity: num(l?.quantity),
      unit: String(l?.unit ?? 'H87'),
      unit_price: num(l?.unit_price),
      vat_rate: num(l?.vat_rate),
      vat_amount: num(l?.vat_amount),
      line_total: num(l?.line_total),
    })),

    subtotal: num(row.subtotal),
    vat_total: num(row.vat_total),
    total: num(row.total),
  };
}

/**
 * May this user take the decision this module exists to record?
 *
 * Trimiterea facturii la ANAF. Ireversibilă și cu greutate legală: odată depusă, factura există în sistemul fiscal și se corectează prin storno, nu prin ștergere.
 *
 * It sat behind one `efactura` permission — the same one needed to look at the
 * list — and asked nothing else. Found by `scripts/check-decision-routes.ts`,
 * which was written after the same shape turned up in four extensions in a row.
 *
 * `efactura:submit`, granted deliberately, with `admin` still sufficient so an
 * existing install keeps working before anyone edits policies.
 */
async function mayDecide(ctx: ExtensionContext, user: any): Promise<boolean> {
  if (await ctx.checkPermission(user.id, 'efactura', 'submit').catch(() => false)) return true;
  return ctx.checkPermission(user.id, 'admin', '*').catch(() => false);
}

export function efacturaRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const app = new Hono();

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  // Auth + RBAC gate — populate c.user then check `efactura` permission.
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });
  app.use('*', permissionGate(ctx, 'efactura'));

  // GET / — list invoices
  app.get('/', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { status, seller_cui, from_date, to_date } = c.req.query();
    let query = db
      .selectFrom('zv_efactura_invoices')
      .select(['id', 'invoice_number', 'invoice_date', 'buyer_name', 'buyer_cui', 'total', 'currency', 'status', 'anaf_index', 'created_at'])
      .orderBy('invoice_date', 'desc');

    if (status) query = query.where('status', '=', status);
    if (seller_cui) query = query.where('seller_cui', '=', seller_cui);
    if (from_date) query = query.where('invoice_date', '>=', from_date);
    if (to_date) query = query.where('invoice_date', '<=', to_date);

    const invoices = await query.execute();
    return c.json({ invoices });
  });

  // GET /stats — MUST precede /:id, else the param route captures "stats"
  // as :id and the UUID cast on the invoice id 500s.
  app.get('/stats', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { seller_cui, year } = c.req.query();
    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();

    const [statusStats, monthlyStats] = await Promise.all([
      sql<any>`
        SELECT status, COUNT(*)::int AS count, SUM(total) AS total_amount
        FROM zv_efactura_invoices
        WHERE EXTRACT(YEAR FROM invoice_date) = ${currentYear}
          ${seller_cui ? sql`AND seller_cui = ${seller_cui}` : sql``}
        GROUP BY status
      `.execute(db),
      sql<any>`
        SELECT TO_CHAR(invoice_date, 'YYYY-MM') AS month,
               COUNT(*)::int AS count, SUM(total) AS total, SUM(vat_total) AS vat
        FROM zv_efactura_invoices
        WHERE EXTRACT(YEAR FROM invoice_date) = ${currentYear}
          ${seller_cui ? sql`AND seller_cui = ${seller_cui}` : sql``}
        GROUP BY month ORDER BY month
      `.execute(db),
    ]);

    return c.json({ year: currentYear, by_status: statusStats.rows, by_month: monthlyStats.rows });
  });

  // ── ANAF connection ───────────────────────────────────────────
  //
  // Reading NEVER returns a secret. The screen needs to know whether the
  // connection is configured, not what it is configured with — and a settings
  // endpoint that echoes credentials back turns every stray log, proxy cache
  // and browser history entry into a copy of them.
  app.get('/settings', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const row = await sql<any>`SELECT * FROM zv_efactura_settings LIMIT 1`.execute(db);
    const r = row.rows[0];
    return c.json({
      data: {
        environment: r?.environment ?? 'test',
        seller_cif: r?.seller_cif ?? '',
        client_id: r?.client_id ?? '',
        cert_path: r?.cert_path ?? '',
        callback_url: r?.callback_url ?? '',
        // Booleans, not values.
        client_secret_set: Boolean(r?.client_secret),
        cert_password_set: Boolean(r?.cert_password),
        connected: Boolean(r?.access_token),
        token_expires_at: r?.token_expires_at ?? null,
        last_verified_at: r?.last_verified_at ?? null,
        last_error: r?.last_error ?? null,
      },
    });
  });

  const settingsSchema = z.object({
    environment: z.enum(['test', 'prod']).default('test'),
    seller_cif: z.string().optional(),
    client_id: z.string().optional(),
    /** Left blank on a re-save to keep the stored one. */
    client_secret: z.string().optional(),
    cert_path: z.string().optional(),
    cert_password: z.string().optional(),
    callback_url: z.string().optional(),
  });

  // biome-ignore lint/suspicious/noExplicitAny: Hono context
  async function saveSettings(c: any) {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const d = c.req.valid('json') as z.infer<typeof settingsSchema>;

    // Refuse rather than persist plaintext. Without a field key there is no way
    // to store an OAuth secret safely, and writing it anyway would put a
    // credential to a tax authority in the clear on the operator's disk.
    const enc = ctx.internals?.encryptSecret;
    const needsEncryption = Boolean(d.client_secret || d.cert_password);
    if (needsEncryption && !enc) {
      return c.json(
        { error: 'FIELD_ENCRYPTION_KEY is not configured, so credentials cannot be stored safely.' },
        400,
      );
    }

    const existing = await sql<any>`SELECT * FROM zv_efactura_settings LIMIT 1`.execute(db);
    const prev = existing.rows[0];

    // An empty secret means "leave what is there", so re-saving the form after
    // changing the environment does not silently wipe the credentials the user
    // cannot see to retype.
    const secret = d.client_secret ? await enc!(d.client_secret) : (prev?.client_secret ?? null);
    const certPw = d.cert_password ? await enc!(d.cert_password) : (prev?.cert_password ?? null);

    const row = prev
      ? await sql<any>`
          UPDATE zv_efactura_settings SET
            environment = ${d.environment}, seller_cif = ${d.seller_cif ?? null},
            client_id = ${d.client_id ?? null}, client_secret = ${secret},
            cert_path = ${d.cert_path ?? null}, cert_password = ${certPw},
            callback_url = ${d.callback_url ?? null},
            updated_at = NOW()
          WHERE id = ${prev.id} RETURNING id
        `.execute(db)
      : await sql<any>`
          INSERT INTO zv_efactura_settings
            (environment, seller_cif, client_id, client_secret, cert_path, cert_password, callback_url)
          VALUES (${d.environment}, ${d.seller_cif ?? null}, ${d.client_id ?? null},
                  ${secret}, ${d.cert_path ?? null}, ${certPw}, ${d.callback_url ?? null})
          RETURNING id
        `.execute(db);

    return c.json({ data: { id: row.rows[0].id, saved: true } });
  }

  app.post('/settings', zValidator('json', settingsSchema), saveSettings);
  app.put('/settings', zValidator('json', settingsSchema), saveSettings);



  /**
   * ANAF's e-Factura web services, from their own specification.
   *
   * Two families, and the difference matters: `webserviceapl.anaf.ro` expects
   * the digital certificate presented on the call itself, `api.anaf.ro` expects
   * an OAuth bearer token. This engine has no certificate to present — the
   * certificate lives with the person, in their browser — so it always uses the
   * OAuth family.
   *
   * `webservicesp.anaf.ro` is a third, unauthenticated host carrying validation
   * and XML-to-PDF. Those need no credentials at all, which is why the invoice
   * can be validated and rendered before anyone has connected anything.
   */
  const anafApi = (env: string) => `https://api.anaf.ro/${env === 'prod' ? 'prod' : 'test'}/FCTEL/rest`;
  const ANAF_PUBLIC = 'https://webservicesp.anaf.ro/prod/FCTEL/rest';

  /** Settings row plus a decrypted bearer token, or a reason there is none. */
  async function anafAuth(): Promise<{ cfg: any; token: string } | { error: string }> {
    const row = await sql<any>`SELECT * FROM zv_efactura_settings LIMIT 1`.execute(db);
    const cfg = row.rows[0];
    if (!cfg?.access_token) return { error: 'Not connected to ANAF. Sign in on the ANAF connection screen first.' };
    const dec = ctx.internals?.decryptSecret;
    if (!dec) return { error: 'FIELD_ENCRYPTION_KEY is not configured.' };
    if (cfg.token_expires_at && new Date(cfg.token_expires_at) < new Date()) {
      return { error: 'The ANAF token has expired. Refresh it on the ANAF connection screen.' };
    }
    return { cfg, token: await dec(cfg.access_token) };
  }

  // ── ANAF OAuth 2.0 ────────────────────────────────────────────
  //
  // Endpoints from ANAF's own registration procedure, not inferred:
  //
  //   Authorization  https://logincert.anaf.ro/anaf-oauth2/v1/authorize
  //   Token          https://logincert.anaf.ro/anaf-oauth2/v1/token
  //
  // `logincert.anaf.ro` is the identity provider; `api.anaf.ro` is the
  // protected resource. Authentication is by qualified digital certificate,
  // which the person must have physically connected — the browser does that
  // handshake, not this server, which is why the flow is a redirect rather than
  // something the engine can perform on its own.
  //
  // The token granted depends on TWO enrolments, per the procedure: the user's
  // SPV rights for the company, and whether the registered application itself
  // was enrolled for that service. A token can therefore be valid and still not
  // open e-Factura, which is why `/oauth/test` exists below.
  const ANAF_IDP = 'https://logincert.anaf.ro/anaf-oauth2/v1';

  /** Where to send the person's browser to sign with their certificate. */
  app.get('/oauth/authorize-url', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const row = await sql<any>`SELECT * FROM zv_efactura_settings LIMIT 1`.execute(db);
    const cfg = row.rows[0];
    if (!cfg?.client_id) {
      return c.json({ error: 'Set the ANAF client_id first, on the ANAF connection screen.' }, 400);
    }
    // The stored value wins. ANAF matches redirect_uri against what was
    // registered, character for character, so a guess from the request URL is
    // wrong the moment the instance sits behind a proxy or a different host.
    const redirectUri = cfg.callback_url || c.req.query('redirect_uri');
    if (!redirectUri) {
      return c.json(
        { error: 'Set the callback URL on the ANAF connection screen — it must match exactly what you registered with ANAF.' },
        400,
      );
    }
    const url = new URL(`${ANAF_IDP}/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', cfg.client_id);
    url.searchParams.set('redirect_uri', redirectUri);
    // JWT, so the token can be decoded to see which company and rights it
    // carries rather than discovering them from a later refusal.
    url.searchParams.set('token_content_type', 'jwt');
    return c.json({ data: { url: url.toString(), redirect_uri: redirectUri } });
  });

  /**
   * Exchange the authorization code for tokens.
   *
   * The code arrives on the registered callback, which the operator's own
   * front end forwards here — rather than ANAF calling this route directly,
   * because the callback URL is fixed at application registration and an
   * install's engine may sit behind any path.
   */
  app.post('/oauth/exchange',
    zValidator('json', z.object({ code: z.string().min(1), redirect_uri: z.string().url() })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);
      const d = c.req.valid('json');

      const row = await sql<any>`SELECT * FROM zv_efactura_settings LIMIT 1`.execute(db);
      const cfg = row.rows[0];
      const dec = ctx.internals?.decryptSecret;
      const enc = ctx.internals?.encryptSecret;
      if (!cfg?.client_id || !cfg?.client_secret || !dec || !enc) {
        return c.json({ error: 'ANAF credentials are not configured.' }, 400);
      }

      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: d.code,
        client_id: cfg.client_id,
        client_secret: await dec(cfg.client_secret),
        redirect_uri: d.redirect_uri,
        token_content_type: 'jwt',
      });

      let payload: any;
      try {
        const res = await fetch(`${ANAF_IDP}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
          signal: AbortSignal.timeout(20_000),
        });
        const text = await res.text();
        if (!res.ok) {
          await sql`UPDATE zv_efactura_settings SET last_error = ${text.slice(0, 500)}, updated_at = NOW() WHERE id = ${cfg.id}`.execute(db);
          return c.json({ error: `ANAF refused the token request (${res.status})`, detail: text.slice(0, 500) }, 400);
        }
        payload = JSON.parse(text);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await sql`UPDATE zv_efactura_settings SET last_error = ${msg} , updated_at = NOW() WHERE id = ${cfg.id}`.execute(db);
        return c.json({ error: `Could not reach ANAF: ${msg}` }, 502);
      }

      // `expires_in` is seconds. Stored as an instant so a restart does not lose
      // track of when the token dies.
      const expiresAt = payload.expires_in
        ? new Date(Date.now() + Number(payload.expires_in) * 1000)
        : null;

      await sql`
        UPDATE zv_efactura_settings SET
          access_token = ${await enc(String(payload.access_token ?? ''))},
          refresh_token = ${payload.refresh_token ? await enc(String(payload.refresh_token)) : null},
          token_expires_at = ${expiresAt},
          last_verified_at = NOW(), last_error = NULL, updated_at = NOW()
        WHERE id = ${cfg.id}
      `.execute(db);

      // The token itself is never returned. It is a credential to a tax
      // authority, and the screen only needs to know it worked.
      return c.json({ data: { connected: true, token_expires_at: expiresAt } });
    },
  );

  /** Trade the refresh token for a new access token. */
  app.post('/oauth/refresh', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const row = await sql<any>`SELECT * FROM zv_efactura_settings LIMIT 1`.execute(db);
    const cfg = row.rows[0];
    const dec = ctx.internals?.decryptSecret;
    const enc = ctx.internals?.encryptSecret;
    if (!cfg?.refresh_token || !dec || !enc) return c.json({ error: 'No refresh token stored.' }, 400);

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: await dec(cfg.refresh_token),
      client_id: cfg.client_id,
      client_secret: await dec(cfg.client_secret),
      token_content_type: 'jwt',
    });
    try {
      const res = await fetch(`${ANAF_IDP}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20_000),
      });
      const text = await res.text();
      if (!res.ok) return c.json({ error: `ANAF refused the refresh (${res.status})`, detail: text.slice(0, 400) }, 400);
      const payload = JSON.parse(text);
      const expiresAt = payload.expires_in ? new Date(Date.now() + Number(payload.expires_in) * 1000) : null;
      await sql`
        UPDATE zv_efactura_settings SET
          access_token = ${await enc(String(payload.access_token ?? ''))},
          refresh_token = ${payload.refresh_token ? await enc(String(payload.refresh_token)) : cfg.refresh_token},
          token_expires_at = ${expiresAt}, last_verified_at = NOW(), last_error = NULL, updated_at = NOW()
        WHERE id = ${cfg.id}
      `.execute(db);
      return c.json({ data: { connected: true, token_expires_at: expiresAt } });
    } catch (err) {
      return c.json({ error: `Could not reach ANAF: ${err instanceof Error ? err.message : String(err)}` }, 502);
    }
  });

  /**
   * Call ANAF's own "Hello" service to prove the token works.
   *
   * The procedure states that ANY token issued by the IdP reaches TestOauth, so
   * a failure here means the token itself is wrong — as opposed to a failure on
   * e-Factura, which may equally mean the application was never enrolled for
   * that service. Separating those two is the difference between a useful error
   * and an afternoon.
   */
  app.get('/oauth/test', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const row = await sql<any>`SELECT * FROM zv_efactura_settings LIMIT 1`.execute(db);
    const cfg = row.rows[0];
    const dec = ctx.internals?.decryptSecret;
    if (!cfg?.access_token || !dec) return c.json({ error: 'Not connected to ANAF yet.' }, 400);
    try {
      const res = await fetch('https://api.anaf.ro/TestOauth/jaxrs/hello?name=zveltio', {
        headers: { Authorization: `Bearer ${await dec(cfg.access_token)}` },
        signal: AbortSignal.timeout(20_000),
      });
      const text = await res.text();
      return c.json({ data: { status: res.status, ok: res.ok, response: text.slice(0, 300) } });
    } catch (err) {
      return c.json({ error: `Could not reach ANAF: ${err instanceof Error ? err.message : String(err)}` }, 502);
    }
  });


  /**
   * The official PDF, rendered by ANAF from our own XML.
   *
   * `webservicesp.anaf.ro/.../transformare` needs no credentials, so this works
   * on any install the moment an invoice exists — and the result is the
   * rendering the tax authority itself produces, rather than one this codebase
   * invented and hoped matched.
   */
  app.get('/:id/pdf', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const row = await sql<any>`SELECT invoice_number, xml_content FROM zv_efactura_invoices WHERE id = ${c.req.param('id')}`.execute(db);
    const inv = row.rows[0];
    if (!inv) return c.json({ error: 'Not found' }, 404);
    if (!inv.xml_content) return c.json({ error: 'Generate the XML first' }, 400);
    try {
      const res = await fetch(`${ANAF_PUBLIC}/transformare/FACT1`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: inv.xml_content,
        signal: AbortSignal.timeout(30_000),
      });
      if (!res.ok) {
        return c.json({ error: `ANAF could not render the PDF (${res.status})`, detail: (await res.text()).slice(0, 300) }, 400);
      }
      return new Response(await res.arrayBuffer(), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${String(inv.invoice_number).replace(/[^\w.-]/g, '_')}.pdf"`,
        },
      });
    } catch (err) {
      return c.json({ error: `Could not reach ANAF: ${err instanceof Error ? err.message : String(err)}` }, 502);
    }
  });

  // GET /:id — get invoice
  app.get('/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoice = await db
      .selectFrom('zv_efactura_invoices')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!invoice) return c.json({ error: 'Invoice not found' }, 404);
    return c.json({ invoice });
  });

  // GET /:id/status-log
  app.get('/:id/status-log', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const logs = await sql<any>`
      SELECT * FROM zv_efactura_status_log
      WHERE invoice_id = ${c.req.param('id')}::uuid
      ORDER BY created_at ASC
    `.execute(db);

    return c.json({ log: logs.rows });
  });

  // POST / — create invoice
  app.post('/', zValidator('json', invoiceSchema), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const invoice = await db
      .insertInto('zv_efactura_invoices')
      .values({
        ...body,
        lines: JSON.stringify(body.lines),
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    return c.json({ invoice }, 201);
  });

  // PATCH /:id — update draft
  app.patch('/:id', zValidator('json', invoiceSchema.partial()), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = c.req.valid('json');
    const updates: any = { updated_at: new Date() };
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined) updates[k] = k === 'lines' ? JSON.stringify(v) : v;
    }

    const invoice = await db
      .updateTable('zv_efactura_invoices')
      .set(updates)
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .returningAll()
      .executeTakeFirst();

    if (!invoice) return c.json({ error: 'Invoice not found or not editable' }, 404);
    return c.json({ invoice });
  });

  app.delete('/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .deleteFrom('zv_efactura_invoices')
      .where('id', '=', c.req.param('id'))
      .where('status', '=', 'draft')
      .execute();

    return c.json({ success: true });
  });

  // POST /:id/generate-xml — generate UBL XML
  app.post('/:id/generate-xml', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoice = await db
      .selectFrom('zv_efactura_invoices')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!invoice) return c.json({ error: 'Invoice not found' }, 404);

    const lines = typeof invoice.lines === 'string' ? JSON.parse(invoice.lines) : invoice.lines;
    // The row is NOT the shape the generator declares, and the cast that used
    // to sit here said it was.
    //
    // `InvoiceData` types its amounts as `number`, but Postgres returns NUMERIC
    // as a STRING — the driver refuses to silently lose precision — so
    // `vat_total.toFixed(2)` threw "toFixed is not a function" on every real
    // invoice. Dates come back as Date objects for the same reason. The `as
    // any` bridged the two shapes for the type checker and left the mismatch
    // for runtime, where it turned into a 500 nobody saw, because generating
    // the XML was only ever a precondition for a submission that was faked and
    // never read it.
    //
    // Coerce once, here, at the boundary where the row becomes InvoiceData —
    // rather than defending inside every field of the template.
    const xml = generateUBLXML(toInvoiceData(invoice, lines));

    await db
      .updateTable('zv_efactura_invoices')
      .set({ xml_content: xml, status: 'xml_generated', updated_at: new Date() })
      .where('id', '=', invoice.id)
      .execute();

    await logStatusChange(db, invoice.id, invoice.status, 'xml_generated', user.id);

    return c.json({ xml, message: 'UBL XML generated successfully' });
  });

  // GET /:id/xml — download XML
  app.get('/:id/xml', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoice = await db
      .selectFrom('zv_efactura_invoices')
      .select(['xml_content', 'invoice_number'])
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!invoice?.xml_content) return c.json({ error: 'XML not generated yet' }, 404);

    const safeInvoiceNumber = String(invoice.invoice_number).replace(/[^a-zA-Z0-9\-_.]/g, '_');
    return new Response(invoice.xml_content, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="factura_${safeInvoiceNumber}.xml"`,
      },
    });
  });

  // POST /:id/submit — submit to ANAF


  app.post('/:id/submit', async (c) => {
    const _u = c.get('user') as any;
    if (!(await mayDecide(ctx, _u))) return c.json({ error: 'Not allowed' }, 403);
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const invoice = await db
      .selectFrom('zv_efactura_invoices')
      .selectAll()
      .where('id', '=', c.req.param('id'))
      .executeTakeFirst();

    if (!invoice) return c.json({ error: 'Invoice not found' }, 404);
    if (!invoice.xml_content) return c.json({ error: 'Generate XML first' }, 400);

    const authz = await anafAuth();
    if ('error' in authz) return c.json({ error: authz.error, submitted: false }, 400);

    // `cif` is where ANAF sends the error if it cannot identify the seller from
    // the XML, and the caller must hold SPV rights for it. It is the filing CIF
    // from settings, falling back to the seller's own — a filing agent files
    // for others, so the two are not always the same.
    const cif = String(authz.cfg.seller_cif || invoice.seller_cui || '').replace(/^RO/i, '');
    if (!cif) return c.json({ error: 'No filing CIF configured.' }, 400);

    const url = `${anafApi(authz.cfg.environment)}/upload?standard=UBL&cif=${encodeURIComponent(cif)}`;
    let body: string;
    let status: number;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authz.token}`, 'Content-Type': 'application/xml' },
        body: invoice.xml_content,
        signal: AbortSignal.timeout(60_000),
      });
      status = res.status;
      body = await res.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: `Could not reach ANAF: ${msg}`, submitted: false }, 502);
    }

    // The upload index is what every later call needs, and ANAF returns it in
    // XML. A response we cannot parse an index out of is NOT a success, however
    // encouraging it looks — that assumption is exactly what the old stub made.
    const index = /index_incarcare\s*=\s*"([^"]+)"/i.exec(body)?.[1];
    if (status < 200 || status >= 300 || !index) {
      await sql`
        UPDATE zv_efactura_invoices SET anaf_response = ${body.slice(0, 2000)}, updated_at = NOW()
        WHERE id = ${invoice.id}
      `.execute(db);
      return c.json(
        { error: `ANAF rejected the upload (HTTP ${status})`, detail: body.slice(0, 600), submitted: false },
        400,
      );
    }

    // At this point ANAF HAS the invoice. That fact is irreversible, and the two
    // statements that record it locally have to land together: the status with
    // its upload index, and the audit row that says who submitted it and when.
    //
    // Losing the status update is the dangerous half. The invoice would read as
    // never submitted while it sits in the tax authority's system, and the next
    // submit would file it a SECOND time — a duplicate at ANAF is corrected by
    // storno, which shows on the VAT return.
    await db.transaction().execute(async (trx) => {
      await sql`
        UPDATE zv_efactura_invoices SET
          status = 'submitted', anaf_index = ${index},
          anaf_response = ${body.slice(0, 2000)}, updated_at = NOW()
        WHERE id = ${invoice.id}
      `.execute(trx);
      await logStatusChange(trx, invoice.id, invoice.status, 'submitted', user.id, `ANAF index: ${index}`);
    });

    // The daily aggregate stays OUTSIDE that transaction, deliberately. It is
    // derived — recomputable from the invoices themselves — and rolling the
    // submission record back because a statistics row failed would produce
    // exactly the double-filing described above.
    //
    // The `.catch(() => {})` it used to carry is gone. Inside a transaction a
    // swallowed statement error contains nothing, because Postgres refuses
    // everything after it; and outside one, silently dropping this row makes
    // the VAT totals under-report with no trace. It is logged now.
    try {
      await sql`
        INSERT INTO zv_efactura_daily_stats (date, seller_cui, submitted_count, total_amount, vat_amount)
        VALUES (CURRENT_DATE, ${invoice.seller_cui}, 1, ${invoice.total}, ${invoice.vat_total})
        ON CONFLICT (tenant_id, date, seller_cui)
        DO UPDATE SET submitted_count = zv_efactura_daily_stats.submitted_count + 1,
                      total_amount = zv_efactura_daily_stats.total_amount + EXCLUDED.total_amount,
                      vat_amount = zv_efactura_daily_stats.vat_amount + EXCLUDED.vat_amount
      `.execute(db);
    } catch (err) {
      console.error(
        `[efactura] daily stats not recorded for invoice ${invoice.id} — VAT totals will under-report until recomputed:`,
        (err as Error).message,
      );
    }

    return c.json({ data: { submitted: true, anaf_index: index, environment: authz.cfg.environment } });
  });

  /** Where a submitted invoice has got to. `stare` is ok / nok / in prelucrare. */
  app.get('/:id/anaf-status', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const row = await sql<any>`SELECT * FROM zv_efactura_invoices WHERE id = ${c.req.param('id')}`.execute(db);
    const inv = row.rows[0];
    if (!inv) return c.json({ error: 'Not found' }, 404);
    if (!inv.anaf_index) return c.json({ error: 'This invoice has not been submitted.' }, 400);

    const authz = await anafAuth();
    if ('error' in authz) return c.json({ error: authz.error }, 400);

    try {
      const res = await fetch(
        `${anafApi(authz.cfg.environment)}/stareMesaj?id_incarcare=${encodeURIComponent(inv.anaf_index)}`,
        { headers: { Authorization: `Bearer ${authz.token}` }, signal: AbortSignal.timeout(30_000) },
      );
      const text = await res.text();
      const stare = /stare\s*=\s*"([^"]+)"/i.exec(text)?.[1] ?? null;
      const downloadId = /id_descarcare\s*=\s*"([^"]+)"/i.exec(text)?.[1] ?? null;
      // 'ok' means validated and delivered to the buyer; 'nok' means it was
      // refused and the buyer never sees it. Both are terminal, and conflating
      // them is how somebody believes an invoice arrived.
      if (stare === 'ok' || stare === 'nok') {
        await sql`
          UPDATE zv_efactura_invoices SET status = ${stare === 'ok' ? 'accepted' : 'rejected'},
            anaf_response = ${text.slice(0, 2000)}, updated_at = NOW()
          WHERE id = ${inv.id}
        `.execute(db);
        await logStatusChange(db, inv.id, inv.status, stare === 'ok' ? 'accepted' : 'rejected', user.id);
      }
      return c.json({ data: { stare, download_id: downloadId, raw: text.slice(0, 600) } });
    } catch (err) {
      return c.json({ error: `Could not reach ANAF: ${err instanceof Error ? err.message : String(err)}` }, 502);
    }
  });

  /** Invoices others have sent us, and our own responses, from the last N days. */
  app.get('/anaf/messages', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const authz = await anafAuth();
    if ('error' in authz) return c.json({ error: authz.error }, 400);
    const zile = Math.min(Math.max(parseInt(c.req.query('zile') ?? '30', 10) || 30, 1), 60);
    const cif = String(authz.cfg.seller_cif ?? '').replace(/^RO/i, '');
    if (!cif) return c.json({ error: 'No filing CIF configured.' }, 400);
    const filtru = c.req.query('filtru');
    let url = `${anafApi(authz.cfg.environment)}/listaMesajeFactura?zile=${zile}&cif=${encodeURIComponent(cif)}`;
    if (filtru && ['E', 'T', 'P', 'R'].includes(filtru)) url += `&filtru=${filtru}`;
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${authz.token}` }, signal: AbortSignal.timeout(30_000) });
      const text = await res.text();
      try {
        return c.json({ data: JSON.parse(text) });
      } catch {
        return c.json({ data: { raw: text.slice(0, 2000) } });
      }
    } catch (err) {
      return c.json({ error: `Could not reach ANAF: ${err instanceof Error ? err.message : String(err)}` }, 502);
    }
  });

  /** The signed response archive: the original invoice plus the MF signature. */
  app.get('/anaf/download/:downloadId', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const authz = await anafAuth();
    if ('error' in authz) return c.json({ error: authz.error }, 400);
    const id = c.req.param('downloadId');
    try {
      const res = await fetch(`${anafApi(authz.cfg.environment)}/descarcare?id=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${authz.token}` },
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) return c.json({ error: `ANAF refused the download (${res.status})` }, 400);
      return new Response(await res.arrayBuffer(), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="anaf-${id.replace(/[^\w.-]/g, '_')}.zip"`,
        },
      });
    } catch (err) {
      return c.json({ error: `Could not reach ANAF: ${err instanceof Error ? err.message : String(err)}` }, 502);
    }
  });

  // POST /:id/storno — create storno/credit note
  app.post(
    '/:id/storno',
    zValidator('json', z.object({ reason: z.string().min(1) })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const original = await db.selectFrom('zv_efactura_invoices').selectAll().where('id', '=', c.req.param('id')).executeTakeFirst();
      if (!original) return c.json({ error: 'Invoice not found' }, 404);
      if (!['submitted', 'accepted'].includes(original.status)) return c.json({ error: 'Only submitted/accepted invoices can be storned' }, 400);

      const { reason } = c.req.valid('json');

      // Create storno invoice (negative values)
      const stornoLines = (typeof original.lines === 'string' ? JSON.parse(original.lines) : original.lines)
        .map((l: any) => ({ ...l, quantity: -l.quantity, vat_amount: -l.vat_amount, line_total: -l.line_total }));

      // The credit note and the row that says WHAT it reverses are one
      // correction. Written alone, the negative invoice exists with nothing
      // linking it to the original — it still lands on the VAT return, but
      // nothing shows which filing it cancels, and the pair no longer nets to
      // zero for anyone reading the invoices rather than the storno table.
      const storno = await db.transaction().execute(async (trx) => {
        const created = await trx.insertInto('zv_efactura_invoices').values({
          invoice_number: `STORNO-${original.invoice_number}`,
          invoice_date: new Date().toISOString().split('T')[0],
          seller_name: original.seller_name,
          seller_cui: original.seller_cui,
          buyer_name: original.buyer_name,
          buyer_cui: original.buyer_cui,
          lines: JSON.stringify(stornoLines),
          subtotal: -original.subtotal,
          vat_total: -original.vat_total,
          total: -original.total,
          currency: original.currency,
          created_by: user.id,
        }).returningAll().executeTakeFirst();

        await sql`
          INSERT INTO zv_efactura_storno (original_id, storno_invoice_id, reason, requested_by)
          VALUES (${original.id}::uuid, ${created.id}::uuid, ${reason}, ${user.id})
        `.execute(trx);
        return created;
      });

      return c.json({ storno_invoice: storno }, 201);
    },
  );

  // POST /batch-submit
  app.post(
    '/batch-submit',
    zValidator('json', z.object({ ids: z.array(z.string().uuid()).min(1).max(20) })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);
      // Same key as `/:id/submit`. Twenty invoices to ANAF in one call is not a
      // smaller decision than one.
      if (!(await mayDecide(ctx, user))) return c.json({ error: 'Not allowed' }, 403);

      const { ids } = c.req.valid('json');
      const results: { id: string; success: boolean; error?: string }[] = [];

      for (const id of ids) {
        // A read failure used to arrive at the `if (!inv)` below and be recorded as
        // "Not found" against that invoice — so a batch run over a database blip
        // reported, per invoice, that it does not exist. The operator then goes looking
        // for invoices that are sitting right there.
        //
        // Caught per item on purpose: this is a batch, and one unreadable row must not
        // abandon the rest of the list.
        let inv: {
          id: string;
          status: string;
          xml_content: string | null;
          seller_cui: string | null;
          total: unknown;
          vat_total: unknown;
        } | undefined;
        try {
          inv = await db
            .selectFrom('zv_efactura_invoices')
            .select(['id', 'status', 'xml_content', 'seller_cui', 'total', 'vat_total'])
            .where('id', '=', id)
            .executeTakeFirst();
        } catch (err) {
          results.push({
            id,
            success: false,
            error: `Could not be read: ${err instanceof Error ? err.message : String(err)}`,
          });
          continue;
        }
        if (!inv) { results.push({ id, success: false, error: 'Not found' }); continue; }
        if (!inv.xml_content) { results.push({ id, success: false, error: 'XML not generated' }); continue; }

        // Batch is deliberately NOT a second upload implementation. One code
        // path uploads to ANAF, and it is the single-invoice route above;
        // duplicating it here is how the two drift until one of them is wrong
        // in a way nobody notices.
        results.push({
          id,
          success: false,
          error: 'Use POST /:id/submit for each invoice; batch upload is not implemented.',
        });
      }

      return c.json({ results, submitted: 0 }, 501);
    },
  );

  // GET /stats
  return app;
}
