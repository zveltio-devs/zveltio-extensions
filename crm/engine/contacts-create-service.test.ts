// Regression: `crm.contacts.create` (the published service `operations/pos`
// and `ecommerce/store` call to get a canonical contact) accepts
// `organization_id` in its input type but only wrote the legacy, unread
// `zvd_contacts.organization_id` column. Every route reads the organization
// through the `zvd_contact_organizations` join table instead, so a contact
// created through the service with an organization would show no
// organization anywhere the API surfaces one. Runs against the packed
// bundle + real Postgres.
import { describe, expect, it } from 'bun:test';
import { sql } from 'kysely';
import { mountForTest } from '../../testing/ext-harness';

const d = process.env.TEST_DATABASE_URL ? describe : describe.skip;

d('crm.contacts.create service links the organization', () => {
  it('creates a zvd_contact_organizations row when organization_id is given', async () => {
    const { ctx } = await mountForTest(import.meta.dir, { authed: true, admin: true });
    const org = await sql<{ id: string }>`
      INSERT INTO zvd_organizations (name, created_by) VALUES ('Service Test Org', 'svc-user')
      RETURNING id
    `.execute(ctx.db);
    const organizationId = org.rows[0].id;

    const create = ctx.services.get<(input: any) => Promise<any>>('crm.contacts.create');
    const contact = await create!({
      first_name: 'Service',
      last_name: 'Created',
      email: `service-created-${Date.now()}@example.test`,
      organization_id: organizationId,
      created_by: 'svc-user',
    });

    const link = await sql<{ organization_id: string; is_primary: boolean }>`
      SELECT organization_id, is_primary FROM zvd_contact_organizations WHERE contact_id = ${contact.id}
    `.execute(ctx.db);

    expect(link.rows.length).toBe(1);
    expect(link.rows[0].organization_id).toBe(organizationId);
    expect(link.rows[0].is_primary).toBe(true);
  });
});
