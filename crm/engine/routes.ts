import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { permissionGate } from '@zveltio/sdk/extension';
import { receivables } from './briefing.js';

type Bindings = { db: any; user: any };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `:id` is interpolated straight into `WHERE x = $1` against a `uuid` column.
 * Postgres refuses a non-uuid parameter with 22P02 — a raw 500, not a 404 —
 * on any typo'd or fuzzed path. A malformed id can never match a row, so the
 * honest answer is the same one a well-formed-but-absent id gets.
 */
function requireUuid(c: any, id: string): Response | null {
  if (UUID_RE.test(id)) return null;
  return c.json({ error: 'Not found' }, 404);
}

function buildListQuery(table: string, allowed: string[]) {
  return (c: any) => {
    const { limit = '50', page = '1', sort, order = 'desc', search } = c.req.query();
    const lim = Math.min(Math.max(1, parseInt(limit)), 200);
    const offset = (Math.max(1, parseInt(page)) - 1) * lim;
    const sortCol = allowed.includes(sort) ? sort : 'created_at';
    const dir = order === 'asc' ? 'ASC' : 'DESC';
    return { lim, offset, sortCol, dir, search: search?.trim() ?? null };
  };
}

/**
 * Is this a syntactically valid Romanian tax code?
 *
 * Deliberately a copy of the same function in finance/invoicing rather than a
 * shared import: each extension is bundled independently, so sharing would mean
 * a runtime dependency between two extensions for the sake of a pure function
 * defined by a published formula that does not change.
 *
 * It matters here because an organization's code flows onto invoices — the
 * invoice form fills the buyer's CUI from the CRM record — and ANAF refuses the
 * whole e-invoice with "CUI cumparator incorect" over a wrong check digit.
 * Catching it where the number is first typed is the only place it is cheap.
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

export function crmRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, events, internals } = ctx;

  const app = new Hono();

  /**
   * Writes to `contacts`, `organizations` and `transactions` are the data API's own
   * (`ctx.internals.createRecord` …), acting as the caller the engine's `/ext/*`
   * gate admitted. They were raw SQL through `ctx.db`, which skipped
   * everything the data API does around a write: the collection permission,
   * column permissions, extension alters, entity access, hooks, `created_by`,
   * revisions, webhooks, data flows, realtime and `record.*` events. An
   * `on_create` flow on contacts never ran for a contact made from this page.
   *
   * So a write needs both: `crm:<action>` (the gate below) to use the CRM, and
   * `<collection>:<action>` to write the collection's rows. The default roles
   * hold both — the manifest declares all four resources — and god bypasses
   * both. The `crm` grant alone no longer writes around a collection the
   * operator refused.
   *
   * The data API's answer, in this route's `{ data }` envelope; its error body
   * and status as they are.
   */
  // biome-ignore lint/suspicious/noExplicitAny: Hono context
  function answered(c: any, res: { status: number; body: unknown }): Response {
    return res.status < 300 ? c.json({ data: res.body }, res.status) : c.json(res.body, res.status);
  }

  /**
   * Per-request DB handle. Returns the tenant-isolated transaction
   * set by the engine's `tenantMiddleware` when one is active, else
   * the global pool. Mirrors the inline helper in the AI extension.
   *
   * After migration 002_tenant_rls.sql, every `zvd_*` table in CRM
   * has FORCE ROW LEVEL SECURITY keyed on
   * `current_setting('zveltio.current_tenant')` — and that GUC is
   * set via `set_config` only on the transaction the middleware
   * issues. Running through the bare pool returns zero rows under
   * FORCE RLS because the GUC is empty there.
   *
   * Prefers `ctx.db` (engine ≥ beta.20): the tenant transaction
   * wrapped in the RestrictedDb table guard. Single-tenant runs as the
   * default tenant, so rows carry that tenant_id and the policy matches.
   */

  // ── Auth guard ────────────────────────────────────────────────────────────
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // Dashboard briefing needs only a session — same soft-fail contract as the
  // old /api/briefing. Requiring crm:read would hide the card for admins who
  // have not granted themselves the CRM resource yet.
  app.get('/briefing', async (c) => {
    return c.json({ receivables: await receivables(db) });
  });

  // ── RBAC gate ─────────────────────────────────────────────────────────────
  // All CRM endpoints require the caller to hold the matching permission on
  // the `crm` resource (read/create/update/delete). Operators grant access via
  // a Casbin policy in `zvd_permissions`; the god role bypasses.
  app.use('*', permissionGate(ctx, 'crm'));

  // ═══════════════════════════════════════════════════════
  // CONTACTS
  // ═══════════════════════════════════════════════════════

  app.get('/contacts', async (c) => {
    const { lim, offset, sortCol, dir, search } = buildListQuery(
      'zvd_contacts',
      ['first_name', 'last_name', 'email', 'created_at'],
    )(c);

    // The primary organization comes along, so the list can show who someone
    // actually belongs to rather than only the free-text company they typed.
    //
    // Every column is table-qualified below. Joining organizations brings a
    // second email, created_at, id and name into scope, and an unqualified
    // reference to any of them stops being a search and becomes an ambiguity
    // error.
    const rows = await sql`
      SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.company, c.job_title,
             c.avatar_url, c.tags, c.source, c.notes, c.created_at, c.updated_at,
             po.id AS organization_id, po.name AS organization_name, pco.role AS organization_role
      FROM zvd_contacts c
      LEFT JOIN zvd_contact_organizations pco
             ON pco.contact_id = c.id AND pco.is_primary = TRUE
      LEFT JOIN zvd_organizations po ON po.id = pco.organization_id
      WHERE (
        ${search ? sql`(c.first_name ILIKE ${'%' + search + '%'}
          OR c.last_name ILIKE ${'%' + search + '%'}
          OR c.email ILIKE ${'%' + search + '%'}
          OR c.company ILIKE ${'%' + search + '%'}
          OR po.name ILIKE ${'%' + search + '%'})` : sql`TRUE`}
      )
      ORDER BY c.${sql.raw(sortCol)} ${sql.raw(dir)}
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);

    const total = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zvd_contacts
      WHERE (${search ? sql`first_name ILIKE ${'%' + search + '%'}
        OR last_name ILIKE ${'%' + search + '%'}
        OR email ILIKE ${'%' + search + '%'}` : sql`TRUE`})
    `.execute(db);

    return c.json({
      data: rows.rows,
      meta: { total: parseInt((total.rows[0] as any).count), page: Math.ceil(offset / lim) + 1, limit: lim },
    });
  });

  app.get('/contacts/:id', async (c) => {
    const id = c.req.param('id');
    const invalid = requireUuid(c, id);
    if (invalid) return invalid;
    const row = await sql`
      SELECT c.*, COALESCE(json_agg(o.*) FILTER (WHERE o.id IS NOT NULL), '[]') AS organizations
      FROM zvd_contacts c
      LEFT JOIN zvd_contact_organizations co ON co.contact_id = c.id
      LEFT JOIN zvd_organizations o ON o.id = co.organization_id
      WHERE c.id = ${id}
      GROUP BY c.id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  /**
   * Put a contact in an organization.
   *
   * `zvd_contact_organizations` has been in the schema since the first
   * migration, carrying `role` and `is_primary`, and BOTH read paths join it:
   * `GET /contacts/:id` returns an `organizations` array built from it, and the
   * organizations list counts its members through it. Nothing ever inserted a
   * row — it was read in two places and written in none.
   *
   * So every contact came back with an empty `organizations` array, every
   * organization reported zero people, and the relation existed only as a
   * drawing on the schema. That is the whole reason the CRM behaves like a flat
   * address book: `company` is a free-text string on the contact, which is what
   * people ended up typing, and the actual link had no way in.
   *
   * `is_primary` is kept unique per contact by demoting the others first —
   * "primary" has to mean one of them for the list view to pick a single
   * organization to show.
   */
  async function linkContactOrganization(
    contactId: string,
    organizationId: string,
    role: string | undefined,
    isPrimary: boolean,
  ): Promise<void> {
    // Demoting the old primary organisation and writing the new link are one
    // change. Split, the contact belongs to organisations but to none of them
    // primarily — and the primary is what every list, invoice and mail-merge
    // reads when it needs "the company this person is at".
    await db.transaction().execute(async (trx) => {
      if (isPrimary) {
        await sql`
          UPDATE zvd_contact_organizations SET is_primary = FALSE WHERE contact_id = ${contactId}
        `.execute(trx);
      }
      await sql`
        INSERT INTO zvd_contact_organizations (contact_id, organization_id, role, is_primary)
        VALUES (${contactId}, ${organizationId}, ${role ?? null}, ${isPrimary})
        ON CONFLICT (contact_id, organization_id)
        DO UPDATE SET role = EXCLUDED.role, is_primary = EXCLUDED.is_primary
      `.execute(trx);
    });
  }

  app.post('/contacts',
    zValidator('json', z.object({
      first_name: z.string().min(1),
      last_name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      job_title: z.string().optional(),
      avatar_url: z.string().url().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      source: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      organization_id: z.string().uuid().optional(),
      /** Free text — "CFO", "buyer". The model does not fix a vocabulary. */
      organization_role: z.string().optional(),
    })),
    async (c) => {
      const { organization_id, organization_role, ...fields } = c.req.valid('json');
      const res = await internals.createRecord(c, 'contacts', fields);
      if (res.status >= 300) return answered(c, res);
      const contact = res.body as { id: string };
      // Primary: it is the only membership a contact has when created. Same
      // request transaction as the insert, so a refused link takes it back.
      if (organization_id) {
        await linkContactOrganization(contact.id, organization_id, organization_role, true);
      }
      events.emit('contact.created', { id: contact.id, contact });
      return answered(c, res);
    },
  );

  app.patch('/contacts/:id',
    zValidator('json', z.object({
      first_name: z.string().min(1).optional(),
      last_name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      company: z.string().optional(),
      job_title: z.string().optional(),
      avatar_url: z.string().url().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      source: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      organization_id: z.string().uuid().optional(),
      organization_role: z.string().optional(),
    })),
    async (c) => {
      const d = c.req.valid('json');
      const id = c.req.param('id');
      const invalid = requireUuid(c, id);
      if (invalid) return invalid;
      // The membership lives in the join table, not in a column here:
      // `zvd_contacts` carries an unused legacy `organization_id` column, and
      // writing it would show no organization anywhere.
      const { organization_id, organization_role, ...fields } = d;
      let contact: unknown;
      if (Object.keys(fields).length) {
        // Before the link, so a refused edit links nothing.
        const res = await internals.updateRecord(c, 'contacts', id, fields);
        if (res.status >= 300) return answered(c, res);
        contact = res.body;
        events.emit('contact.updated', { id, contact });
      } else if (organization_id) {
        // Changing only the organization is a legitimate edit, so this is no
        // longer "nothing to update".
        const row = await sql`SELECT * FROM zvd_contacts WHERE id = ${id}`.execute(db);
        if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
        contact = row.rows[0];
      } else {
        return c.json({ error: 'No fields to update' }, 400);
      }
      if (organization_id) {
        await linkContactOrganization(id, organization_id, organization_role, true);
      }
      return c.json({ data: contact });
    },
  );

  app.delete('/contacts/:id', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');
    const invalid = requireUuid(c, id);
    if (invalid) return invalid;
    const existing = await sql<{ created_by: string }>`
      SELECT created_by FROM zvd_contacts WHERE id = ${id}
    `.execute(db);
    if (!existing.rows[0]) return c.json({ error: 'Not found' }, 404);
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (existing.rows[0].created_by !== user.id && !isAdmin) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const res = await internals.deleteRecord(c, 'contacts', id);
    if (res.status >= 300) return answered(c, res);
    events.emit('contact.deleted', { id });
    return c.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════
  // ORGANIZATIONS
  // ═══════════════════════════════════════════════════════

  app.get('/organizations', async (c) => {
    const { lim, offset, sortCol, dir, search } = buildListQuery(
      'zvd_organizations',
      ['name', 'industry', 'created_at'],
    )(c);

    const rows = await sql`
      SELECT id, name, legal_name, tax_id, type, industry, website,
             email, phone, logo_url, is_active, tags, created_at, updated_at
      FROM zvd_organizations
      WHERE (${search ? sql`name ILIKE ${'%' + search + '%'} OR tax_id ILIKE ${'%' + search + '%'}` : sql`TRUE`})
      ORDER BY ${sql.raw(sortCol)} ${sql.raw(dir)}
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);

    const total = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zvd_organizations
      WHERE (${search ? sql`name ILIKE ${'%' + search + '%'}` : sql`TRUE`})
    `.execute(db);

    return c.json({
      data: rows.rows,
      meta: { total: parseInt((total.rows[0] as any).count), page: Math.ceil(offset / lim) + 1, limit: lim },
    });
  });

  app.get('/organizations/:id', async (c) => {
    const id = c.req.param('id');
    const invalid = requireUuid(c, id);
    if (invalid) return invalid;
    const row = await sql`
      SELECT o.*,
        COALESCE(json_agg(json_build_object('id', c.id, 'first_name', c.first_name, 'last_name', c.last_name, 'email', c.email))
          FILTER (WHERE c.id IS NOT NULL), '[]') AS contacts
      FROM zvd_organizations o
      LEFT JOIN zvd_contact_organizations co ON co.organization_id = o.id
      LEFT JOIN zvd_contacts c ON c.id = co.contact_id
      WHERE o.id = ${id}
      GROUP BY o.id
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/organizations',
    zValidator('json', z.object({
      name: z.string().min(1),
      legal_name: z.string().optional(),
      tax_id: z.string().optional(),
      registration_no: z.string().optional(),
      type: z.enum(['company', 'nonprofit', 'government', 'individual']).default('company'),
      industry: z.string().optional(),
      website: z.string().url().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      logo_url: z.string().url().optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })),
    async (c) => {
      const d = c.req.valid('json');
      if (d.tax_id && !isValidCui(d.tax_id)) {
        return c.json(
          { error: `"${d.tax_id}" is not a valid Romanian tax code — the check digit does not match.` },
          400,
        );
      }
      const res = await internals.createRecord(c, 'organizations', d);
      if (res.status >= 300) return answered(c, res);
      const organization = res.body as { id: string };
      events.emit('organization.created', { id: organization.id, organization });
      return answered(c, res);
    },
  );

  app.patch('/organizations/:id',
    zValidator('json', z.object({
      name: z.string().min(1).optional(),
      legal_name: z.string().optional(),
      tax_id: z.string().optional(),
      type: z.enum(['company', 'nonprofit', 'government', 'individual']).optional(),
      industry: z.string().optional(),
      website: z.string().url().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      logo_url: z.string().url().optional(),
      is_active: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })),
    async (c) => {
      const d = c.req.valid('json');
      const id = c.req.param('id');
      const invalid = requireUuid(c, id);
      if (invalid) return invalid;
      if (!Object.keys(d).length) return c.json({ error: 'No fields to update' }, 400);
      const res = await internals.updateRecord(c, 'organizations', id, d);
      if (res.status >= 300) return answered(c, res);
      events.emit('organization.updated', { id, organization: res.body });
      return answered(c, res);
    },
  );

  app.delete('/organizations/:id', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');
    const invalid = requireUuid(c, id);
    if (invalid) return invalid;
    const existing = await sql<{ created_by: string }>`
      SELECT created_by FROM zvd_organizations WHERE id = ${id}
    `.execute(db);
    if (!existing.rows[0]) return c.json({ error: 'Not found' }, 404);
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (existing.rows[0].created_by !== user.id && !isAdmin) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const res = await internals.deleteRecord(c, 'organizations', id);
    if (res.status >= 300) return answered(c, res);
    events.emit('organization.deleted', { id });
    return c.json({ success: true });
  });

  // ═══════════════════════════════════════════════════════
  // TRANSACTIONS
  // ═══════════════════════════════════════════════════════

  app.get('/transactions', async (c) => {
    const { lim, offset, sortCol, dir, search } = buildListQuery(
      'zvd_transactions',
      ['number', 'type', 'status', 'amount', 'created_at'],
    )(c);
    const { type, status } = c.req.query();

    const rows = await sql`
      SELECT t.id, t.type, t.status, t.number, t.currency, t.amount,
             t.tax_amount, t.total_amount, t.due_date, t.paid_date,
             t.created_at, t.updated_at,
             json_build_object('id', c.id, 'first_name', c.first_name, 'last_name', c.last_name) AS contact,
             json_build_object('id', o.id, 'name', o.name) AS organization
      FROM zvd_transactions t
      LEFT JOIN zvd_contacts c ON c.id = t.contact_id
      LEFT JOIN zvd_organizations o ON o.id = t.organization_id
      WHERE (${type ? sql`t.type = ${type}` : sql`TRUE`})
        AND (${status ? sql`t.status = ${status}` : sql`TRUE`})
        AND (${search ? sql`t.number ILIKE ${'%' + search + '%'} OR t.reference ILIKE ${'%' + search + '%'}` : sql`TRUE`})
      ORDER BY ${sql.raw('t.' + sortCol)} ${sql.raw(dir)}
      LIMIT ${lim} OFFSET ${offset}
    `.execute(db);

    const total = await sql<{ count: string }>`
      SELECT COUNT(*) as count FROM zvd_transactions
      WHERE (${type ? sql`type = ${type}` : sql`TRUE`})
        AND (${status ? sql`status = ${status}` : sql`TRUE`})
    `.execute(db);

    return c.json({
      data: rows.rows,
      meta: { total: parseInt((total.rows[0] as any).count), page: Math.ceil(offset / lim) + 1, limit: lim },
    });
  });

  app.get('/transactions/:id', async (c) => {
    const id = c.req.param('id');
    const invalid = requireUuid(c, id);
    if (invalid) return invalid;
    const row = await sql`
      SELECT t.*,
        json_build_object('id', c.id, 'first_name', c.first_name, 'last_name', c.last_name, 'email', c.email) AS contact,
        json_build_object('id', o.id, 'name', o.name) AS organization
      FROM zvd_transactions t
      LEFT JOIN zvd_contacts c ON c.id = t.contact_id
      LEFT JOIN zvd_organizations o ON o.id = t.organization_id
      WHERE t.id = ${id}
    `.execute(db);
    if (!row.rows.length) return c.json({ error: 'Not found' }, 404);
    return c.json({ data: row.rows[0] });
  });

  app.post('/transactions',
    zValidator('json', z.object({
      type: z.enum(['invoice', 'payment', 'credit_note', 'expense', 'transfer', 'other']),
      status: z.enum(['draft', 'pending', 'completed', 'cancelled', 'refunded']).default('draft'),
      number: z.string().optional(),
      organization_id: z.string().uuid().optional(),
      contact_id: z.string().uuid().optional(),
      currency: z.string().default('RON'),
      amount: z.number().default(0),
      tax_amount: z.number().default(0),
      total_amount: z.number().default(0),
      due_date: z.string().optional(),
      paid_date: z.string().optional(),
      line_items: z.array(z.record(z.string(), z.unknown())).optional(),
      notes: z.string().optional(),
      reference: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })),
    async (c) => {
      return answered(c, await internals.createRecord(c, 'transactions', c.req.valid('json')));
    },
  );

  app.patch('/transactions/:id',
    zValidator('json', z.object({
      status: z.enum(['draft', 'pending', 'completed', 'cancelled', 'refunded']).optional(),
      number: z.string().optional(),
      currency: z.string().optional(),
      amount: z.number().optional(),
      tax_amount: z.number().optional(),
      total_amount: z.number().optional(),
      due_date: z.string().optional(),
      paid_date: z.string().optional(),
      notes: z.string().optional(),
      reference: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })),
    async (c) => {
      const d = c.req.valid('json');
      const id = c.req.param('id');
      const invalid = requireUuid(c, id);
      if (invalid) return invalid;
      if (!Object.keys(d).length) return c.json({ error: 'No fields to update' }, 400);
      return answered(c, await internals.updateRecord(c, 'transactions', id, d));
    },
  );

  app.delete('/transactions/:id', async (c) => {
    const user = c.get('user') as any;
    const id = c.req.param('id');
    const invalid = requireUuid(c, id);
    if (invalid) return invalid;
    const existing = await sql<{ created_by: string }>`
      SELECT created_by FROM zvd_transactions WHERE id = ${id}
    `.execute(db);
    if (!existing.rows[0]) return c.json({ error: 'Not found' }, 404);
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (existing.rows[0].created_by !== user.id && !isAdmin) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    const res = await internals.deleteRecord(c, 'transactions', id);
    if (res.status >= 300) return answered(c, res);
    return c.json({ success: true });
  });

  return app;
}
