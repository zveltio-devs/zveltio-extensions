-- Why an asset was disposed of.
--
-- `POST /:id/dispose` accepts a `reason` and assigned it to `disposal_reason`,
-- a column that has never existed — so disposing of an asset answered 500 and
-- the endpoint has never worked. The same statement wrote `disposal_date`,
-- which is spelled `disposed_at` in the table; the route is corrected for that
-- one rather than the column renamed, because `disposed_at` is the name the
-- rest of the module already reads.
--
-- `disposal_reason` gets a column instead, because there is nowhere else for it
-- and an asset register that records a disposal without the reason is missing
-- the part an auditor asks about. Nullable: assets disposed of before this
-- migration have no reason to record, and inventing one would be worse than a
-- blank.

ALTER TABLE zvd_assets ADD COLUMN IF NOT EXISTS disposal_reason TEXT;

-- DOWN
ALTER TABLE zvd_assets DROP COLUMN IF EXISTS disposal_reason;
