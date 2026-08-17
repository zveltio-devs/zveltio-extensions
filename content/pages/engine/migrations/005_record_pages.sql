-- A page that shows ONE record.
--
-- This closes the last gap the parity ledger listed: binding a field outside an
-- item template. `{{first_name}}` worked inside a data block's template, because
-- there "the current record" is obvious — it is the row being drawn. On an
-- ordinary page there was no such notion, so a hero title was always literal
-- text.
--
-- The notion this adds is a page that IS a record's page: `/products/chair`
-- where `products` is a collection and `chair` identifies the row. Elementor
-- calls it a single template; WordPress calls it a permalink. The mechanism is
-- the same one already in the box — the record is resolved through the SAME gate
-- a data block goes through, and the same `{{field}}` substitution that already
-- has tests draws it.
--
--   record_collection  the collection whose rows this page shows
--   record_field       the column the URL segment matches (`slug`, `id`, a code)
--
-- Both NULL is the normal case: an ordinary page, unchanged.

ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS record_collection TEXT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS record_field TEXT;

-- Looking up "is this page a record page" happens on every request for a URL
-- with a second segment, so it is worth an index — partial, because the vast
-- majority of pages are not.
CREATE INDEX IF NOT EXISTS idx_zv_pages_record ON zv_pages (site_id, slug)
  WHERE record_collection IS NOT NULL;

-- DOWN
-- The columns stay. Dropping them would turn every record page back into a page
-- showing literal `{{field}}` text, which is worse than leaving two unused
-- columns behind — the same rule the earlier migrations follow.
DROP INDEX IF EXISTS idx_zv_pages_record;
