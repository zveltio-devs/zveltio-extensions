/**
 * Hono `ContextVariableMap` augmentation for the extensions repo.
 *
 * Hono ≥ v4 types `c.set` / `c.get` against the
 * `ContextVariableMap` interface. Keys that aren't declared resolve
 * to `never`, which is what made every `c.set('user', session.user)`
 * call in extensions raise TS2769 ("Argument of type 'user' is not
 * assignable to parameter of type 'never'"). The engine declares its
 * own map in `packages/engine/src/middleware/tenant.ts` for the
 * `tenant`, `tenantTrx`, `environment` and `tenantSchema` keys;
 * extensions live in a separate tsconfig so they don't see that
 * augmentation. Declaring the keys here gives every extension
 * route handler typed access without each one casting.
 *
 * If a new key shows up across extensions, add it here. Keep the
 * type loose (`any` is fine) — extensions cast in their own code,
 * and the goal is to silence the no-overload errors, not to
 * impose a project-wide shape on what handlers store.
 */

import 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    /** Authenticated user — populated by per-extension auth guards. */
    user: any;
    /** Better-Auth session object when the handler needs the raw session. */
    session: any;
    /** Resolved tenant; mirror of the engine middleware's value. */
    tenant: any;
    /** Tenant-scoped transaction (engine middleware). */
    tenantTrx: any;
    /** Tenant environment (prod/staging/...). */
    environment: any;
    /** Active PostgreSQL schema name for the request. */
    tenantSchema: string;
    /** Auth path: 'session' for cookie/header auth, 'api_key' for API keys. */
    authType: 'session' | 'api_key';
    /** API-key row when authType === 'api_key'. */
    apiKey: any;
    /** Per-request request id used in trace logs. */
    requestId: string;
    /** Distributed-tracing parent id parsed from `traceparent`. */
    traceparent: string;
  }
}
