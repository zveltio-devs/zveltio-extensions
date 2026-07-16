-- Seed a published public homepage so a fresh install shows a real public site
-- at `/` (ADR 0001), not the admin login. Idempotent: slug is UNIQUE, and we
-- only seed when no page named `home` exists yet, so an operator who has already
-- authored a homepage is never overwritten.
--
-- Blocks use the live Studio editor's vocabulary (heading/text/button — see
-- studio/pages/+page.svelte `defaults`), so the seeded page is fully editable in
-- the page builder and renders through the same block registry as authored pages.

INSERT INTO zv_pages (tenant_id, title, slug, status, template, blocks, meta, published_at)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Home',
  'home',
  'published',
  'default',
  '[
    {"type":"heading","content":{"level":1,"text":"Welcome"}},
    {"type":"text","content":{"html":"<p>This site is powered by Zveltio — your self-hosted Business OS. This public homepage is fully editable in the admin under <strong>Page Builder</strong>.</p>"}},
    {"type":"button","content":{"label":"Open the admin","href":"/admin","variant":"primary"}}
  ]'::jsonb,
  '{"title":"Welcome","description":"Powered by Zveltio — your self-hosted Business OS."}'::jsonb,
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM zv_pages WHERE slug = 'home');
