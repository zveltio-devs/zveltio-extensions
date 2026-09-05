# finance/expenses — context

Verified 2026-08-11, on a virgin database: reports, expenses, mileage, per diem,
submission, approval, rejection, reimbursement, statistics.

## Full reimbursement always failed

`zvd_expense_reports_status_check` accepted `draft, submitted, approved,
rejected, **paid**`. The code writes `**reimbursed**` — as do the 12 places in the
interface, as does `/stats`. Nothing, anywhere, ever writes `paid`.

So full reimbursement — the normal case — answered 500 with
`violates check constraint`. **Partial** reimbursement worked, because there the
status stays `approved`, which explains how this went unnoticed.

And `/stats` had from the start been counting
`COUNT(*) FILTER (WHERE status = 'reimbursed')` — a counter on a state the
constraint made impossible. **It was zero by construction.** After migration 004:
report submitted → approved → fully reimbursed → 201, status `reimbursed`,
counter 1.

## The classic expense fraud was wide open

`approve`, `reject` and `reimburse` checked nothing — a single permission,
`expenses`, and that was all. So **submit, approve, pay** required one permission
and no accomplice. `reimburse` is the route that records money leaving the
company.

Now:

- **your own report is excluded before anything else.** It is not a permissions
  question: nobody approves their own expenses, however senior. It showed during
  testing — the god user had created their own report and got a 403.
- beyond that, a deliberate grant: the `expenses:approve` and
  `expenses:reimburse` actions, with `admin` still sufficient, so an existing
  installation works without anyone editing policies first.

Unlike the HR modules, people here are identified by user id, not by an employee
record — so there is no manager relationship to consult and no dependency on
`hr/employees` to obtain one.

## Everyone's expense reports were visible to everyone

`GET /reports` returned every report on the instance to anyone holding `expenses`.
An expense report is not neutral reading: it is where someone was, when, with
whom, and what they spent it on. The existence of `/reports/my` alongside it
suggests the separation was intended and never enforced.

The list is now limited to your own reports, except for those who can approve.
Verified: with ordinary rights Mallory sees 1 report (hers), the admin sees 3.

**Worth remembering:** because `approve` is an action on the `expenses` resource,
a `*` grant on `expenses` makes someone an approver — and therefore shows them
every report. The test failed exactly that way the first time. On a real
installation wildcards are expanded into explicit rows (engine migration 034), so
it does not happen by accident, but it is worth knowing before someone grants `*`
"to make it work".

## Product gaps

- No spending limits and no policy (per-category ceilings, thresholds above which
  a second approver is required).
- No receipt/invoice attachment on an expense — there is no file field, even
  though the supporting document is mandatory for deduction.
- No automatically fetched exchange rate; `exchange_rate` is entered by hand.
- No link to `finance/accounting`: a reimbursed report produces no accounting
  entry.
