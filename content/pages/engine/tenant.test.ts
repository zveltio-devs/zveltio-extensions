/**
 * An unresolved tenant must not silently become the root tenant.
 *
 * Three identical copies of `tenantId` lived in `cms-routes.ts`, `sites.ts` and
 * `editor.ts`, and each ended `?? DEFAULT_TENANT_ID`.
 *
 * That looked harmless because the engine almost never hands over a null tenant:
 * `resolveTenantFromRequest` deliberately falls through to `getDefaultTenant()`
 * for an unknown subdomain, an IP address and `localhost`, so the tenant GUC is
 * always set and RLS stays uniform.
 *
 * One path does not fall through. The explicit header is returned directly —
 * `if (headerSlug) return getTenantBySlug(headerSlug)` (tenant-manager.ts:750) —
 * and that query filters `.where('status', '=', 'active')`. So an `x-tenant-slug`
 * naming a tenant that does not exist, **or one that has been SUSPENDED**,
 * resolves to null. A company suspended for non-payment or during a security
 * incident keeps sending the same header, and the fallback answered it with the
 * root tenant's content instead of refusing.
 */

import { describe, expect, test } from 'bun:test';
import { tenantId, TenantUnresolved } from './tenant.js';

const ctx = (tenant: unknown) => ({
  get: (k: string) => (k === 'tenant' ? tenant : undefined),
});

describe('tenantId', () => {
  test('returns the resolved tenant — the control', () => {
    // Without this, a helper that always threw would pass the assertions below.
    expect(tenantId(ctx({ id: 'tenant-b' }))).toBe('tenant-b');
  });

  test('refuses rather than naming the root tenant', () => {
    // Both shapes the engine can produce: an explicit null from a header miss,
    // and an absent key on a route the middleware did not run for.
    for (const absent of [null, undefined]) {
      expect(() => tenantId(ctx(absent))).toThrow(TenantUnresolved);
    }
    // The specific value that used to come back.
    for (const absent of [null, undefined]) {
      let returned: string | null = null;
      try {
        returned = tenantId(ctx(absent));
      } catch {
        /* expected */
      }
      expect(returned).not.toBe('00000000-0000-0000-0000-000000000001');
    }
  });

  test('a tenant object without an id is also unresolved', () => {
    // `{}` is truthy, so `?.id ?? DEFAULT` reached the fallback here too.
    expect(() => tenantId(ctx({}))).toThrow(TenantUnresolved);
    expect(() => tenantId(ctx({ id: '' }))).toThrow(TenantUnresolved);
  });

  test('the refusal says why, since it will be read in a log', () => {
    try {
      tenantId(ctx(null));
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as Error).message).toContain('x-tenant-slug');
      expect((e as Error).message).toContain('suspended');
    }
  });
});
