# GDPR — context

**Verified by pressing: 2026-08-09.** A complete erasure run end to end.

## What was broken

**Erasure failed on every installation.** The route deletes a person's rows from
dozens of tables and wrapped them in a transaction — but `ctx.db` resolves the
request's transaction, and Kysely refuses `transaction()` on a transaction. The
reported message was "referential integrity", which named the wrong cause and
sent anyone debugging in the opposite direction.

Repaired in the engine (`createRestrictedDb` joins instead of nesting), not here.

**Nine non-existent columns** — code and schema written separately.

## How it is now

Every optional delete has its own SAVEPOINT, and whatever could not be deleted is
reported in `skipped[]`. **A `try/catch` in JavaScript isolates nothing in
Postgres** — a failed statement aborts the whole transaction, so without a
savepoint the first missing table killed the rest of the erasure.

## Something reported wrongly once

It was claimed that erasure "reports false success". That is not true — the final
`DELETE` is not caught, so it answers 500. The real problem was the message
naming the wrong cause.
