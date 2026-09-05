# data/import — context

Verified 2026-08-11, on a virgin database, with a positive control. The routes
pass, the import writes rows, and columns marked `encrypted` reach disk encrypted.

## Why nobody saw that import did not work at all

Import was a core feature before it became an extension, and the engine still has
`routes/import.ts` over the **same table**, `zv_import_logs`. The two migrations
both create it conditionally, with different vocabularies in three places:

| | engine | extension |
|---|---|---|
| file format | `file_format` | `format` |
| failed rows | `error_rows` | `failed_rows` |
| job in progress | `processing` | `running` |

Core migrations run at boot, before any extension. So on **any fresh
installation** the table is the engine's, and the extension's first statement
violates it: `POST /ext/data/import/:collection` answered 500 with
`column "format" does not exist`.

On an old installation it does not show: there the columns accumulated from both
sides over months. And the audit was looking at `/api/import`, which works
perfectly — over the table it created itself, with the names it chose itself. That
route has no caller: Studio and the SDK come in through `/ext/`.

Migration 003 takes the union of both shapes, additively, so it is correct on
either and survives the removal of the engine's copy.

## Why the failure was invisible

After the columns were repaired, the job died at the first `status: 'running'` and
stayed `pending`, `errors: []`, with no line in the log. The error handler wrote
through `ctx.db`, and the job is started **inside** the handler, so it inherits
the request's async context: the recovery write went into an already-committed
transaction, and its own `.catch` threw the error away. A dead import read as a
slow one.

Now: `stderr` first, then the write through its own `withTenantIsolation`.

## The trap worth remembering

`fieldTypeRegistry.deserialize` is **async** and was not awaited, so a Promise
went into the row. It still reached the table, because Bun.SQL resolves a promise
passed as a query parameter — which is why it bothered nobody for years.

It only showed when encryption was added: `maybeEncrypt` received a Promise, took
the `typeof value !== 'string'` exit and returned it untouched, and the column
stayed in cleartext **with the guard in place**. Verifying by reading would have
said "it is repaired". Printing the value said otherwise.

**A missing `await` does not manifest as an error here. It manifests as a guard
that does not apply.**

## What is still open

The engine's `routes/import.ts` (2 routes, zero consumers) and the
`zv_import_logs` type in `schema.ts` need deleting. When that happens, the
duplicate columns in migration 003 can go too.
