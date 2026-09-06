/**
 * The tenant a request belongs to, or a refusal.
 *
 * Three identical copies of this lived in `cms-routes.ts`, `sites.ts` and
 * `editor.ts`, and all three ended `?? DEFAULT_TENANT_ID`. That fallback is not a
 * convenience — it is an unlogged decision to serve one tenant's data to a
 * request that asked for another.
 *
 * ## When the engine actually hands over a null tenant
 *
 * Almost never, which is why this looked harmless. `resolveTenantFromRequest`
 * deliberately falls through to `getDefaultTenant()` for an unknown subdomain, an
 * IP address and `localhost`, precisely so the tenant GUC is always set and RLS
 * stays uniform. Every one of those paths returns a real tenant.
 *
 * One path does not. The explicit header is returned directly:
 *
 *     const headerSlug = headers.get('x-tenant-slug');
 *     if (headerSlug) return getTenantBySlug(headerSlug);   // tenant-manager.ts:750
 *
 * and `getTenantBySlug` filters `.where('status', '=', 'active')`, so it answers
 * null for a slug that does not exist **and for one belonging to a SUSPENDED
 * tenant**. That second case is the one that matters: a company suspended for
 * non-payment or during a security incident keeps sending the same header, and
 * the fallback answered it with the root tenant's content instead of refusing.
 *
 * Measured on the shipped helper:
 *
 *     resolved tenant B        -> tenant-b
 *     tenant could not resolve -> 00000000-0000-0000-0000-000000000001   (root)
 *
 * ## Why throwing, rather than a value that matches nothing
 *
 * A sentinel id would fail closed too, and silently — the request would return an
 * empty page and nobody would learn that a tenant header was wrong. A refusal
 * with a reason is diagnosable, and a request naming an unknown tenant is
 * malformed rather than merely unlucky.
 */

/**
 * A note that travelled with the three copies of this helper, worth keeping:
 * `ctx.db` is already RLS-scoped to the request tenant, so the `tenant_id`
 * predicates the callers write are defence in depth rather than the only guard.
 * That is how the engine wrote them, after an audit found these tables listing
 * every tenant's rows when the filter was absent and RLS had not yet reached
 * them. It is also why the fallback below mattered less than it looks and still
 * had to go: RLS resolves the GUC the middleware set, and a helper that answers
 * "root" for an unresolved tenant makes the predicate agree with it.
 */

/** Thrown when a request cannot be attributed to a tenant. */
export class TenantUnresolved extends Error {
  constructor() {
    super(
      'This request could not be attributed to a tenant. An `x-tenant-slug` naming ' +
        'an unknown or suspended tenant resolves to nothing, and serving the default ' +
        "tenant's content instead would cross a boundary the caller did not ask to cross.",
    );
    this.name = 'TenantUnresolved';
  }
}

/**
 * The request's tenant id, or null when there is none.
 *
 * For the PUBLIC router. A visitor arriving with an unresolvable tenant should be
 * told there is nothing here, not handed a 500 — the request is malformed, and a
 * stack trace is neither useful to them nor safe to render. Every `/cms/*` route
 * already begins by asking for the public site and answering empty when there is
 * none, so returning null here reuses a refusal that is already written and
 * already tested.
 */
// biome-ignore lint/suspicious/noExplicitAny: Hono context
export function tenantIdOrNull(c: any): string | null {
  return (c.get('tenant') as { id?: string } | null | undefined)?.id || null;
}

/**
 * The request's tenant id.
 *
 * Throws, for the ADMIN surfaces. There the caller is an operator with a session,
 * an unresolved tenant means their request named one that does not exist or has
 * been suspended, and silence would be worse than an error they can read.
 *
 * @throws {TenantUnresolved} when the engine could not resolve one.
 */
// biome-ignore lint/suspicious/noExplicitAny: Hono context
export function tenantId(c: any): string {
  const id = (c.get('tenant') as { id?: string } | null | undefined)?.id;
  if (!id) throw new TenantUnresolved();
  return id;
}
