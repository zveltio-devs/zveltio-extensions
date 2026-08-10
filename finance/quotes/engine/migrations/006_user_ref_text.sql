-- `rejected_by` is a uuid that would take a nanoid the moment anything wrote it.
--
-- Nothing writes it today, which is why it survived the earlier pass — a column
-- read and never written looks harmless. It is not: the first route that records
-- who rejected a quote would fail with 22P02, and the person adding it would
-- spend the afternoon on a cast error rather than on the feature.
--
-- Converted with the rest of its class so `*_by` columns can be checked with a
-- single question instead of a list of names somebody has to keep complete.

ALTER TABLE IF EXISTS zvd_quote_approvals ALTER COLUMN rejected_by TYPE TEXT;
