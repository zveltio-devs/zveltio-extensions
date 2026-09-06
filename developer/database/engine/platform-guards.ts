/**
 * What this extension must refuse to touch, whoever is asking.
 *
 * A separate module with no SDK or Hono imports, for two reasons. It is the only
 * way the test can exercise the shipped predicates rather than a copy — importing
 * `routes.ts` pulls `@zveltio/sdk/extension`, whose type resolution reaches into
 * the engine checkout and does not resolve from here. And it puts the whole
 * boundary in one readable place instead of spread across four handlers.
 *
 * Every route in this extension sits behind `requireInstanceAdmin`, so none of
 * this is about authentication. It is about the difference between authorised and
 * bounded: the routes issue DDL through `sql.raw` with no restriction on WHICH
 * object, and several of them reach the machinery multi-tenancy rests on.
 */

/**
 * Is this a table the platform's tenant boundary rests on?
 *
 * `zvd_*` are the collection tables holding every tenant's records; `zv_*` are
 * the engine's own — sessions, API keys, tenants, Casbin policies. Row level
 * security on them is not a preference an administrator tunes, it is what keeps
 * one company's data away from another's on a shared instance.
 *
 * Matched by prefix rather than by listing names, so a table added next year is
 * covered the day it lands. The unprefixed Better-Auth tables are named
 * explicitly because they have no prefix to match, and they are where the
 * sessions and the password hashes live — the exact set the extension table
 * sandbox was once shaped to miss.
 */
export function isPlatformTable(table: string): boolean {
  const t = table.toLowerCase();
  if (t.startsWith('zvd_') || t.startsWith('zv_')) return true;
  return ['user', 'session', 'account', 'verification', 'twofactor', 'passkey', 'jwks'].includes(t);
}

/**
 * Roles `DELETE /roles/:name` must not drop.
 *
 * The original list held `postgres` and the `pg_*` roles and stopped there — a
 * denylist over an open namespace, naming Postgres's roles and missing Zveltio's
 * own. `zveltio_rls` (engine migration 030) is the role tenant isolation is
 * enforced as and `zveltio_worker` (043) is what the extension SQL bridge drops
 * to; dropping either takes the boundary with it. Prefix-matched for the same
 * reason as above.
 */
export function isProtectedRole(name: string): boolean {
  const PROTECTED = ['postgres', 'pg_monitor', 'pg_read_all_settings'];
  return (
    PROTECTED.includes(name) || name.startsWith('pg_') || name.toLowerCase().startsWith('zveltio_')
  );
}

/** The engine names every isolation policy `tenant_isolation_<table>`. */
export function isIsolationPolicy(policy: string): boolean {
  return /^tenant_isolation_/i.test(policy);
}

/** One wording for every refusal, so the reason reads the same wherever it lands. */
export function rlsRefusal(table: string, action: string): string {
  return (
    `Refusing to ${action} "${table}": it is a Zveltio platform table, and row ` +
    `level security on it is what isolates one tenant from another. This is not a ` +
    `database-administration setting — turning it off exposes every tenant's rows ` +
    `on that table to every other tenant on this instance.`
  );
}
