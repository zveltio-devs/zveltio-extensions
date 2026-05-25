import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { sql } from 'kysely';
import { crmRoutes } from './routes.js';

/**
 * CRM extension — canonical owner of `zvd_contacts` and `zvd_organizations`.
 *
 * Publishes the following services for cross-extension consumption:
 *   crm.contacts.lookup(idOrEmail)         → contact row | null
 *   crm.contacts.create(input)             → created contact
 *   crm.contacts.findByEmail(email)        → contact row | null
 *   crm.organizations.lookup(idOrName)     → organization row | null
 *   crm.organizations.findByName(name)     → organization row | null
 *
 * Other extensions (invoicing, ecommerce, pos, subscriptions) consume these
 * to share a single customer identity instead of maintaining their own copies.
 *
 * Also emits events on the engine event bus that other extensions can react to:
 *   contact.created    { id, contact }
 *   contact.updated    { id, contact, before }
 *   contact.deleted    { id }
 *   organization.created/updated/deleted   (same shape with `organization`)
 */
const extension: ZveltioExtension = {
  name: 'crm',
  category: 'business',
  // S3-01: sub-app mounted at /ext/crm by the engine. Internal routes
  // (/contacts, /organizations, /transactions) are exposed under that prefix.
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_tenant_rls.sql'),
    ];
  },

  async register(app, ctx) {
    const routes = crmRoutes(ctx);
    app.route('/', routes);

    // ── Service registry — canonical contacts/organizations API ─────────────
    ctx.services.register('crm.contacts.lookup', async (idOrEmail: string) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrEmail);
      const r = await sql<any>`
        SELECT * FROM zvd_contacts
        WHERE ${isUuid ? sql`id = ${idOrEmail}::uuid` : sql`email = ${idOrEmail}`}
        LIMIT 1
      `.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    ctx.services.register('crm.contacts.findByEmail', async (email: string) => {
      const r = await sql<any>`
        SELECT * FROM zvd_contacts WHERE email = ${email} LIMIT 1
      `.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    ctx.services.register('crm.contacts.create', async (input: {
      first_name: string;
      last_name?: string;
      email?: string;
      phone?: string;
      organization_id?: string;
      created_by: string;
    }) => {
      const r = await sql<any>`
        INSERT INTO zvd_contacts (first_name, last_name, email, phone, organization_id, created_by)
        VALUES (${input.first_name}, ${input.last_name ?? null}, ${input.email ?? null},
                ${input.phone ?? null}, ${input.organization_id ?? null}, ${input.created_by})
        RETURNING *
      `.execute(ctx.db);
      const contact = r.rows[0];
      ctx.events.emit('contact.created', { id: contact.id, contact });
      return contact;
    });

    ctx.services.register('crm.organizations.lookup', async (idOrName: string) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName);
      const r = await sql<any>`
        SELECT * FROM zvd_organizations
        WHERE ${isUuid ? sql`id = ${idOrName}::uuid` : sql`name = ${idOrName}`}
        LIMIT 1
      `.execute(ctx.db);
      return r.rows[0] ?? null;
    });

    ctx.services.register('crm.organizations.findByName', async (name: string) => {
      const r = await sql<any>`
        SELECT * FROM zvd_organizations WHERE name = ${name} LIMIT 1
      `.execute(ctx.db);
      return r.rows[0] ?? null;
    });
  },
};

export default extension;
