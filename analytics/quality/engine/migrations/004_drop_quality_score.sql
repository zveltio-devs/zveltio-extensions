-- The quality score is gone, and the table it was never written to goes with it.
--
-- The score came from a formula nobody chose:
--
--   (critical*10 + error*5 + warning*2 + info*0.5) / records * 100
--
-- Measured on a live instance: 4 warnings over 2 records deducted 400% and
-- scored 0, while the same 4 warnings over 100 records scored 92. The number
-- said more about how large a collection was than about how good its data were,
-- and nobody could say what a 78 meant — which is the test a score has to pass.
--
-- Dropping the table rather than keeping it is safe for one specific reason:
-- `zvd_quality_scores` is empty on every installation that has ever existed. The
-- write was launched detached, slept two seconds waiting for a scan that had
-- already been handed off, and landed on a request transaction that had closed
-- meanwhile — with a catch inside and a catch outside, so nothing ever surfaced.
-- No score has ever been stored, so no history is being discarded here.
--
-- `min_score` on the SLA targets goes for the same reason: a threshold against a
-- number that does not exist. What is left there — `max_critical_issues` and
-- `max_error_issues` — is what the SLA check has actually been enforcing all
-- along, because the score half was guarded by `if (score && …)` and the score
-- was never there. The feature loses nothing it was doing and gains a promise it
-- can keep.
--
-- Scoring is worth having when someone configures what it means: weights per
-- item, several schemes over the same list, each stored with the scheme that
-- produced it so past results do not move when the weights do. That belongs to a
-- checklist, where a human asserts each fact, and not to a heuristic scan.

DROP TABLE IF EXISTS zvd_quality_scores;

ALTER TABLE zvd_quality_sla_targets DROP COLUMN IF EXISTS min_score;
