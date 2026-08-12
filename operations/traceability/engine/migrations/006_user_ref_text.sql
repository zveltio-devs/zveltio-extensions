-- The rest of this extension's user references.
--
-- `scanned_by` takes `params.scannedBy` and `initiated_by` takes
-- `params.initiatedBy`; callers pass `user.id`, which is a 32-character nanoid,
-- and both columns were uuid. Recording a lot consumption and initiating a
-- recall therefore failed with 22P02 — a recall being the operation you least
-- want to discover is broken at the moment you need it.
--
-- 005 converted `resolved_by` on the same table and stopped there, because the
-- sweep behind it worked from a hand-written list of column names and these two
-- were not on it. Asking the catalogue for uuid columns named `*_by` finds them
-- all without anyone having to guess the name first.

ALTER TABLE IF EXISTS trace_lot_consumptions ALTER COLUMN scanned_by TYPE TEXT;
ALTER TABLE IF EXISTS trace_recalls ALTER COLUMN initiated_by TYPE TEXT;
