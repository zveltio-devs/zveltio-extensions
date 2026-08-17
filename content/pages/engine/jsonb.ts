/**
 * Writing a JS value into a `jsonb` column.
 *
 * `JSON.stringify(value)` bound as a parameter does NOT store the value. It
 * stores a JSON **string scalar** containing the text — `jsonb_typeof` says
 * `string`, not `object`. Measured, not assumed:
 *
 *     INSERT ... VALUES (${JSON.stringify(o)})              -> string
 *     INSERT ... VALUES (${JSON.stringify(o)}::jsonb)       -> string   (a no-op)
 *     INSERT ... VALUES (${JSON.stringify(o)}::text::jsonb) -> object   ✓
 *
 * The double cast is what forces the driver to hand Postgres text and then parse
 * it. A single `::jsonb` on a parameter the driver already typed as json does
 * nothing, which is the trap this codebase has hit before.
 *
 * Why it mattered here rather than staying invisible: every reader in this
 * extension does `typeof x === 'string' ? JSON.parse(x) : x`, so a
 * string-scalar column reads back correctly and the defect hides. It only
 * surfaces the moment SQL treats the column as structured — a `->>`, an index,
 * a `||`. That is exactly how it was found: a popup's `targets` were appended
 * with `jsonb ||` and the result was an ARRAY containing the old text, because
 * the old value was text.
 *
 * Blocks, page meta, revisions, SEO issues, menus and popup settings were all
 * being stored this way, inherited from `content/page-builder`.
 */

import { sql } from 'kysely';

/**
 * A value ready to be assigned to a `jsonb` column.
 *
 * Use everywhere a JSONB column is written. Readers still tolerate both shapes,
 * because rows written before this exists are still text — see migration 004,
 * which normalises them.
 */
// biome-ignore lint/suspicious/noExplicitAny: any JSON-serialisable value
export function jsonb(value: any) {
  return sql`${JSON.stringify(value ?? null)}::text::jsonb`;
}
