-- City for both parties, because ANAF rejects the invoice without it.
--
-- Verified against ANAF's own validator (webservicesp.anaf.ro, the public
-- endpoint that needs no certificate). The generated XML came back `nok` with,
-- among others:
--
--   BR-08     / BR-RO-081  Seller postal address, address line 1 required
--   BR-10     / BR-RO-082  Buyer postal address, address line 1 required
--   BR-RO-091 / BR-RO-092  Seller city (BT-37) and Buyer city (BT-52) required
--
-- The invoice carried a single free-text address per party and no city at all,
-- so `cac:PostalAddress` could not be built even in principle — the data was
-- not there to build it from. Street and city are separate elements in UBL and
-- guessing where one ends and the other begins in a free-text line is exactly
-- the kind of parsing that works until it does not.
--
-- Snapshotted like the rest of the seller block: what the company was when the
-- document was issued, not what it is now.

ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS seller_city    TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS seller_country TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS client_city    TEXT;

-- Existing rows: fill the seller side from the profile they were issued under.
-- There is one profile per tenant and it is the only source that ever existed,
-- so this is a restatement rather than a guess.
UPDATE zvd_invoices i
   SET seller_city    = COALESCE(i.seller_city, p.city),
       seller_country = COALESCE(i.seller_country, p.country)
  FROM zvd_company_profile p
 WHERE p.tenant_id = i.tenant_id
   AND i.seller_name IS NOT NULL;
