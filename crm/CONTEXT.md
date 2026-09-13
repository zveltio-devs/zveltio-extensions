# CRM — context

**Ownership:** this extension owns `zvd_contacts`, `zvd_organizations`,
`zvd_transactions`, and CRM-only tables. It CREATE-s via migrations and
registers Studio metadata in `adoptCrmCollections` on `register()`. The engine
must not CREATE or adopt them. Briefing API: `GET /ext/crm/briefing` (Studio
home no longer embeds receivables — use `/admin/crm` or a future dashboard slot).

**§6-reviewed 2026-09-13** (engine/ only; Studio side not covered). Two
defects fixed, both input/output-boundary shaped — no tenant-isolation or
auth-bypass finding. Full record in
`docs/private/CAMPAIGN-PROGRESS.md` §12.

## What was broken (2026-08-09 pass, still true)

**A contact could not belong to an organisation.** `zvd_contact_organizations` —
the link table — was queried in two places and **written in zero**. Every contact
appeared without a company, forever. Designed for, never used. Fixed by
migration 004 (added the missing `role`/`is_primary` columns the code already
read) plus `linkContactOrganization` in `routes.ts`, both already shipped
before this session.

It only shows if you look in both directions: a column or table that appears only
in a `SELECT` is the signal.

**`notes` on organisations was accepted and thrown away** — the validator accepted
it, the `INSERT` did not contain it. Zod strips unknown keys silently.

## What this session found and fixed

**Every dynamic route 500'd on a malformed id.** `:contacts/:id`,
`/organizations/:id`, `/transactions/:id` (GET/PATCH/DELETE, 9 routes total)
interpolate the param straight into `WHERE x = $1` against a `uuid` column —
unvalidated, Postgres refuses with `22P02`, a raw 500 not a 404. Same class
already found in `hr/employees` (invisible to the contract harness, which
filters every route whose path contains `:`). Fixed with a `requireUuid(...)`
check at the top of each handler, matching the hr/employees idiom. Regression
test `uuid-param.test.ts`, discriminated live: reverted, repacked, all 9
named cases failed with 500, restored, repacked, green again.

**The published `crm.contacts.create` service accepted `organization_id` and
threw it away.** The service (consumed by `operations/pos` and
`ecommerce/store` to get a canonical contact) wrote it only to the legacy,
unread `zvd_contacts.organization_id` column — every route reads the
organization through `zvd_contact_organizations` instead, the same table the
2026-08-09 fix above wires up for the HTTP routes. A contact created through
the service with an organization would show no organization anywhere the API
surfaces one. Not currently triggered in practice — neither `pos` nor
`ecommerce` passes `organization_id` today — but the service's own type
signature promises it, and a future caller (or `finance/subscriptions`,
listed as a consumer of the shared identity in `index.ts`'s own comment)
would hit it silently. Fixed: the service now inserts the
`zvd_contact_organizations` link the same way `linkContactOrganization` does.
Regression test `contacts-create-service.test.ts`, discriminated live the
same way.

**No test exercised the RBAC gate.** `permissionGate(ctx, 'crm')` gates every
route except `/briefing`; nothing proved it was wired. Added `authz.test.ts`
(401 anon, 403 non-admin on a GET and a POST, 200 admin, 200 on the
`/briefing` exemption). Discriminated by commenting out the gate line,
repacking: the two 403 assertions flipped to 200/201. Restored, repacked,
green.

## Measured, not fixed

**Migration 002's `RAISE WARNING` says the opposite of what happens**, same
class already logged in `workflow/checklists`' section of the campaign
record and directly contradicting `geospatial/postgis`'s write-up. Measured
here independently: built an upgrade database at pre-002 with one legacy
contact row (`tenant_id IS NULL`), applied `002_tenant_rls.sql`, then read
that row back as `zveltio_rls` with tenant A's GUC set — **0 rows**, not "all
tenants" as the warning claims (`zveltio_tenant_scope_ok(NULL)` is `NULL`,
which never satisfies the policy). Same copy-pasted text in every
extension's `002_tenant_rls.sql`; out of this section's single-extension
repair scope, and the file has already shipped everywhere.

**`linkContactOrganization`'s primary-organization swap has a narrow race.**
Two concurrent calls linking the *same* contact to two *different*
organizations, both as primary, both demote-then-insert with no lock between
the two statements. Measured directly with two concurrent transactions: the
partial unique index (`idx_zvd_contact_organizations_one_primary`, migration
004) holds — exactly one organization ends up primary, no data corruption —
but the losing transaction gets a raw, unhandled `23505` unique-violation
500 instead of a clean conflict response, and its write is entirely lost
(no retry). Data-safe, UX-only; same "logged, not fixed" bucket as
`geospatial/postgis`'s `parseInt` gap — a real robustness gap, not a
tenant/security finding, and out of this pass's narrow-repair scope.

## Verified

Virgin database, all six CRM migrations (`zv_crm_review`). Upgrade path
built separately (`zv_crm_upgrade`): CRM's `001_initial.sql` applied alone,
a legacy contact row seeded pre-`tenant_id`, two tenants provisioned, then
`002` through `006` applied live — succeeds, the warning fires as expected
(text notwithstanding), `003`'s widened `(tenant_id, entity_type, name)`
unique key on `zvd_crm_custom_fields` and `004`'s partial unique index both
land on a non-empty table without error.

Two-tenant RLS on all 9 owned tables (`zvd_contacts`, `zvd_organizations`,
`zvd_transactions`, `zvd_crm_pipeline_stages`, `zvd_crm_custom_fields`,
`zvd_crm_activities`, `zvd_crm_email_sequences`, `zvd_crm_lead_scores`,
`zvd_contact_organizations`) confirmed ENABLE+FORCE via `pg_class`, plus a
real two-tenant probe as `zveltio_rls` with the GUC set: cross-tenant
SELECT/UPDATE/DELETE all 0 rows/0 rows affected, a spoofed-tenant INSERT
refused by `WITH CHECK`, and the positive control (own-tenant
read/write/insert/delete) succeeds on both `zvd_contacts` and
`zvd_organizations`.

Raw `sql` touches only this extension's own `zvd_contacts`/
`zvd_organizations`/`zvd_transactions`/`zvd_contact_organizations`, plus
`zvd_relations` (the engine's Studio m2m-relation table, in both `adopt.ts`
and migration 005) — `zvd_relations` is engine-owned but `zvd_`-prefixed, so
it is within the worker-sql gate's blanket `zvd_*` rule the same way every
other extension's Studio-adopt insert is. No `EXTENSION_TABLE_GRANTS` entry
needed, no engine change — merges independently.

`sortCol`/`dir` in `buildListQuery` are allowlist-checked
(`allowed.includes(sort)`) before reaching `sql.raw`, so the one `sql.raw`
site per list route is not user-controlled despite the raw interpolation —
checked, not assumed.

21/21 own tests pass (`bun test crm/engine`: 6 contract + 9 uuid-param + 1
service + 5 authz), `tsc --noEmit` clean, all 9 repo quality gates green
(`check-dep-lockstep`, `check-bundle-sources`, `check-extension-authorization`,
`check-jsonb-cast`, `check-no-nul-bytes`, `check-harness-stubs`,
`check-decision-routes`, `check-bespoke-contracts`,
`check-shared-singleton-hooks`). Full repo suite 770 pass / 2 skip / 0 fail.
Version bumped 1.0.5 → 1.0.6, repacked, bundle matches source.

## Traps

`zvd_crm_custom_fields` is keyed on `(tenant_id, entity_type, name)` — widened.
Two tenants can each have a "Lead source" field.

CUI validation is shared with invoicing through `isValidCui()`. If you change it
in one place, check the other.

`zvd_transactions.payment_status` (migration 006) is a one-time backfill, not
a trigger-kept mirror — new rows only ever get `status`.
`briefing.ts`'s `COALESCE(payment_status, status)` is what makes both old and
new rows count; do not "simplify" it to read `status` alone.
