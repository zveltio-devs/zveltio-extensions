/**
 * The guard between a language model's SQL and the database.
 *
 * Lifted out of `routes/ai-query.ts` unchanged in behaviour, for two reasons
 * that are the same reason:
 *
 *  1. There was a SECOND copy of this problem with no guard at all. The
 *     assistant's `execute_sql` and `text_to_sql` tools
 *     (`lib/zveltio-ai/engine.ts`) ran model-written SQL behind nothing but
 *     "starts with SELECT" and a `SET TRANSACTION READ ONLY` that did not work
 *     — no table allowlist, no `pg_*` block, no `information_schema` block, no
 *     multi-statement check. The text-to-SQL route had all four. Same
 *     extension, same danger, one of the two hardened.
 *
 *  2. This module imports nothing but `kysely`, so it can be tested directly.
 *     `ai-query.ts` pulls in Hono, and importing that from a test in this
 *     repository fails in module resolution before a single assertion runs —
 *     which is a decent explanation for why the surface with the most
 *     security-relevant branching in this extension had no unit test at all.
 *
 * `runReadOnly` moved with it because the two tools need that as much as the
 * validator: both wrapped their query in `ctx.db.transaction()`, which JOINS
 * the request's transaction rather than nesting, so the read-only flag leaked
 * into the rest of the request. See the note on the function.
 */

import { sql } from 'kysely';
import type { Database } from '@zveltio/engine-db';

/**
 * Runs AI-generated SQL with writes refused at the database, then restores the
 * request's transaction to read-write.
 *
 * `SET TRANSACTION READ ONLY` is the last line of defence behind
 * `validateGeneratedSQL` — a regex allowlist should not be the only thing
 * between a model's output and a DELETE. It has to stay.
 *
 * What it cannot do is live in its own transaction. This was
 * `db.transaction().execute(…)`, and the host's `ctx.db` JOINS the request's
 * tenant transaction rather than nesting (Bun SQL has no nested transactions),
 * so the flag applied to the WHOLE request. Everything after it that writes then
 * failed:
 *
 *   ERROR: cannot execute INSERT in a read-only transaction
 *
 * which is what `logQuery` below does — and its `.catch()` swallowed it. Net
 * effect, verified against Postgres 18: query history recorded only the queries
 * that were REFUSED (that log call happens before this point) and never one that
 * ran, `/history` was permanently empty, and `PATCH /:id/save` could never find a
 * row. The abort also meant the request's COMMIT quietly became a ROLLBACK.
 *
 * A savepoint fixes both halves: `SET TRANSACTION` is undone by
 * `ROLLBACK TO SAVEPOINT`, so the read-only window is exactly this statement and
 * the outer transaction is writable again afterwards. The rollback discards no
 * results — the rows are already in JS, and a read changes no state. Confirmed
 * both ways: an INSERT inside the window is still refused, and an INSERT after it
 * commits.
 */
export async function runReadOnly(db: Database, query: string): Promise<{ rows: unknown[] }> {
  await sql.raw('SAVEPOINT zv_ai_ro').execute(db);
  try {
    await sql`SET TRANSACTION READ ONLY`.execute(db);
    const result = await sql.raw(query).execute(db);
    return result as { rows: unknown[] };
  } finally {
    // Unconditional: on success it drops the read-only flag, on failure it also
    // clears the aborted state, and either way the caller gets a usable
    // transaction back. Awaited inside `finally` — a synchronous `finally`
    // around an async call is how a previous audit lost a whole tenant context.
    await sql
      .raw('ROLLBACK TO SAVEPOINT zv_ai_ro')
      .execute(db)
      .catch(() => {
        /* transaction gone entirely; the caller's error is the useful one */
      });
    await sql
      .raw('RELEASE SAVEPOINT zv_ai_ro')
      .execute(db)
      .catch(() => {
        /* released with the rollback, or the transaction is gone */
      });
  }
}

// ── Security validation ──────────────────────────────────────────────────────

/**
 * Validates AI-generated SQL before execution.
 * Blocks:
 *  - any non-SELECT statement
 *  - DML/DDL keywords (INSERT, UPDATE, DELETE, DROP, …)
 *  - system catalog access (pg_*, information_schema, system tables)
 *  - dangerous functions with side effects (pg_sleep, set_config, current_setting, etc.)
 *  - multiple statements (semicolons not inside string literals)
 *  - access to tables the user cannot read
 */
export function validateGeneratedSQL(
  query: string,
  accessibleCollections: any[],
): { safe: boolean; reason?: string } {
  const upper = query.toUpperCase().trim();

  if (!upper.startsWith('SELECT')) {
    return { safe: false, reason: 'Only SELECT queries are allowed' };
  }

  // Block multiple statements — strip string literals first to avoid false positives
  const strippedQuery = query.replace(/'[^']*'/g, "''");
  if (/;/.test(strippedQuery)) {
    return { safe: false, reason: 'Multiple statements are not allowed' };
  }

  // N3: block PL/pgSQL anonymous blocks (DO $$ ... $$) which can execute arbitrary code
  if (/\bDO\s+(\$\$|\$[a-z_]*\$)/i.test(query)) {
    return { safe: false, reason: 'DO blocks (anonymous PL/pgSQL) are not allowed' };
  }

  // Block DML / DDL keywords
  const forbidden = [
    'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE',
    'TRUNCATE', 'GRANT', 'REVOKE', 'COPY', 'EXECUTE', 'CALL',
  ];
  for (const kw of forbidden) {
    if (new RegExp(`\\b${kw}\\b`, 'i').test(query)) {
      return { safe: false, reason: `${kw} statements are not allowed` };
    }
  }

  // Block functions with side effects or information leakage
  const dangerousFunctions = [
    'pg_sleep', 'set_config', 'current_setting', 'pg_cancel_backend',
    'pg_terminate_backend', 'lo_export', 'lo_import', 'copy_to',
    'dblink', 'file_fdw', 'pg_read_file', 'pg_write_file',
    'pg_stat_file', 'pg_ls_dir',
  ];
  for (const fn of dangerousFunctions) {
    if (new RegExp(`\\b${fn}\\s*\\(`, 'i').test(query)) {
      return { safe: false, reason: `Function "${fn}" is not allowed` };
    }
  }

  // Block system catalog access
  if (/\bpg_/i.test(query) || /\binformation_schema\b/i.test(query)) {
    return { safe: false, reason: 'Access to system catalogs is not allowed' };
  }

  // ── Table references: ALLOWLIST ─────────────────────────────────────────────
  //
  // The checks above denylist `zv_*`, `pg_*` and `information_schema`, and had
  // no rule at all for UNPREFIXED tables — which is where Better-Auth keeps
  // `user`, `session`, `account`, `verification` and `twoFactor`, none of them
  // with RLS. Any authenticated user with read on ONE collection could ask, in
  // natural language, for session tokens or password hashes, and the model was
  // free to write the query. The system prompt telling it not to is not an
  // access control.
  //
  // The permitted set already existed — `accessibleCollections`, the caller's
  // own collections — and was applied only to references that happened to start
  // `zvd_`. It applies to every table reference now: anything not on the list is
  // refused because it was never permitted, rather than because someone
  // remembered to forbid it.
  const permitted = new Set(accessibleCollections.map((c: any) => `zvd_${c.name}`.toLowerCase()));
  const cteNames = collectCteNames(query);

  // A table position the scanner cannot read is refused, not skipped. This is
  // the half the previous comment claimed and the code did not do: an
  // unrecognised reference used to be absent from the list below and therefore
  // never compared against anything. See the note on `tableReferences`.
  const unreadable = unresolvedTablePosition(query);
  if (unreadable !== null) {
    return {
      safe: false,
      reason: `Could not read the table reference near "${unreadable}"`,
    };
  }

  for (const ref of tableReferences(query)) {
    if (cteNames.has(ref.table)) continue;
    if (ref.schema !== null && ref.schema !== 'public') {
      return {
        safe: false,
        reason: `Access to "${ref.schema}.${ref.table}" is not allowed`,
      };
    }
    if (!permitted.has(ref.table)) {
      return { safe: false, reason: `No access to table "${ref.table}"` };
    }
  }

  return { safe: true };
}

/**
 * Names bound by `WITH … AS (…)` in this statement — not tables.
 *
 * Unreachable today: the check at the top of `validateGeneratedSQL` refuses any
 * query that does not start with `SELECT`, so a `WITH` never gets this far.
 * Kept because the allowlist below would otherwise refuse a legitimate CTE the
 * moment that restriction is relaxed, and said out loud so nobody reads this as
 * evidence that CTEs work here. They do not.
 */
function collectCteNames(query: string): Set<string> {
  const out = new Set<string>();
  const re = /(?:\bwith\s+(?:recursive\s+)?|,\s*)("?[A-Za-z_][A-Za-z0-9_$]*"?)\s+as\s*\(/gi;
  for (const m of query.matchAll(re)) out.add(m[1]!.replace(/^"|"$/g, '').toLowerCase());
  return out;
}

/**
 * Every identifier in a TABLE position.
 *
 * Keyed off the words that introduce one rather than by parsing SQL.
 *
 * The soundness argument written here was BACKWARDS, and it hid a live bypass
 * of the allowlist directly above. It said: "a reference it fails to recognise
 * is simply not on the permitted list, so the query is refused rather than
 * allowed." That is only true of a reference this function RETURNS. One it
 * fails to recognise is not returned at all, so it is never compared against
 * anything — the loop above iterates what came back, and a table that never
 * came back is not refused, it is unexamined.
 *
 * The gap was the comma-separated FROM list. `FROM a, b` is a join, and the
 * old expression stopped at the first identifier after each `from`/`join`.
 * Measured, with the permitted set { zvd_products }:
 *
 *   SELECT * FROM zvd_products p CROSS JOIN "user" u        refused
 *   SELECT * FROM zvd_products WHERE id IN (SELECT ... )    refused
 *   SELECT u.email FROM zvd_products p, "user" u            ALLOWED   refs=[zvd_products]
 *   SELECT s.token FROM zvd_products p, session s           ALLOWED   refs=[zvd_products]
 *   SELECT * FROM zvd_products, account, verification       ALLOWED   refs=[zvd_products]
 *
 * `user`, `session` and `account` are the Better-Auth tables — no prefix, no
 * RLS, password hashes and live bearer tokens — and they are the exact tables
 * the comment on the allowlist above says this check exists to protect. Any
 * user with read on one collection could ask for them in natural language and
 * the model was free to write the comma form.
 *
 * Now the FROM clause is read as the list it is: each item's leading
 * identifier is a reference, up to the keyword that ends the clause. JOIN
 * still takes a single item, which is what the grammar says.
 *
 * The recognition argument is repaired too rather than only the expression.
 * `unresolvedTablePosition` reports a table position whose shape this scanner
 * does NOT understand, and `validateGeneratedSQL` refuses on it. So the next
 * form nobody thought of costs a refused query instead of a silent hole.
 */

const IDENT_RE = '(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_$]*)';

/** Keywords that end a FROM clause. A comma before one of these ends the list. */
const FROM_TERMINATORS =
  /^(?:where|group|order|having|limit|offset|fetch|window|union|intersect|except|returning|on|using|for|into)$/i;

/** Words that introduce a join and are therefore part of the clause, not the end of it. */
const JOIN_WORDS = /^(?:join|inner|left|right|full|cross|natural|outer|lateral)$/i;

const unquote = (x: string) => x.replace(/^"|"$/g, '').toLowerCase();

/**
 * Split a FROM clause body into its comma-separated items.
 *
 * Top-level commas only: a comma inside `(...)` belongs to a function call or a
 * subquery, not to this list.
 */
function splitTopLevel(clause: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inString = false;
  let start = 0;
  for (let i = 0; i < clause.length; i++) {
    const ch = clause[i];
    if (inString) {
      if (ch === "'") inString = false;
      continue;
    }
    if (ch === "'") inString = true;
    else if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      out.push(clause.slice(start, i));
      start = i + 1;
    }
  }
  out.push(clause.slice(start));
  return out;
}

/**
 * The body of the FROM clause starting at `from`, i.e. everything up to the
 * keyword that ends it. Parentheses are honoured so a subquery's own WHERE does
 * not truncate the outer clause.
 */
function fromClauseBody(query: string, startIndex: number): string {
  let depth = 0;
  let inString = false;
  const tokenRe = /[A-Za-z_][A-Za-z0-9_$]*/y;
  for (let i = startIndex; i < query.length; i++) {
    const ch = query[i];
    if (inString) {
      if (ch === "'") inString = false;
      continue;
    }
    if (ch === "'") { inString = true; continue; }
    if (ch === '(') { depth++; continue; }
    if (ch === ')') {
      if (depth === 0) return query.slice(startIndex, i);
      depth--;
      continue;
    }
    if (depth > 0) continue;
    if (/[A-Za-z_]/.test(ch)) {
      tokenRe.lastIndex = i;
      const m = tokenRe.exec(query);
      if (m) {
        if (FROM_TERMINATORS.test(m[0])) return query.slice(startIndex, i);
        // A join word ends the comma list but not the clause; the JOIN match
        // in the scan below picks its operand up separately.
        if (JOIN_WORDS.test(m[0])) return query.slice(startIndex, i);
        i = tokenRe.lastIndex - 1;
      }
    }
  }
  return query.slice(startIndex);
}

/** The leading `schema.table` of one FROM/JOIN item, or null when it has none. */
function itemReference(item: string): { schema: string | null; table: string } | null {
  const m = new RegExp(`^\\s*(${IDENT_RE})(?:\\s*\\.\\s*(${IDENT_RE}))?`).exec(item);
  if (!m) return null;
  const a = unquote(m[1]!);
  const b = m[2] ? unquote(m[2]) : null;
  return b === null ? { schema: null, table: a } : { schema: a, table: b };
}

/**
 * Is this item a shape the scanner understands?
 *
 * A parenthesised subquery or a bare `(` is fine — its own FROM is scanned on
 * its own. Anything else that yields no leading identifier is a table position
 * this function cannot account for, and the caller refuses on it.
 */
function isUnaccountedItem(item: string): boolean {
  const trimmed = item.trim();
  if (trimmed === '') return false;
  if (trimmed.startsWith('(')) return false;
  return itemReference(trimmed) === null;
}

function tableReferences(query: string): Array<{ schema: string | null; table: string }> {
  const out: Array<{ schema: string | null; table: string }> = [];
  const intro = /\b(from|join)\b/gi;
  for (const m of query.matchAll(intro)) {
    const after = m.index! + m[0].length;
    if (m[1]!.toLowerCase() === 'join') {
      const ref = itemReference(query.slice(after));
      if (ref) out.push(ref);
      continue;
    }
    for (const item of splitTopLevel(fromClauseBody(query, after))) {
      const ref = itemReference(item);
      if (ref) out.push(ref);
    }
  }
  return out;
}

/** A table position the scanner could not read. See the note above. */
function unresolvedTablePosition(query: string): string | null {
  const intro = /\b(from|join)\b/gi;
  for (const m of query.matchAll(intro)) {
    const after = m.index! + m[0].length;
    const items =
      m[1]!.toLowerCase() === 'join'
        ? [query.slice(after).split(/\bjoin\b/i)[0]!]
        : splitTopLevel(fromClauseBody(query, after));
    for (const item of items) {
      if (isUnaccountedItem(item)) return item.trim().slice(0, 60);
    }
  }
  return null;
}

