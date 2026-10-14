// The packed bundle's `mail-poll` runs once per tenant, inside its transaction
// (B02). Without `perTenant` the engine ran it with no tenant: under RLS it
// polled the root tenant's mailboxes only, and on a superuser pool it synced
// every tenant's mail into the root tenant. The engine side is proven in
// zveltio `tests/harness/extension-schedule-per-tenant.test.ts`.
import { expect, it } from 'bun:test';

it('mail-poll is a perTenant schedule', async () => {
  const ext = (await import('./index.js')).default as {
    schedules: () => Array<{ name: string; perTenant?: boolean }>;
  };
  const poll = ext.schedules().find((s) => s.name === 'mail-poll');
  expect(poll?.perTenant).toBe(true);
});
