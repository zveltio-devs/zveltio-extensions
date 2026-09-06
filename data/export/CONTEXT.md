# data/export — context

Pressed 2026-08-12: **11/11**, with an RLS rule and a column permission actually
configured. Asserting turned up what reading the code had not.

## The 11 August repair covered one path out of two

`runExportJob` had received both guards. **`GET /:collection` had not.** The
synchronous route — the one Studio uses for "download now" — was left on
`selectAll()`.

Proved side by side, not deduced: for the **same user, in the same session**,
`/api/data/probe_docs` hid `secret_note`, while `/ext/data/export/probe_docs`
delivered it. On top of that, the export returned `search_vector` and
`search_text`, columns the collection does not declare.

The negative control: with the rule deleted, the column reappears in **both**
paths. Without it, "hidden" could equally have been achieved by breaking the
query.

The comment saying "a boundary only one route honours is not a boundary" was
already in the file, twenty lines above, about the other handler.

**The rows could not be demonstrated as a leak.** The route's gate requires
admin, and RLS exempts admins — so there is no user for whom the filter bites and
who can still export. The filter is applied anyway: the reason it is
unobservable is about who can call the route, not about what the route promises,
and the day that gate relaxes is not the day to discover the filter had never been
wired.

## What building the proof cost, and why it matters

Reaching the code under test required: a second user, a member of the tenant via
`POST /api/tenants/:id/members` (writing the Casbin rows by hand does **not**
work — the API turns `member` into `tenant_member` through `casbinRole()`), an RLS
policy with `filter_value_source: "static:alfa"` — a bare `alfa` resolves to
`null` and the policy is **silently skipped** — and a column permission on the
role from `user.role`, not the one from Casbin, because `getColumnAccess` receives
`resolveUserRole(user)`.

Three different conventions for "role", in the same scenario. None of it is wrong,
but it explains why the old note said asserting this "requires an RLS rule and a
hidden column configured first": it is true, and harder than it sounds.

## The hole: export bypassed two rules the rest of the product honours

`ctx.db` and `withTenantIsolation` give the **tenant boundary**: the Postgres
policies apply, another tenant's rows are unreachable. They say nothing about the
two rules an operator writes *inside* a tenant:

- the RLS rules from `/api/rls`, which hide rows from a user;
- column permissions, which hide a field from a role.

Export checked `read` on the collection and then did `selectAll()`. That is, it
delivered exactly the rows a policy was hiding and exactly the columns a role was
not allowed to see — the same data as the data API, one route to the left.

## Why the repair could not be written until now

The engine received both guards on 2026-07-31 (`8c1c10a`), on `/api/export` — a
route with **zero consumers**. It could not be done here: `getColumnAccess` and
`getRlsFilters` lived in `lib/tenancy` and nothing outside the engine could read
them.

**It was not an omission, it was unavailability.** The guards were exposed on
`ctx.internals` (negating ones — they only remove rows and columns, they grant
nothing). That is also why the extension now depends on an unmerged engine
version: the extensions CI clones the engine's master.

## A real behaviour change

When no specific fields are requested, the export moves from `selectAll()` to the
explicit schema+system list, as the engine does. Consequence: `tenant_id` and any
other physical column not declared in the collection no longer come out. It is a
repair in itself, but it changes the shape of the result — worth mentioning at
release.

## The user did not reach the job

`runExportJob` runs after the response, so it has no request from which to learn
who asked for the export — exactly the shape of the `tenantId` trail, resolved the
same way. Without it both guards are meaningless: RLS and column permissions are
both questions about *who*.

## What has to be pressed for this to become "verified"

1. A collection with a column hidden from a role; export as that role; the column
   is absent from the CSV/JSON.
2. An RLS rule hiding rows from a user; export as them; the rows are absent.
3. Positive control: a god user exports and receives everything.

## What is still open

The engine's `routes/export.ts` (1 route, zero consumers) — to be deleted.
