-- The address fields ANAF requires and this table could not hold.
--
-- Confirmed against ANAF's public validator: BR-08, BR-10, BR-RO-081,
-- BR-RO-082, BR-RO-091 and BR-RO-092 all failed because neither party had a
-- postal address in the XML. `seller_address` existed as a column and the
-- auto-draft never wrote to it; city and country did not exist at all.
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS seller_city    TEXT;
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS seller_country TEXT DEFAULT 'RO';
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS buyer_city     TEXT;
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS buyer_country  TEXT DEFAULT 'RO';
