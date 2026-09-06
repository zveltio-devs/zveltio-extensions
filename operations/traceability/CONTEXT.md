# Context

**Status 2026-09-06: `reviewed` for `engine/`.** Every file under `engine/` read
end to end, the tenant boundary demonstrated on two tenants with a positive
control, all six migrations applied to a virgin database. `studio/` is not
covered.

---

# Section 5 of the review campaign — 2026-09-06

Six defects. Five of them are one shape, and the shape is the one this extension
exists to prevent.

## The shape: read, check in JavaScript, write an absolute value

`consumeFromLot`, `POST /dispatches/:id/confirm`, `POST /dispatches` and
`PATCH /production/:id/complete` all did the same thing — `SELECT` the current
state, compare it in JavaScript, then `UPDATE ... WHERE id = $1` with no
condition carrying the check.

Two operators scanning the same pallet at the same moment is not an edge case
here. It is what the floor scanner PWA exists for. Measured on Postgres 18, a lot
holding 10 kg and two concurrent consumptions of 6 kg:

```
operator A: ACCEPTED, wrote quantity_remaining = 4
operator B: ACCEPTED, wrote quantity_remaining = 4
lot now says      : 4.000 kg, status available
movements recorded: 2, totalling -12.000 kg
physically taken  : 12 kg from a lot that held 10
```

In a traceability register that is not bookkeeping. `quantity_remaining` is what
a recall reads to decide how much of a lot is still on site, so an over-draw
tells a recall there is stock to quarantine that has already gone into product —
and the movement rows, which are the audit trail an inspection asks for, sum to
more than the lot ever held.

**Being inside a transaction did not help.** Both dispatch routes were already
wrapped, and their UPDATE matched on `id` alone, so a writer blocked on the row
lock re-evaluated a condition that was still true and wrote a remainder computed
before the other write landed. Atomicity was never the missing part; the check
had no isolation.

## And all of them overwrote a recall

Each wrote `status = newQty === 0 ? 'exhausted' : 'available'` from a status read
earlier, so a recall committed in between was silently undone:

```
operator reads status = available, 10 kg -> proceeds
RECALL marks the lot 'recalled'
operator writes quantity_remaining = 7, status = 'available'
lot ends as: 7.000 kg, status 'available'
```

A recalled lot back on the floor because someone scanned it. On the dispatch
routes it is worse: the lot is not only available again, it has been sent to a
customer.

**The losing write is the safety one.** That is what makes this shape worth
naming rather than just fixing: in every instance, the write that gets discarded
is the one that was protecting somebody.

## The fix, and the pattern that was already there

One `claimLotQuantity`, shared. A single conditional UPDATE decides whether the
lot exists, whether it is available, whether there is enough, and the new
remainder. The row is locked by the UPDATE itself, and under READ COMMITTED a
blocked writer re-evaluates the WHERE against the committed row. `status` moves
to `exhausted` only when the remainder reaches zero and is otherwise left exactly
as it is.

`PATCH /production/:id/start`, two handlers above `complete`, already did it
correctly — `WHERE id = … AND status = 'draft' RETURNING *`, refuse on zero rows.
**Fourth time in this campaign a correct pattern sat a few lines from its broken
twin**, and a variant worth noting: not two copies of a function, but the right
and wrong shapes side by side in one file.

## A recalled lot could be set back to available on purpose

`PATCH /lots/:id/status` took any status and wrote it unconditionally. So
everything hardened above was undone by a generic endpoint: one request, no
movement row, nothing but an optional `notes`.

Refused now — in the WHERE clause, not an `if` — for the single transition
`recalled` → `available`. `recalled` → `returned` stays allowed, because sending
recalled product back to the supplier is real work and blocking it strands the
stock. Deliberately the narrowest rule that covers the dangerous case rather than
a state machine invented during a review; the way back to `available` is to
resolve the recall, which records who decided and why.

## The GS1 parser mis-read every label

`parseGS1Barcode` reads a supplier's barcode at reception. `supplier_lot_ref` is
what ties a recall back to the supplier's own batch; `best_before_date` decides
what gets sold. The operator sees both as a pre-filled form.

It stripped FNC1 — the only delimiter a variable-length element has — and then
searched for each AI with a bare `match`, which finds `"10"` wherever those two
digits fall, including across the boundary between AI `01` and the GTIN behind
it. Measured against six labels a supplier actually prints, **all six were
mis-parsed**, including the simplest:

```
01 05412345000013 | 10 LOT42 | 17 251231
  supplier_lot_ref -> "541234500001310LOT42"    wanted "LOT42"

01 05412345000013 | 17 251200 | 10 LOT9        (day 00 = end of month)
  best_before_date -> "2025-12-00"              a date no column accepts

01 05412345000013 | 10 A17251299 | 17 260101
  best_before_date -> "2025-12-99"              read out of the LOT text
```

Rewritten to read the payload as the standard defines it: left to right, one
element at a time, predefined-length AIs consuming a fixed count and everything
else running to the next FNC1. An unknown AI stops at a separator rather than
guessing a width — losing a tail beats attributing it to the wrong field on a
food-safety record.

**One defect in the new code, caught by its tests rather than by reading:** the
four-digit measure family is 31nn–36nn, not 30nn. Written as `3[0-6]`, AI `30`
(variable count) was read as `3014` and `30144` gave a quantity of 4.

## Smaller

- **`GET /lots` counted two of five filters.** The list filters on status, item,
  supplier and an expiry range; the count query applied the first two. Filtering
  by supplier or expiry gave a total larger than the rows, and a UI paginating on
  it offers pages that come back empty.
- **The report date parameters were unchecked.** `from`/`to` reach a `date`
  comparison — so a non-date is a 500, an ANSVSA register answering "server
  error" because somebody typed a month name — and are interpolated into
  `Content-Disposition: filename="…-${from}-${to}.csv"`, where a quote breaks out
  of the quoted value. Validated as ISO dates now, with the round trip through
  `Date` that `2026-02-31` needs.
- **`initiateRecall` made two writes without saying so.** Split, the halves fail
  in opposite directions: lots frozen with no record of who decided and why, or a
  recall the register calls active while every affected lot is still `available`.
  The engine's `check:atomic-writes` cannot see it — it reads route handlers and
  this is a service the handler calls, which its own note names as the
  undercounted class.
- **`consumeFromLot`'s three writes, likewise** — and that one the gate DID find,
  after the refactor put a top-level function above the class. It attributed the
  writes to `claimLotQuantity` and pointed at the right three statements.

## Deliberately NOT changed

- **`Math.random()` in `generateLotNumber` / `generateOrderNumber`.** A lot number
  is a business identifier, not a secret, so predictability does not matter;
  collisions do, and 5–6 base-36 characters behind a date prefix is thin for a
  high-volume plant. What happens on a collision is a unique-constraint failure —
  visible, not silent — so this is a robustness question rather than a defect, and
  changing the format of a printed lot number is an operational decision.
- **Read exposure inside a tenant.** Any authenticated member can read every lot,
  movement and recall. That is stated in `routes/index.ts` as a deliberate
  asymmetry — reads open, writes behind `traceability`/`write` — and closing it
  needs a per-collection permission model rather than a blanket deny an operator
  will switch off.
- **`traceUpstream` marks a shared input `circular`.** The `visited` set is shared
  across concurrently expanded branches, so an input consumed by two production
  orders is expanded in one branch and flagged `circular: true` in the other —
  and which one is nondeterministic. It is not circular, it is shared, and on a
  genealogy report that word is a lie. Fixing it means deciding whether a shared
  input should be expanded twice or referenced, which is a product question about
  what an inspection wants to see.
- **The nine `::jsonb` sites elsewhere in the repo.** This extension's are already
  `::text::jsonb`, from the earlier HACCP repair.

## What was verified, and how

- **All six migrations on a virgin database.** All eleven `trace_*` tables carry
  `relrowsecurity`, `relforcerowsecurity` and exactly one policy.
- **The tenant boundary, as `zveltio_rls`** (NOSUPERUSER, NOBYPASSRLS) with the
  GUC set — not as superuser, which has BYPASSRLS implicitly:

  ```
  scoped to tenant A       READ: 1 of 2 lots visible
  RECALL tenant B's lot -> 0 rows
  DELETE tenant B's lot -> 0 rows
  INSERT into tenant B  -> new row violates row-level security policy
  control, own tenant   -> UPDATE 1, INSERT 1, DELETE 1
  ```

- **Ten concurrency tests and eighteen GS1 tests**, checked the way this campaign
  requires. Restoring the old `consumeFromLot` turns three of the concurrency
  tests red; restoring the old parser turns fifteen of the eighteen red.
  The recall test forces its ordering with a row lock rather than a sleep,
  because the first version slept and hoped and passed against the defect it
  names.
- **The concurrency tests use the ENGINE's own `createRestrictedDb`**, because
  `consumeFromLot` calls `this.db.transaction()` and in production that is a proxy
  that JOINS the request transaction. A raw Kysely transaction refuses outright,
  so handing the service one would have tested something the product never does.
- **712 pass / 2 skip / 0 fail** from scratch; eight extension gates green; the
  engine's `check:atomic-writes` at 32 with no `--update` and `catch:fabricated`
  at 0.

---


## SDUI fidelity (2026-08-21)
List + ops tabs on `schemas/traceability.json`. Lot genealogy/timeline/labels
and production consume/HACCP on `lot-detail.json` / `production-detail.json`
(`layout: detail`). GS1 lookup on lot create. Reports suite as tabs + CSV.
Recall initiate uses form `preview` (simulate KPIs → confirm). Report tabs use
`filters.type: dateRange` (ANSVSA requires from/to). Lot detail QR tab via
`panels.kind: image` → `/labels/{id}/qr-dataurl`.
Lot detail QR tab via `layout.detail` panel `kind: image`.

## Floor scanner PWA
Served at `/ext/operations/traceability/app/` (HTML + vendored html5-qrcode,
webmanifest). Linked from Studio via `pageActions` → Open floor scanner.
Unauthenticated → `/admin/login?redirect=/admin/traceability` (core stays pure;
re-open scanner from the Studio button after login).

