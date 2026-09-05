# hr/leave — context

Verified 2026-08-11, on a virgin database. Day calculation, balances, approval,
rejection, cancellation, carry-over, the calendar and the statistics — all
pressed.

The underlying logic was **correct**. The authorisation was not there at all.

## Anyone with access to the module could consume someone else's leave

A single permission, `leave`, covered everything: `permissionGate(ctx, 'leave')`
on `*` and nothing else. `employee_id` came from the request body and was never
compared against the caller, and approval checked absolutely nothing.

Pressed before the repair, on a live instance: an ordinary user with access to
`leave` filed two days against another employee's balance **and approved them
himself**. Both responses, 200.

Leave is money. Unused days are compensated on termination, so spending someone
else's balance is spending their severance. And self-approval abolishes the only
control that exists here: the manager.

Three access paths now, and the order is the idea: **it is your leave**, **you
manage the person**, or **you administer the instance**.

| action | yourself | manager | admin |
|---|---|---|---|
| filing | yes | yes | yes |
| approval | **no** | yes | yes |
| rejection | **no** | yes | yes |
| cancellation | yes | yes | yes |

Approval and rejection explicitly exclude the "own leave" case rather than
omitting the check — the omission is precisely how this was lost the first time.
Cancellation keeps it, because there you are giving your own days back, which is
legitimate.

Verified in **six** directions, not just the confirming ones:

1. filing for someone else → 403
2. filing for yourself → 201
3. self-approval → 403
4. approval by the admin → 200
5. after becoming a manager, filing for a subordinate → 201
6. and approving it as the manager → 200

Without 2, 4, 5 and 6, a fix that blocked everything would have looked identical.

## The user ↔ employee link went by email

`/requests/my` looked the employee up by `email = user.email`, even though
`zvd_employees` has a `user_id` column. Someone whose work email differs from
their login email saw an empty list and appeared never to have taken leave. The
new helper tries `user_id` first and keeps the email as a fallback.

## What is correct and worth knowing

- Working days exclude weekends **and** public holidays — verified with a holiday
  placed in the middle of the range: 5 days become 4.
- Overlaps are refused.
- Exceeding the balance is refused.
- Approval moves `pending → used`; cancelling an approved request returns `used`,
  not `pending`. Correct.

## Product gaps

- **Zero public holidays at installation.** The mechanism works, but the table is
  empty, so on a new instance every request counts wrongly until someone enters
  the days by hand. They should be supplied by a country extension, on the same
  pattern as `identity.nationalId` from `hr/employees` — the holiday calendar is
  country-specific, the leave module must not be.
- No notifications: not on filing, not on approval, not on rejection.
- No team visibility ("who is away this week" exists as `/calendar`, but is not
  tied to the hierarchy).
- No blackout periods, no leave in advance, no fractions smaller than half a day.

## Identity and authorisation go through `hr.employment` (2026-08-12)

The `callerEmployee`/`mayActOnLeaveOf` helpers existed identically in
`hr/time-tracking` too, both opening `zvd_employees` — another extension's table.
They are now a single implementation, on the service exposed by `hr/employees`.

Everything that **decides** goes through it: who the caller is, who manages whom,
who can act for whom. Without `hr/employees` enabled, the routes answer **503**
rather than crashing.

`/requests/my` looked up by email; `identify()` now tries `user_id` first — anyone
whose work email differs from their login email saw an empty list.

**What remains, deliberately:** the JOINs that put the person's name beside the
request, and a `SELECT id` listing whose balances are being initialised. These are
display reads; routing them through the service would mean N+1 or a method that
re-exposes the table. Marked in the source.
