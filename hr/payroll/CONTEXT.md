# hr/payroll — context

Verified 2026-08-11, on a virgin database: periods, generation, approval, payment,
entries, D112, statistics, simulator, overtime, meal vouchers, sick leave,
ReviSal, rates.

The arithmetic is consistent — it matches a hand calculation exactly. What is not
right are the **rules** and **where they live**.

## The statutory rates were compiled into the bundle

`RO_RATES` was an object literal in `routes.ts`, and
`computeRO(input, rates = RO_RATES)` had a parameter **no call site used**. There
was no configuration table, no settings read.

So a legislative change — and they change every year — required a new extension
version, delivered through the registry, on every installation. An accountant who
KNOWS the new rate had nowhere to write it.

They now live in `zvd_payroll_rates` (migration 006), seeded with exactly the same
values, plus `GET`/`PUT /rates`. Verified: the default rates give the same figures
as before (net 2975, employer cost 5312.50 on a gross of 5000), and setting
`cas_employer` to 0 drops the cost to 5112.50 without touching the net — correct,
employer contributions do not affect the net.

**A defect found during verification:** the payslip stored `cas_employer_rate`
from the constant, not from the rate actually used. While the constant was the
only source they coincided; as soon as the rate becomes correctable, the record
says 0.0400 and the amount reflects 0. Caught exactly that way. It now stores what
it used — and that is precisely what makes the table safe **without interval
dating**: a closed period keeps its figures. Verified: a period generated before
the correction stays at 0.0400 / 5312.50 after the rate changed.

## Approval and payment of the payroll checked nothing (found later)

`POST /periods/:id/approve` and `POST /periods/:id/pay` sat behind the single
`payroll` permission — the same one needed to look at a payslip — and asked
nothing else. Approval fixes what the company owes each employee; payment marks
the money as gone.

**Missed on the first pass over the extension.** The routes were pressed as an
administrator and answered 200, which says nothing about who ELSE could press
them. They were found by a detector run across the whole catalogue after the third
extension with the same shape: `permissionGate` present, `checkPermission` absent,
routes that decide something. The detector is now
`scripts/check-decision-routes.ts`.

Verified in four directions: a user with ordinary `payroll` rights gets 403 on
both approval and payment; the administrator gets 200 on both.

## Payroll reads the contract, not another extension's table (step two)

`hr/payroll` ran `SELECT * FROM zvd_employees` in **four** places and took
`salary` off the row. The table belongs to another extension — and that is also
why payroll could not see a contract: it read the projection, not the thing
projected. Part-time hours, suspension and contract amendments were all invisible
here.

It now goes through `hr.employment`, a service exposed by `hr/employees` on
`ctx.services` — the same mechanism as `identity.nationalId`. The module that owns
the data answers questions about it; nobody else opens the table. The service is
deliberately narrow: who gets paid this month, and on what terms.

Three behaviour changes, all measured:

**Overtime follows the contracted hours.** The hourly rate was `salary / 168`, a
fixed number. So for someone on 20 hours a week an overtime hour was worth half —
the less you were contracted for, the cheaper your hour, which is backwards.
Measured: 6000 lei at 40h and 3000 lei at 20h gave 35.71 against 17.86; they now
both give **34.62**, which is correct, because a part-time salary is already
proportional.

**A suspended contract leaves the payroll.** Someone on parental leave is still
employed but receives no salary from the employer. Measured: August generates 1
entry instead of 2, and after their return September generates 2 again.

**What cannot be computed is skipped with a reason, not silently.** An hourly-paid
contract cannot produce a month's gross without the hours actually worked, which
live in `hr/time-tracking`. The response now returns
`skipped: [{employee, reason}]` — a payroll that silently produces fewer payslips
than the company has employees is the kind of thing noticed only when someone is
not paid.

The flat fields on `zvd_employees` remain for now: the service does
`COALESCE(contract, employee)`, so an installation that has not yet created any
contract is paid as before. Dropping the columns is step three, once every
consumer has moved to the contract.

## Three rules that look wrong — to be confirmed with an accountant

They were not modified. Tax law changes annually, my knowledge has a cut-off date,
and a wrong "fix" looks more authoritative than the current state. They are
recorded here, and the mechanism above makes them correctable without a release:

1. **`cas_employer: 0.04` is applied to everyone.** The comment in the code says
   "special conditions", but the rate is used for every employee. Under normal
   working conditions the employer owes no CAS. The employer cost is inflated by
   4% of gross for every ordinary person.
2. **`personal_deduction_base: 500`, flat.** The personal deduction is a scale
   depending on gross pay and dependants, reaching zero above a threshold. Applied
   flat, the tax comes out wrong in both directions.
3. **Meal vouchers are added to the net untaxed.** Measured: 600 lei of vouchers
   raise the net by exactly 600, with no CASS and no tax.

## The statutory exports

**D112** responds, but the XML puts the **employee** in `<Declarant>` (where the
company belongs) and `<CIF></CIF>` is empty. A declaration without a tax code is
rejected.

**ReviSal** puts `position_id` — an internal UUID — in the `FunctieId` column,
where a COR code is expected, and `full_time` in `ContractTip`. Deliberately
deferred by the owner: ReviSal is Romania-specific and has moved to REGES-ONLINE,
so it is an integration discussion, not a payroll feature.

## The structural problem

The extension is called `hr/payroll` and computes **exclusively** Romanian
payroll: `computeRO`, `RO_RATES`, D112, ReviSal. An instance in another country
gets Romanian contributions applied to its salaries.

Under the rule "modules are not country-specific", the correct shape is the one
already used for `identity.nationalId` in `hr/employees`: the module holds the
periods, the entries and the flow, and the country supplies the formula and the
declarations. The rates table is the first step — it makes the variable part data
rather than code — but `computeRO` itself remains Romanian.

## Other observations

- `hr/payroll` reads `zvd_employees` directly, another extension's table.
- `POST /meal-vouchers` expects `quantity`/`face_value`, not `days`/`value_per_day`;
  `POST /sick-leave` expects `days`, not a date range. A 400 on the first attempt
  is probably the shape of the request.
- `generate` correctly refuses a period that is already approved or paid.
