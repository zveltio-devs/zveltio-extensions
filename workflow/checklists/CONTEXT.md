# Checklists — context

**Verified by pressing: 2026-08-10, on a virgin database.** Template created,
attached to a record, items copied, ticked, list completed, two scoring schemes
configured and scores computed.

## What was broken

**Ticking an item never worked.** `checked_by` and `completed_by` are `uuid`
columns receiving `"user".id` — a 32-character nanoid. Every attempt to tick
returned 400 with a conversion error the route did not name. On every installation
that ever existed, for **the extension's central action**.

Worth remembering how it escaped: **two passes on the same day were looking for
exactly this class** and missed it, because they worked from a hand-written list
of column names, and `checked_by` was not on it. The engine now has a gate that
asks the catalogue — *which `uuid` columns are named `\*_by`?* — instead of a list
someone has to keep complete.

## Configurable scoring

A template carries any number of **schemes**. Weights live on the scheme, not on
the item — that is the whole point: an inspection can be measured simultaneously
for safety and for commercial compliance, and the item that matters enormously to
one can be irrelevant to the other. A zero weight, or its absence, removes the
item from that scheme's denominator.

**Weights bind to the item in the TEMPLATE**, which required
`zv_checklist_items.template_item_id`. An instance's items are copies, and the
only link to the original was the label — scoring by label would have come apart
at the first corrected typo. Silently, and in the direction that flatters the
score.

**The result keeps a snapshot** of what produced it: every weighted item, its
weight, whether it was ticked, the threshold in force. Weights change; last year's
audit must not.

**It recomputes on every change**, not on completion. Completion fires when the
last *required* item is ticked, and the optional ones usually come after — so
computing on the transition froze the score at 5/10 while two later ticks no
longer moved it. Measured live after the repair: 50 → 70 → 100.

## A model limit — read before extending the scoring

**Ticked does not mean compliant.** "The temperature is wrong" and "I did not
check the temperature" look identical: an unticked item. A real inspection needs
three states — compliant, non-compliant, not applicable. For now there are two.

It was not changed because it is a model decision, not a defect. But with the
score on screen the difference becomes visible.

## Still open

**The studio page is dead end to end.** It calls four addresses, all 404: `/`,
`/{id}`, `/{id}/responses`. It has a `responses` state and a `'responses'` view —
it is a copy of the **forms** page, where that shape makes sense. The real API is
`/templates`, `/record/:collection/:id`, `/items/:id`, `/overdue-items`,
`/summary`.

The scheme configuration screen needs **master-detail** (scheme → weights per
item), which the renderer does not have yet. The third thing waiting on it.

## SDUI migration (2026-08-21)

SDUI templates+summary; GET /templates?all=1 embeds items
Branch: `feat/sdui-crud-batch`

## §6 review — 2026-09-13, `reviewed` (engine/)

Two defects, both concurrency/dead-check shaped; the tenant isolation across
all 8 owned tables was already sound (measured fresh, not assumed — see
below). Full detail and the version bump: `docs/private/CAMPAIGN-PROGRESS.md`
section 11.

**`POST /recurrence/trigger` refused every caller, forever.** Gated on
`session.user.role === 'admin'`. `"user".role` is Better-Auth's column,
constrained by `user_role_check CHECK (role = ANY (ARRAY['god','member']))` —
`'admin'` is not a legal value there; that's a `zv_tenant_users.role` value,
a different table. The check could never pass, for anyone, including a real
`god` session. Recurring checklists could never be triggered by anybody, on
any installation, since this route was written. Fixed to the repository's
own idiom for the same gate — `checkPermission(uid, 'admin', '*')`, used the
same way by `analytics/quality`, `developer/validation`, `content/documents`.

**Two concurrent required-item ticks could leave a checklist "in progress"
forever, both items checked.** `PATCH /items/:itemId`'s auto-complete reads
every item on the checklist, decides `allRequiredChecked` in JavaScript, then
writes `completed_at`. Two operators ticking two different required items at
the same moment each read the sibling as still unchecked (their own
transaction predates the other's commit), so both concluded "not complete".
Measured: two required items ticked concurrently, both land `checked = true`,
`completed_at` stays NULL. Same shape as the traceability/invoicing/hr class
this campaign keeps finding — read, decide in JS, write, no lock between the
two. Fixed by locking `zv_checklists` `FOR UPDATE` before the decision, in
both `PATCH /items/:itemId` and `POST /items/bulk-check` (same shape, same
fix). Regression test in `completion-race.test.ts` replicates the race
through the real packed route.

**A harness limitation this extension's tests have to work around, not a
product defect.** `scoreChecklist`'s final write commits through the outer
`db`, not the `trx` it receives — safe in production, where `ctx.db` resolves
the CURRENT tenant transaction via AsyncLocalStorage and `db.transaction()`
JOINS it rather than nesting (confirmed by reading `extension-context.ts` and
its own unit test). But `testing/ext-harness.ts`'s mock `ctx.db` does not do
that ALS join — its `db.transaction()` opens a genuinely separate connection.
Combine that with the `FOR UPDATE` lock above and a checklist that HAS a
scoring scheme, and the test self-deadlocks: one connection holds the lock
the other's FK check on `zv_checklist_scores.checklist_id` needs, and the
lock holder is itself awaiting that FK check to finish. Confirmed via
`pg_stat_activity` (one backend on `Lock/tuple`, the other on
`Lock/transactionid`) and confirmed absent in production's actual
one-transaction-per-request shape by replaying both connections' statements
on a single connection instead — clean, no deadlock, correct final score.
`completion-race.test.ts` avoids the artifact by using a checklist with no
scoring scheme, which is enough to exercise the lock without tripping it.
Not fixed here: it is a property of the shared harness's transaction model,
not of this extension, and no other extension's test currently combines a
`FOR UPDATE` lock with an FK write through the outer `db` inside the same
nested transaction — so nothing else is known to hit it today.

**Migration 002's `RAISE WARNING` text says the opposite of what happens.**
Applied 002 to an upgrade database with one pre-existing (pre-tenancy) row.
It warns the row "is visible to ALL tenants" — measured directly instead of
taken on the warning's word: `zveltio_tenant_scope_ok(NULL::uuid)` returns
NULL, and `NULL = ANY(array)` is never true in SQL, in any GUC state,
including GUC unset (which resolves to the default tenant array `[...0001]`
via `zveltio_visible_tenants()`, not to "show everything"). A legacy row's
`tenant_id IS NULL` never matches that array. So the true effect is the
opposite of the message: the row becomes invisible to EVERY tenant, including
the default one, through the normal `zveltio_rls` path every request uses —
not a security leak, but silent, total data loss from the product's point of
view until someone runs the backfill the warning itself suggests. This is the
engine's `zveltio_tenant_scope_ok` (hardened to fail-closed on unset context
by a later engine migration, per its own `\df+` description — "See 047") and
the identical warning text is copy-pasted into every extension's
`002_tenant_rls.sql` by the same mechanical rollout this file's own header
names — not a checklists-specific defect. **Section 10's postgis write-up
made the same claim ("visible to every tenant until backfilled") without
independently measuring cross-tenant visibility of the NULL row** — worth
revisiting there; this session's direct measurement contradicts it. Logged,
not fixed: the fix (if any) is either engine-side wording, or a repo-wide
extension-side text correction — outside REPAIR NARROWLY's single-extension
scope, and the migration file has already shipped.

**Tenant isolation confirmed on all 8 owned tables**, not just the 5 `002`
covers: `zv_checklists`, `zv_checklist_items`, `zv_checklist_templates`,
`zv_checklist_template_items`, `zv_checklist_recurrence` (all `002`), plus
`zv_checklist_scoring_schemes`, `zv_checklist_scheme_weights`,
`zv_checklist_scores` (`006` — already shipped in `d0d2a52`, predating this
session; re-verified fresh, not assumed). All ENABLE+FORCE. Measured as
`zveltio_rls` with a real two-tenant GUC: cross-tenant SELECT/UPDATE/DELETE
all return 0 rows across every table, a spoofed-tenant INSERT is refused by
`WITH CHECK`, and the positive control (own-tenant read/write) succeeds on
every table — the half that makes the refusals mean something.
