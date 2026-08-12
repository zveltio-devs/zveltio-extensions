-- The walk-in customer's name, and a note on the order.
--
-- The till screen collects both and neither had anywhere to go, so every order
-- carrying them failed. A named customer who is not in the CRM is the ordinary
-- case at a counter, not an edge case: somebody wants their name on the
-- receipt and will never be a contact record.
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS notes TEXT;
