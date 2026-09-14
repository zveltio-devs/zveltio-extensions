/**
 * Test doubles for what `runQualityScan` now takes as arguments.
 *
 * These tests moved with the scanner out of the engine, where they reached
 * straight into `initTenantManager`, the real `DDLManager` and the real
 * `serviceRegistry`. An extension has none of those: it gets `ctx.db`,
 * `ctx.DDLManager`, `ctx.services` and `ctx.internals.withTenantIsolation`,
 * which is exactly what the scanner now asks for.
 *
 * So the test bodies are unchanged — every assertion still reads the SQL that
 * reaches `CannedDb` — and only the wiring is different. `scanWith()` keeps the
 * original positional call shape on purpose: rewriting 31 call sites by hand
 * while also changing what they assert is how a port quietly loses a test.
 *
 * One deliberate difference from the engine originals: this `DDLManager` double
 * does NOT cache. The real one caches collection definitions process-wide,
 * which is why the engine tests had to call `invalidateCache()` in `beforeEach`
 * and why one of them carries a comment explaining a leak between scans.
 * `invalidateCache()` is kept as a no-op so those lines still read correctly.
 */

import type { CannedDb } from './fixtures/canned-db.js';
import { runQualityScan } from '../lib/data-quality.js';

/** `ctx.DDLManager`, reduced to the one method the scanner calls. */
export const DDLManager = {
  // biome-ignore lint/suspicious/noExplicitAny: mirrors ExtensionContext.DDLManager
  async getCollection(db: any, name: string): Promise<any | null> {
    const row = await db
      .selectFrom('zvd_collections')
      .selectAll()
      .where('name', '=', name)
      .executeTakeFirst();
    if (!row) return null;
    // Same normalisation as the real one: `fields` is stored as JSON text.
    return {
      ...row,
      fields: typeof row.fields === 'string' ? JSON.parse(row.fields) : (row.fields ?? []),
    };
  },
  /** No-op: this double has no cache to invalidate. */
  invalidateCache(): void {},
};

/** `ctx.services`, with the register/unregister shape the AI tests use. */
class FakeServices {
  // biome-ignore lint/suspicious/noExplicitAny: a service container is heterogeneous by nature
  private readonly entries = new Map<string, any>();

  // biome-ignore lint/suspicious/noExplicitAny: ditto
  registerAs(_owner: string, name: string, impl: any): void {
    this.entries.set(name, impl);
  }

  unregisterAs(_owner: string, name: string): void {
    this.entries.delete(name);
  }

  get<T>(name: string): T | undefined {
    return this.entries.get(name) as T | undefined;
  }
}

export const serviceRegistry = new FakeServices();

/**
 * Binds a `CannedDb` as both the caller's db and the tenant-isolation pool,
 * and returns the scanner in its original positional shape.
 *
 * `withTenantIsolation` runs the callback against the same canned db — in the
 * engine tests `initTenantManager(db)` achieved this by handing the tenant
 * manager the same object.
 */
export interface Scanner {
  (
    _db: unknown,
    collection: string,
    scanType: 'duplicates' | 'anomalies' | 'missing_data' | 'normalization' | 'full',
    userId: string,
    tenantSchema?: string,
    tenantId?: string,
  ): Promise<string>;
  /** Tenants `withTenantIsolation` was asked for, in order. */
  readonly tenants: string[];
  /** Make the next isolated body reject, standing in for a failure inside it. */
  failIsolation(err: Error): void;
}

export function scanWith(db: CannedDb): Scanner {
  // biome-ignore lint/suspicious/noExplicitAny: CannedDb exposes an untyped Kysely
  const kysely = db.kysely as any;
  const tenants: string[] = [];
  let pendingFailure: Error | null = null;

  const scan = ((
    _db: unknown,
    collection: string,
    scanType: 'duplicates' | 'anomalies' | 'missing_data' | 'normalization' | 'full',
    userId: string,
    tenantSchema?: string,
    tenantId = 'tenant-1',
  ): Promise<string> =>
    runQualityScan(
      {
        db: kysely,
        withTenantIsolation: (tenant, fn) => {
          tenants.push(tenant);
          if (pendingFailure) {
            const err = pendingFailure;
            pendingFailure = null;
            return Promise.reject(err);
          }
          return fn(kysely);
        },
        DDLManager,
        services: serviceRegistry,
      },
      { collection, scanType, userId, tenantSchema, tenantId },
    )) as Scanner;

  Object.defineProperty(scan, 'tenants', { get: () => tenants });
  (scan as { failIsolation(err: Error): void }).failIsolation = (err: Error) => {
    pendingFailure = err;
  };
  return scan;
}
