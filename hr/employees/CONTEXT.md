# hr/employees — context

Verified 2026-08-11, on a virgin database. The whole lifecycle passes: employee,
department, position, emergency contact, salary, onboarding, performance cycle +
review + closure, termination, history.

The extension **had no integration defects**. It has feature gaps, which is a
different thing — see the final section.

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
