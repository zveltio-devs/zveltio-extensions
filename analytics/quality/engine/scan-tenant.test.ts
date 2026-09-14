/**
 * A quality scan runs in the firm that asked for it, or it does not run.
 *
 * This replaces `zveltio/packages/engine/src/tests/unit/quality-scan-tenant.test.ts`,
 * which guarded the same rule while the scanner was an engine module. Deleting
 * it without a replacement would have dropped a fixed leak's only regression
 * guard — the same reasoning `content/pages/engine/tenant-isolation.test.ts`
 * sets out for the routes that moved before these.
 *
 * ## The leak being guarded
 *
 * `tenantId` used to default to `DEFAULT_TENANT_ID`, and the only caller — this
 * extension — passed four arguments. So every scan on the instance opened
 * `withTenantIsolation(root)` whatever firm asked for it: it read the ROOT
 * tenant's rows, and the issues handed back carried root's record ids and field
 * values in their descriptions. Neither `zv_quality_scans` nor
 * `zv_quality_issues` has a `tenant_id` to have caught it afterwards.
 *
 * ## Why the shape changed with the move
 *
 * The engine version asserted a RUNTIME refusal: `runQualityScan` read the
 * request's domain through `getCurrentDomainOrNull()` and threw when there was
 * none. That fallback did not survive the move, and deliberately so — reading
 * an ambient request-scoped global is authority an extension does not get.
 *
 * `tenantId` is a required parameter now, so "scan with no tenant" is a
 * compile error rather than a runtime throw, and `tsc` is what guards it. What
 * moved to runtime is the boundary: the ROUTE has to get a tenant out of the
 * request and refuse when there is none. That is what these cases cover, and it
 * is the half a type cannot check.
 *
 * The wrong version of this route is one line, and two sibling extensions ship
 * it today — `data/import` and `data/export` both spell it
 * `?? '00000000-0000-0000-0000-000000000001'`, which is the very shape that
 * caused the leak. So this is worth a test rather than a comment.
 */

import { describe, expect, test } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const USER = { id: 'u-1' };

/**
 * A db that answers exactly one question: the `zv_quality_scans` row the
 * scanner inserts before it asks for isolation. Everything past that point is
 * covered by the unit tests in `tests/`; what matters here is which tenant the
 * route hands over, and `inserts` records whether it got that far at all.
 */
function ctxWith(scanRecorder?: (tenantId: string) => void): Any & { inserts: string[] } {
  const inserts: string[] = [];
  const chain: Any = {
    values: () => chain,
    returningAll: () => chain,
    executeTakeFirst: async () => ({ id: 'scan-1' }),
    set: () => chain,
    where: () => chain,
    execute: async () => [],
  };
  const db: Any = {
    insertInto(table: string) {
      inserts.push(table);
      return chain;
    },
    updateTable: () => chain,
    selectFrom: () => chain,
  };

  return {
    inserts,
    db,
    // The extension guards its own routes with a session check before any
    // handler runs — `/ext/*` is fail-closed and each extension defends itself.
    auth: { api: { getSession: async () => ({ user: USER }) } },
    checkPermission: async () => true,
    DDLManager: {},
    services: { get: () => undefined },
    internals: {
      withTenantIsolation: async (tenantId: string) => {
        scanRecorder?.(tenantId);
        // Stop before the scan body: which tenant was asked for is the question.
        throw new Error('isolation reached');
      },
    },
  };
}

/**
 * Mounts the PACKED `engine/index.js` — the artifact the engine loads, not the
 * source beside it — and drives one POST /scan, with or without a tenant.
 */
async function postScan(ctx: Any, tenant: { id: string } | null): Promise<Response> {
  const mod = await import(join(import.meta.dir, 'index.js'));
  const { Hono } = (await import(
    join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
  )) as Any;

  const app = new Hono();
  // The host resolves the tenant before the extension sees the request and puts
  // it on the context. `null` is what a request that resolved none looks like —
  // and defaulting there instead of refusing is the whole bug.
  app.use('*', async (c: Any, next: Any) => {
    c.set('user', USER);
    c.set('tenant', tenant);
    await next();
  });
  await mod.default.register(app, ctx);

  return app.request('/scan', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ collection: 'contacts', scan_type: 'full' }),
  });
}

describe('POST /scan picks a tenant', () => {
  test('refuses with 400 when the request carries no tenant', async () => {
    const ctx = ctxWith();
    const res = await postScan(ctx, null);

    expect(res.status).toBe(400);
    // The message has to say it was a refusal, not a failure — the next person
    // to meet this needs to know the root tenant was declined on purpose.
    expect(await res.text()).toMatch(/root/i);
    // Refused before the database: no scan row was opened for a scan that will
    // never run. A 400 with a row written would leave the table lying.
    expect(ctx.inserts).toEqual([]);
  });

  test('scans under the tenant on the request, not another', async () => {
    const seen: string[] = [];
    const ctx = ctxWith((t) => seen.push(t));
    const res = await postScan(ctx, { id: 'tenant-42' });

    expect(res.status).toBe(202);
    expect(ctx.inserts).toEqual(['zv_quality_scans']);
    expect(seen).toEqual(['tenant-42']);
  });
});
