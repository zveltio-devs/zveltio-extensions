# Database editor — context

**Verified by pressing: 2026-08-10.** A saved query written and read back.

## What was broken

**Listing saved queries returned 500 to everyone, always.** The read asked for
`config::text AS query` from a table whose column is `query`, and aliased
`created_at` as `updated_at` even though a real `updated_at` exists. The `INSERT`
beside it writes `query` correctly — the two statements disagreed about the same
table.

It took a while because an empty `catch` named the **route**, never the column:
"Failed to list saved queries" sends you looking for a broken function, not a
non-existent column.

## An ownership trap

The extension once wrote to `zv_saved_queries` — the **engine's** table for
collection queries, with a different mental model. Its own table is
`zv_developer_database_snippets`. An extension does not alter the engine's tables.


## SDUI migration (2026-08-21)
Branch: feat/sdui-postgis-graphql-db
Master-detail tables → columns. Tradeoff: no sample row browser (dynamic columns).
