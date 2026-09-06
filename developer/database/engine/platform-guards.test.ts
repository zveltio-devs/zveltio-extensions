// `developer/database` could dismantle the tenant boundary from inside an extension.
//
// Every route here is behind `requireInstanceAdmin`, so this was never
// unauthenticated — but authorised is not the same as bounded. The routes issue
// DDL through `sql.raw` with no restriction on WHICH object, and three of them
// reach the machinery multi-tenancy rests on:
//
//   DELETE /roles/:name   protected `postgres` and `pg_*` and stopped there, so
//                         `zveltio_rls` (engine migration 030, the role isolation
//                         is enforced as) and `zveltio_worker` (043) were droppable.
//   PATCH  /rls/:table    `{"enabled": false}` on `zvd_orders` turns off tenant
//                         isolation for that collection, for every tenant.
//   DELETE /rls/:t/:p     dropping `tenant_isolation_*` does the same thing one
//                         object lower down.
//   POST   /rls           and adding a PERMISSIVE `USING (true)` beside it does it
//                         a third way, without touching the existing policy —
//                         PERMISSIVE policies are OR-ed.
//
// The positive cases are half the point. A guard that refuses everything looks
// identical to one that refuses the right things, and this extension exists to
// administer a database: it has to keep working on tables that are not ours.
import { describe, expect, it } from 'bun:test';
// Imported, not restated. A test that reimplements the rule it is checking
// passes whatever the route later does — which is the failure mode this whole
// campaign keeps finding, so it is not one to build into the test for it.
import { isPlatformTable, isProtectedRole, isIsolationPolicy } from './platform-guards.js';

describe('developer/database — what counts as a platform table', () => {
  it('covers tenant collections, engine tables and the unprefixed Better-Auth ones', () => {
    // `zvd_*` is where every tenant's records live; `zv_*` is the engine's own.
    for (const t of ['zvd_orders', 'ZVD_Orders', 'zv_api_keys', 'zv_tenants']) {
      expect(isPlatformTable(t)).toBe(true);
    }
    // These have no prefix to match, and they are where sessions and password
    // hashes live — the exact set the table sandbox was once shaped to miss.
    for (const t of ['user', 'session', 'account', 'twoFactor', 'verification']) {
      expect(isPlatformTable(t)).toBe(true);
    }
  });

  it('leaves genuinely foreign tables alone', () => {
    // A DBA console that cannot touch the customer's own tables is not a console.
    for (const t of ['orders', 'public_report', 'legacy_import', 'analytics_2026']) {
      expect(isPlatformTable(t)).toBe(false);
    }
  });

  it('does not match a table merely containing the prefix', () => {
    // Prefix, not substring: `my_zvd_notes` is the customer's.
    expect(isPlatformTable('my_zvd_notes')).toBe(false);
    expect(isPlatformTable('archive_zv_logs')).toBe(false);
  });
});

describe('developer/database — protected roles', () => {
  const blocked = isProtectedRole;

  it('refuses the roles tenant isolation is enforced as', () => {
    // The two the old denylist missed. Dropping either removes the boundary for
    // the whole instance.
    expect(blocked('zveltio_rls')).toBe(true);
    expect(blocked('zveltio_worker')).toBe(true);
    // Prefix, so a role the engine adds later is covered without an edit here.
    expect(blocked('zveltio_something_new')).toBe(true);
  });

  it('still refuses what it refused before', () => {
    expect(blocked('postgres')).toBe(true);
    expect(blocked('pg_monitor')).toBe(true);
    expect(blocked('pg_signal_backend')).toBe(true);
  });

  it('still allows dropping an ordinary role', () => {
    // Positive control: role administration is what the route is for.
    expect(blocked('reporting_readonly')).toBe(false);
    expect(blocked('etl_service')).toBe(false);
  });
});

describe('developer/database — the isolation policy name', () => {
  const isIsolation = isIsolationPolicy;

  it('refuses the engine-generated isolation policies', () => {
    expect(isIsolation('tenant_isolation_zvd_orders')).toBe(true);
    expect(isIsolation('TENANT_ISOLATION_zv_api_keys')).toBe(true);
  });

  it('allows an operator to drop a policy they wrote themselves', () => {
    expect(isIsolation('readonly_reports')).toBe(false);
    expect(isIsolation('my_tenant_isolation_copy')).toBe(false);
  });
});
