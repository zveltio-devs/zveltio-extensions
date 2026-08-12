-- What Cod fiscal art. 319 alin. (20) asks for and the table could not hold.
--
-- After 005 the document knows who issued it and who receives it. These are
-- the remaining mandatory elements, and each one is a case the current shape
-- silently gets wrong rather than refuses.
--
-- DELIVERY DATE — lit. c)
--
-- The date of supply must appear when it differs from the issue date, and it is
-- the date that determines when VAT becomes chargeable. There was only
-- `issue_date`, so an invoice issued in October for goods delivered in
-- September declared the wrong tax period, with no way to say otherwise.
--
-- TAXABLE BASE PER RATE — lit. h) and i)
--
-- The base has to be broken down per VAT rate. `zvd_invoices` carries a single
-- `tax_rate` in the header while the lines each carry their own, so an invoice
-- mixing 19% and 9% — a restaurant bill, a farm selling produce and services —
-- stored a header rate that contradicted its own lines. `vat_breakdown` holds
-- the grouping computed at issue time: one entry per rate, with its base and
-- its tax. Derived from the lines rather than typed, so it cannot disagree
-- with them.
--
-- SPECIAL REGIMES — lit. l), m), n)
--
-- Reverse charge, VAT on collection, and exemption all require a specific
-- mention printed on the invoice, and exemption additionally requires the legal
-- basis. None could be recorded, so an invoice under any of these regimes was
-- issued looking like an ordinary one — which is the kind of error that is
-- discovered by an inspector rather than by a user.
--
-- EXCHANGE RATE — art. 290
--
-- When the invoice is in a foreign currency the VAT must also be expressed in
-- lei, at the BNR rate of the chargeability date. Storing the rate on the
-- document is what makes that reproducible years later, when today's rate is
-- no longer anywhere to be found.

ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- [{ "rate": 19, "base": 1000.00, "vat": 190.00 }, { "rate": 9, ... }]
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS vat_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS vat_regime TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE zvd_invoices DROP CONSTRAINT IF EXISTS zvd_invoices_vat_regime_check;
ALTER TABLE zvd_invoices ADD CONSTRAINT zvd_invoices_vat_regime_check
  CHECK (vat_regime IN ('standard', 'reverse_charge', 'vat_on_collection', 'exempt', 'non_taxable'));

-- Free text, because the article cited depends on the exemption and the law
-- changes more often than this schema will.
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS vat_exemption_reason TEXT;

-- Rate to RON, and the base in RON, for a foreign-currency invoice.
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS exchange_rate    NUMERIC(18, 6);
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS exchange_date    DATE;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS tax_amount_ron   NUMERIC(14, 2);

-- Backfill the breakdown for invoices already issued, from their own lines, so
-- existing documents report the same figures as new ones instead of an empty
-- array that reads as "no VAT".
UPDATE zvd_invoices i
   SET vat_breakdown = COALESCE(b.breakdown, '[]'::jsonb)
  FROM (
    -- Two steps: sum per (invoice, rate) first, then aggregate those rows into
    -- the array. Doing both at once nests aggregate calls, which Postgres
    -- refuses.
    SELECT g.invoice_id,
           jsonb_agg(
             jsonb_build_object('rate', g.tax_rate, 'base', g.base, 'vat', g.vat)
             ORDER BY g.tax_rate DESC
           ) AS breakdown
      FROM (
        SELECT l.invoice_id,
               l.tax_rate,
               ROUND(SUM(l.quantity * l.unit_price)::numeric, 2) AS base,
               ROUND(SUM(l.quantity * l.unit_price * l.tax_rate / 100)::numeric, 2) AS vat
          FROM zvd_invoice_lines l
         GROUP BY l.invoice_id, l.tax_rate
      ) g
     GROUP BY g.invoice_id
  ) b
 WHERE b.invoice_id = i.id
   AND i.vat_breakdown = '[]'::jsonb;
