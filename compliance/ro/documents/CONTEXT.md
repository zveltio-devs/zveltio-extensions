# Document register — context

**Verified by pressing: 2026-08-10.** Document created with a number from the
series, edited twice, history read, a version restored.

## What was broken

**Every tenant except the first received invented numbers.**
`zv_ro_doc_number_sequences` had `PRIMARY KEY (type)` from when there was one row
per type. Migration 002 added `tenant_id` and RLS **and did not touch the
constraint**. The second tenant could not insert its row, `UPDATE` returned zero,
and the route fell through to `CONTRACT-1754800000000` — a timestamp instead of a
register number. The normal path, not an edge case.

**Two swallowed writes were erasing the history.** The snapshot before an edit and
the one before a restore both landed in `.catch(() => {})`. If they failed, the
operation carried on and the previous version disappeared — precisely what the
register exists to preserve.

## Traps

**The edit route is PATCH, not PUT.** That cost one false debugging session.

**Migration 004 was written wrongly the first time:** `SET NOT NULL` before
backfilling. It passed locally because those rows had been written after the
column existed; on a fresh database, 001 seeds and 002 adds the column afterwards,
so there are NULLs. **Any migration setting NOT NULL must backfill first.**

**`003_user_ref_text.sql` repaired ONE column** of the class and left its
siblings — which is why `zv_ro_documents.created_by` was still `uuid` and creating
a document failed on a fresh database. The lesson: repair the class, not the
instance.

## Numbering, as it stands

A single atomic statement: claim the next number, create the sequence on the
tenant's first issue, restart the series in January. **No fallback number** — if
the register cannot give the next number, the document is not created.
