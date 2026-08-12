-- What the routes have always written and the table could not hold.
--
-- The handlers and the schema were written against different column names and
-- never reconciled, so the two most basic operations in a stock system —
-- creating a product and creating a warehouse — both ended in a 500. This
-- extension has never been used; a single attempt would have shown it.
--
-- Most of the mismatch is naming, and there the SCHEMA is right: it already has
-- `cost_price`, `sale_price`, `reorder_qty` and `location`, which are perfectly
-- good names, so the code was corrected to use them rather than the table being
-- renamed around it. Renaming columns that may already hold data to match newer
-- code is the wrong direction of fix.
--
-- Two things, though, are genuinely missing rather than misnamed, and dropping
-- them would mean quietly delivering less than the routes promise:
--
-- UNIT COST PER MOVEMENT. The table records `avg_cost_after` — the result —
-- with no record of the cost that produced it. That is enough to display a
-- number and not enough to recompute or audit one, and a stock valuation nobody
-- can recompute is a number people stop trusting the first time it looks odd.
--
-- DESTINATION WAREHOUSE. A transfer is one movement between two places. With a
-- single `warehouse_id` it can only be recorded as two unrelated movements that
-- nothing ties together, so "where did this pallet go" has no answer.

ALTER TABLE zvd_stock_movements ADD COLUMN IF NOT EXISTS unit_cost NUMERIC(14, 4);
ALTER TABLE zvd_stock_movements ADD COLUMN IF NOT EXISTS destination_warehouse_id UUID;

CREATE INDEX IF NOT EXISTS idx_zvd_stock_movements_destination
  ON zvd_stock_movements (destination_warehouse_id)
  WHERE destination_warehouse_id IS NOT NULL;

-- The warehouse form asks for notes and had nowhere to put them, so they were
-- accepted and discarded — the same silent drop found in three other places
-- today.
ALTER TABLE zvd_warehouses ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zveltio_rls') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON zvd_stock_movements TO zveltio_rls;
    GRANT SELECT, INSERT, UPDATE, DELETE ON zvd_warehouses TO zveltio_rls;
  END IF;
END $$;
