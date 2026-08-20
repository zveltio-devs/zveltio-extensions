-- Which rows of a collection a record page will answer for.
--
-- `005_record_pages.sql` made a page the page OF one record: `/team/ana-pop`
-- resolves `ana-pop` in `contacts` and binds the row. What it did not carry was
-- any notion of WHICH rows qualify — so every row of a published collection got
-- an address, including the ones the site was visibly not showing.
--
-- That gap had a shape a live instance made obvious. A homepage listed staff
-- through a data block filtered to `status = active`; the archived contact was
-- correctly absent from the table and still answered at `/team/maria-radu`, and
-- was listed in the sitemap for crawlers to find. Nothing leaked that the site
-- had not published — `public_collections` is still the gate, and it is
-- deny-by-default — but "I filtered the table" reads as a restriction and was
-- not one. A block's filter is presentation: it decides what one block draws,
-- never what the site will answer for.
--
-- So the record page carries its own filter, in the SAME shape a data block
-- uses — `[{ "field": "status", "op": "eq", "value": "active" }]` — compiled by
-- the same engine compiler, checked against the same column list. An author who
-- has written one has written the other. A row that fails it 404s and never
-- reaches the sitemap.
--
-- Empty is the existing behaviour, which is why the default is `[]` and no
-- backfill is needed: a page with no filter answers for every row it did
-- before.

ALTER TABLE zv_pages
  ADD COLUMN IF NOT EXISTS record_filter JSONB NOT NULL DEFAULT '[]'::jsonb;

-- DOWN
-- The column stays. Dropping it would silently widen every record page that has
-- one back to the whole collection — the same reasoning 005 gives for keeping
-- its columns, and here the consequence is a set of addresses coming back to
-- life rather than a cosmetic one.
