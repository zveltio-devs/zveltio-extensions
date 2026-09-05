# Data quality — context

**Verified by pressing: 2026-08-10, on a virgin database.** A scan run, issues
found, an SLA threshold created and re-created, an SLA check against a scan.

## The score was REMOVED — do not reintroduce it without reading this

There was a score, computed as:

```
(critical*10 + errors*5 + warnings*2 + info*0.5) / records * 100
```

Measured: 4 warnings across 2 records → 400% penalty → **score 0**. The same 4
across 100 records → **92**. The number said more about the size of the collection
than about the quality of the data, and nobody could explain what a 78 meant.

**And it was never written.** The write was detached, slept two seconds waiting
for a scan that had already been handed over, and landed on a closed transaction —
with a `catch` both inside and outside. `zvd_quality_scores` was empty on every
installation that ever existed. That is why the table could be dropped rather than
migrated.

Configurable scoring now lives in `workflow/checklists`, where a person asserts
each fact and configures what the number means.

## What remains, and it is better

An SLA on **counts**: `max_critical_issues`, `max_error_issues`. The check already
read `if (score && …)`, so it had always run on these alone. "Zero critical
issues" is a threshold anyone can defend.

## Traps

**The scan is asynchronous.** `runQualityScan` returns the id immediately and
carries on in its own transaction. Do not try to learn when it finished by
sleeping — that was tried, and it is exactly how the score was lost. If you need
completion, the host has to announce it.

`ON CONFLICT` on the SLA thresholds is `(tenant_id, collection)`, in Kysely's
builder form (`oc.columns([...])`) — not in text. A sweep looking only for
`ON CONFLICT (` in SQL misses it.

## SDUI migration (2026-08-21)

SDUI master-detail scans→issues; New runs POST /scan
Branch: `feat/sdui-crud-batch`
