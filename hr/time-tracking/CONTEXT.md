# hr/time-tracking — context

Verified 2026-08-11, on a virgin database: projects, entries, timer, timesheets,
submission, approval, rejection, statistics.

**Note on activation:** the extension requires `finance/invoicing` and correctly
refuses to load without it. That is also a product observation — time tracking
should not have to depend on invoicing; hours can be tracked without being billed.

## The third HR module with the same hole

`hr/employees`, `hr/leave` and this one share the same shape: a single permission
gate on `*` and **no** ownership check at all. Here:

- `employee_id` was **optional** on `POST /entries` and on `POST /timer/start`.
  Left empty it did the right thing; filled in, it recorded hours in anyone's
  name.
- `POST /timesheets/:id/approve` checked absolutely nothing — anyone with access
  to the module could approve any timesheet, including their own.
- Likewise `reject`, which is cheaper to abuse: it requires nothing but an id and
  sends the hours back as disputed.

An approved timesheet is what `POST /entries/invoice` bills. **Approving your own
hours means issuing your own invoice line.**

And an adjacent defect: the insert used `d.employee_id ?? null`, so an entry
without the field belonged to **nobody** — invisible both to the person who worked
the hours and to any per-employee report.

Now: your hours, those of someone you manage, or the administrator. Approval and
rejection explicitly exclude the self case.

Verified in five directions:

1. Mallory logs hours in Ana's name → **403**
2. the admin can → **201**
3. Mallory approves her own timesheet → **403**
4. the admin approves it → **200**
5. an entry with no `employee_id` lands on the caller, not on nobody → zero
   orphan entries in the database

## Duplication to be resolved

The `callerEmployee` / `mayActFor` helpers now exist in **two** extensions —
`hr/leave` and this one — with the same content. A third copy would be the clear
signal that they must move: their place is a service exposed by `hr/employees`
(`ctx.services`, as `identity.nationalId` already is), which would also remove the
direct read of `zvd_employees` from here — another extension's table.

## The user ↔ employee link

As everywhere in the HR family, the lookup went by email even though
`zvd_employees` has `user_id`. The new helper tries `user_id` first. Without it,
anyone whose work email differs from their login email could not even start the
timer.

## Identity and authorisation go through `hr.employment` (2026-08-12)

The duplication flagged here has been resolved: `callerEmployee`/`mayActFor` were
the same twenty lines as in `hr/leave`, both opening `zvd_employees`. They are now
on `hr/employees`'s service; without it, the routes answer 503.

The two identity lookups (timer started, timer stopped) went by email — so anyone
with a different work email could not start the timer at all.

**The decision-route gate had to be taught:** a guard arriving through
`ctx.services` resolves at execution time, across an extension boundary, and a
static reader cannot follow it. The handlers now declare it explicitly:
`// permission: delegated to hr.employment.mayActFor`. That is weaker than seeing
the call — an assertion, not a proof — but it is greppable and it forces the
delegation to be written down rather than inferred.


## SDUI migration (2026-08-21)
Branch: feat/sdui-search-time-docs
Projects + entries tabs. Timer start/stop as row actions (API: task_description).
Tradeoff: no live running-timer banner.
