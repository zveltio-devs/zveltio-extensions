-- County, because ANAF requires it as an ISO 3166-2:RO code.
--
-- BR-RO-110 and BR-RO-111, from the validator: when the country code is RO,
-- the country subdivision (BT-39 for the seller, BT-55 for the buyer) must be
-- present and coded — "RO-B" for Bucharest, "RO-CJ" for Cluj. These were the
-- last two failures after street and city were added; the invoice had no county
-- for either party, so the element could not be emitted at all.
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS seller_county TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS client_county TEXT;

UPDATE zvd_invoices i
   SET seller_county = COALESCE(i.seller_county, p.county)
  FROM zvd_company_profile p
 WHERE p.tenant_id = i.tenant_id AND i.seller_name IS NOT NULL;
