-- See finance/invoicing 009: BR-RO-110 / BR-RO-111 require the ISO 3166-2:RO
-- country subdivision for both parties whenever the country is RO.
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS seller_county TEXT;
ALTER TABLE zv_efactura_invoices ADD COLUMN IF NOT EXISTS buyer_county  TEXT;
