-- Popups, and two more block types.
--
-- A POPUP IS A PAGE. Elementor ships a separate Popup Builder with its own
-- editor, its own template type and its own conditions engine. Here the thing
-- that appears over a page is made of blocks, belongs to a site, and is drawn by
-- the same renderer — so it inherits the whole builder for free: nesting, item
-- templates, per-device styling, and data blocks that still ask who is allowed
-- to see each row.
--
-- That last part is why `kind` on `zv_pages` beats a table of its own. A popup
-- showing "your three most recent invoices" is a data block on a page, and it
-- must go through exactly the authorisation a data block on a page goes through.
-- A parallel table would have been a second place to get that wrong.

ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'page';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'zv_pages_kind_check'
  ) THEN
    ALTER TABLE zv_pages ADD CONSTRAINT zv_pages_kind_check
      CHECK (kind IN ('page', 'popup'));
  END IF;
END
$$;

-- How and when it appears, and where.
--
--   { trigger: 'load' | 'delay' | 'scroll' | 'exit' | 'click',
--     delay_seconds, scroll_percent, selector,
--     frequency: 'always' | 'session' | 'once',
--     position: 'center' | 'top' | 'bottom',
--     width, overlay,
--     targets: [] }            -- page slugs; empty means every page on the site
--
-- JSONB rather than columns: these are presentation settings read as a whole by
-- one component, none of them is ever queried on, and the shape will grow.
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS popup_config JSONB NOT NULL DEFAULT '{}';

-- A popup is not a page anyone navigates to, so it must not be listed, must not
-- appear in the sitemap, and must not be reachable at its own slug. The routes
-- filter on `kind`; this index makes the popup lookup for a page cheap.
CREATE INDEX IF NOT EXISTS idx_zv_pages_kind ON zv_pages (site_id, kind)
  WHERE kind = 'popup';

-- ── Two more block types ────────────────────────────────────────────────────
--
-- `icon` draws one of a curated set. Deliberately NOT an icon library in the
-- Elementor sense: the artifact CSP blocks external hosts, and bundling a
-- thousand glyphs to use six is a cost every visitor pays. The set is the icons
-- the product already ships, named.
--
-- `button` was readable but not offerable — it came from the textarea editor and
-- the builder never listed it, so a page could contain one and no one could add
-- one. It joins the library rather than staying a legacy name.

INSERT INTO zv_page_block_types (name, display_name, description, icon, schema, default_props) VALUES
  ('icon', 'Icon', 'A single icon at any size', 'Star', '{"name": "string", "size": "number", "color": "string", "label": "string"}', '{"name": "star", "size": 32, "label": ""}'),
  ('button', 'Button', 'A link styled as a button', 'MousePointerClick', '{"label": "string", "href": "string", "variant": "string"}', '{"label": "Click here", "href": "/", "variant": "primary"}')
ON CONFLICT (name) DO NOTHING;

-- DOWN
-- The column stays: dropping it would take every popup with it, and a popup is
-- authored work like any other page. Same rule as the tables in 001.
DROP INDEX IF EXISTS idx_zv_pages_kind;
