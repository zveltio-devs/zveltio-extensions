# hr/employees — context

Verified 2026-08-11, on a virgin database. The whole lifecycle passes: employee,
department, position, emergency contact, salary, onboarding, performance cycle +
review + closure, termination, history.

The extension **had no integration defects**. It has feature gaps, which is a
different thing — see the final section.

## `reviewed` at the §6 bar — 2026-09-12 (engine/ only; Studio not covered)

Every file under `engine/` read end to end. Two defects, both concurrency- and
input-boundary-shaped rather than authorization-shaped; the RBAC gate, the
tenant isolation, and the migrations were already sound.

### Every dynamic path segment 500'd on a malformed id

`:id`, `:contactId`, `:docId`, `:taskId`, `:cid`, `:cycleId` are all `uuid`
primary keys, interpolated straight into `WHERE x = ${...}`. An unvalidated
segment reaches Postgres as one and raises `22P02` — a raw 500, not a 404 —
on any typo'd or fuzzed path. Measured: `GET /ext/hr/employees/<garbage>`.

**Invisible to the uniform contract harness by construction**: `no
parameterless GET/POST route crashes` explicitly filters out every route
whose path contains `:` (`testing/ext-harness.ts`). Twenty-some routes across
`routes.ts` and `contracts.ts` carried this.

**The first fix attempt was inert, and worth recording as its own trap**: a
single `app.use('*', ...)` middleware reading `c.req.param()` at the top of
each router sees `{}` — Hono only populates params once a route has matched,
and wildcard middleware runs *before* that match. Confirmed with a
three-line standalone Hono probe. The working fix is a `requireUuid(...)`
helper chained on each dynamic route directly (`app.get('/:id', requireUuid('id'), handler)`),
where Hono's param binding is already in scope. Covered by
`engine/uuid-guard.test.ts`, which enumerates every dynamic route in both
files; discriminates (fails with the guard removed, per campaign method).

### Concurrent hires: the loser got a raw 500, not a duplicate

`POST /` derives `employee_number` from `SELECT COUNT(*)`. Two hires in the
same instant read the same count before either commits, build the same
`EMP-00NN`, and the unique key on `(tenant_id, employee_number)` (migration
004) catches the second — but Postgres aborts a transaction on its first
failed statement, so the loser's own request raised the raw `23505` straight
through the handler as a 500. Measured: 5 concurrent `POST /` on a warmed
pool, 1×201 / 4×500 before the fix.

Not the traceability/invoicing shape (nothing was silently double-booked —
the unique key is real protection), but the same family: a value read,
decided on in JavaScript, and committed without serializing against a
concurrent identical decision. Fixed by retrying the **whole transaction**
(not just the `INSERT`, which is already dead once it has thrown once) up to
5 times on exactly that constraint. Covered by
`engine/employee-number-race.test.ts` (5-way concurrent, pool warmed per the
finance/invoicing lesson on this harness's lazy `max: 4` pool); discriminates.

### What was re-verified, not just read

- **RBAC gate exercised both ways**, on both route sets. `contractRoutes` has
  no auth middleware of its own — it relies entirely on the parent
  `app.use('*', ...)` in `index.ts` mounting it before `employeesRoutes`.
  Confirmed 401 unauthenticated, 403 authenticated-without-grant (overriding
  the harness's admin-only `checkPermission` mock, which is not
  resource-aware), 200 with a grant — on `GET /` and
  `GET /employees/:id/contracts`. `engine/authz.test.ts`; discriminates
  (verified by commenting out the gate, repacking, and watching the 403 case
  fail with the guard removed).
- **Two-tenant RLS, measured on all 13 owned tables** — `zvd_departments`,
  `zvd_job_positions`, `zvd_employees`, `zvd_employee_documents`,
  `zvd_employee_emergency_contacts`, `zvd_employee_benefits`,
  `zvd_salary_history`, `zvd_onboarding_tasks`, `zvd_performance_cycles`,
  `zvd_performance_reviews`, `zvd_employment_contracts`,
  `zvd_contract_amendments`, `zvd_contract_suspensions` — as `zveltio_rls`
  with `zveltio.current_tenant` set inside a real transaction. Cross-tenant
  SELECT/UPDATE/DELETE all refused (0 rows), a spoofed-tenant INSERT refused
  by `WITH CHECK`, and the positive control (own-tenant read/write/insert/
  delete) succeeds on `zvd_employees`, `zvd_departments`,
  `zvd_employment_contracts`, `zvd_onboarding_tasks`, and
  `zvd_salary_history` specifically; the remaining 8 confirmed
  ENABLE+FORCE via `pg_class`.
- **Migration 005 (employment contracts), on an upgrade path**: built a
  database at 004, seeded an active employee and a terminated one (with
  `end_date`), applied 005. Auto-adopts one contract per employee — active →
  `indefinite`/`active`, terminated → `fixed_term`/`ended` with the same
  `end_date` — and a second application is a no-op (`INSERT ... ON CONFLICT
  DO NOTHING`, verified: 0 rows the second time).
- **Raw `sql`**: every call touches only this extension's own `zvd_*` tables
  (confirmed against the handoff's namespace-reach inventory, which does not
  list `hr/employees`). No grant needed.
- **The org-chart, national-id, and contract-sync fixes recorded in the
  2026-08-11 section below are still in the code as described** — read fresh,
  not assumed from the prior note.

### Not touched

`avatar_url` on `zvd_employees` is dead — no route reads or writes it, and
Studio's schema does not reference it either. Harmless (no data-integrity
consequence), left alone: removing an unused column is a schema decision for
whoever owns the studio form, not a §6 finding.

## Who disappeared from the org chart

`GET /org-chart` started its recursion from `manager_id IS NULL AND status =
'active'`, and the recursion reaches people **only through their manager**. So an
active employee whose manager had left the company was neither a root (they have a
`manager_id`) nor reachable (their manager is not in the tree) — and **vanished
entirely from the org chart**. Silently: the page simply showed fewer people.

This is not an edge case. It happens on every departure of a manager, to everyone
who reported to them, until somebody notices and reassigns.

Measured: 4 active employees, 3 on the chart.

The root is now "without an **active** manager". Orphans appear at the top level,
which is also the honest rendering — they are precisely the people whose reporting
line needs a decision.

Verified in both directions, because the repair could equally well have flattened
everything: after the fix, 4 out of 4 appear, the orphan at depth 0, and a real
reporting line between two active people stays at depth 1.

The anti-cycle guard (`NOT (e.id = ANY(org.path))`) holds — A→B→A was created
deliberately and the query answers without hanging. But **the API accepts the
cycle**: nothing refuses "you report to your own subordinate". To be repaired
separately.

## The national identifier — validated by the country, not by this module

`national_id` was free text, so `9999999999999` — month 99, day 99 — went straight
in.

**The first repair was wrong in direction**: CNP validation was put directly here,
which made the HR module fit a single country. A Romanian CNP, a British NI number
and a social security number have nothing in common but the column.

Now `hr/employees` asks the service registry — `identity.nationalId` — and applies
whatever it finds. The Romanian implementation lives in
`compliance/ro/documents`, which works with Romanian identifiers anyway. Nothing
registered means no format check: an instance in another country is not scolded by
a rule written for somebody else.

The lookup happens **per request**, so a country extension enabled after HR
applies immediately, with no restart. Verified exactly that way:

| | without the RO extension | with it |
|---|---|---|
| `AB123456C` (British) | **201** | — |
| `9999999999999` | — | **400** |
| a valid CNP | — | **201** |

**A method trap:** the first "valid" CNP used for testing was invented and was
correctly refused. Running only the negative test would have produced a report of
success. The positive control is not a formality.

## The contract is now an entity (2026-08-11)

What tied a person to the company were `hire_date`, `end_date`, `employment_type`
and `salary`, flat on `zvd_employees`. With those, nothing in a personnel file can
be represented: a fixed term extended by an amendment, a move from 4 to 8 hours,
suspension for parental leave and the return, a second contract at the same
company, or simply **what** changed on 1 April and on which signed document.

Three tables — `zvd_employment_contracts`, `zvd_contract_amendments`,
`zvd_contract_suspensions` — and the routes that move them.

**Country-neutral**, as the rule requires: `contract_type` has the two forms that
exist everywhere, working time is in hours per week (not "full time"), and the
ground for termination is a **free code** whose vocabulary a country extension
supplies, as with `identity.nationalId`. An unknown code is accepted — an instance
must not have to wait for an extension in order to end a contract.

**The flat fields remain, synchronised from the active contract.** `hr/payroll`
reads `zvd_employees.salary` on every payroll generation; dropping the columns now
would break payroll silently. The contract is the source of truth, the fields are
the projection for today's consumers. Removing them is step two.

The migration automatically adopts a contract for every existing employee with a
hire date — otherwise an old installation would show zero contracts for people who
have worked there for years.

### Two things caught by pressing, not by reading

**The amendment failed silently.** The insert into the salary history used
`created_by`, but the column is `changed_by` — and it had been wrapped in a
`.catch()` "so it does not block the amendment". Postgres does not let a request
continue after a failed statement, so the `.catch()` contained nothing: it hid the
cause and took down the next two statements with "current transaction is aborted".
**Exactly the trap repaired in the engine that morning, committed by the person
who had just repaired it.** The insert is now unguarded: if it fails, the
amendment fails loudly.

**Someone ending one contract and starting another stayed "departed".**
Termination marks the person `terminated`, which is right when nothing replaces
the contract. But a fixed term ending on the 31st and a new contract from the 1st
are continuous employment — and the synchronisation did not touch `status`.
Measured: new contract active, salary propagated, person `terminated`. That is,
missing from the org chart and from leave, but paid. Only this transition is
restored; `on_leave` is a state somebody chooses.

Verified in 13 directions on a virgin database, including the positive controls:
the refusals (fixed term with no end date, a second active contract, a second
suspension, an amendment on a terminated contract) **and** the recoveries.

## What is missing for this to be a dedicated HR application

The full proposal is in the conversation; briefly, in the order in which they
block:

1. ~~**The contract does not exist as an entity.**~~ **RESOLVED** — see the
   section above. Step two remains: moving consumers off the flat fields onto the
   contract, so those columns can go.
2. **There is no COR code on positions**, and the ReviSal export in `hr/payroll`
   puts `position_id` (a UUID) in the `FunctieId` column and `full_time` in
   `ContractTip`. The file is importable nowhere. **Deliberately deferred by the
   owner**: ReviSal is Romania-specific (and has since moved to REGES-ONLINE), and
   HR must not be country-specific. It is being discussed as a separate
   integration, on the same pattern as `identity.nationalId` above.
3. **Termination has no legal ground** — `reason` is free text appended to
   `notes`, even though the article of the Labour Code determines the notice
   period, the compensation and the right to unemployment benefit.
4. **Occupational medicine and health & safety** are not modelled — only generic
   documents with `expires_at`, with no periodicity and no "who has expired".
5. **There is no self-service** — every route is an administrator's.
6. Missing: offboarding, CIM generation from a template, turnover reporting, and
   uniqueness of the national id per company.

ReviSal is, on top of that, in the wrong extension: it is not a payroll feature,
and `hr/payroll` reads `zvd_employees` directly, another extension's table.
Wherever it ends up, the correct shape is the one above — HR exposes the data, the
country supplies the rule.
