# Handoff — merge `content/portals` and `content/page-builder` into one extension

Written 2026-08-16, immediately after `content/portals` was extracted from the
engine. This is the next piece of work on it, and it is a deliberate,
self-contained project — not a follow-up commit.

## The decision that produced this

Zveltio's positioning was settled in the same session: **a headless CMS that
becomes a self-hosted SaaS through its extensions.** The engine keeps
collections, auth, multi-tenancy, permissions, the data API, automation,
realtime, storage and the admin Studio — and no presentation layer of its own.
Anything that decides how data is *shown to an audience* is an extension.

`content/portals` (zones + views) left the engine under that rule. It was the
last presentation layer inside the platform; the public web surface
(`content/page-builder`) had been an extension all along.

The owner's architectural rule, stated plainly and worth keeping in front of
you:

> Everything belonging to an extension lives in the extension, not in the
> engine. If we are forced to keep part of the code in the extension and part in
> the engine, better to drop the extension and move everything into the engine.
> There must be one source of truth.

## Why these two should be one

They are two halves of the same product. Neither is a superset of the other.

| | `content/page-builder` | `content/portals` |
|---|---|---|
| a page is made of | blocks: hero, richtext, image, columns, cta, embed, spacer, **collection_list** | **only views** — a zone page cannot hold a paragraph of text |
| live collection data | **yes** — `collection_list`, with limit/sort/filters/fields | yes — views, plus card and calendar renderings |
| access control | none; public by design | **yes** — `access_roles` on the zone, `allowed_roles` on the page |
| own branding | no | **yes** — name, logo, colours, custom CSS, nav position, breadcrumbs |
| several sites | no | **yes** — `base_path` per zone (`/clients`, `/partners`) |
| SEO, sitemap, redirects | **yes** | no |
| revisions, A/B, metrics | **yes** | no |

**The only genuine overlap is one block type.** `collection_list` in the CMS and
a view in portals are the same idea: show rows of a collection, filtered and
sorted. Views add card and calendar renderings; `collection_list` renders a list.

Everything else is complementary. Each has exactly what the other lacks.

## The shape to aim for

One extension — the owner's preferred name is **`pages`** — where:

- a **page** is made of **blocks**; a block is content (hero, richtext, image…)
  **or** data (`collection_list`, with `view_type` for list/card/calendar)
- pages are grouped into **sites**; a site has a `base_path`, navigation,
  branding, and access rules
- a public site gets SEO, sitemap, redirects; an authenticated one gets roles
- **views disappear as a concept.** A saved view becomes a `collection_list`
  block with a `view_type`. Three overlapping notions — CMS pages, zone pages,
  views — become one.

That is also the strongest possible reading of "headless CMS": one page model
that serves both a public site and an authenticated portal.

Name: `pages` was the owner's proposal and it is a good one. `content/pages` fits
the existing category scheme (`content/page-builder`, `content/media`,
`content/documents`). Say so if you disagree — the owner asked for alternatives.

## What is where, right now

**`content/portals`** (this extension, freshly extracted)
- `engine/routes.ts` — ~1000 lines, zones + views. Was
  `packages/engine/src/routes/zones.ts`.
- `engine/migrations/001_initial.sql` — adopts `zvd_zones`, `zvd_pages`,
  `zvd_views`, `zvd_page_views` with `CREATE TABLE ... IF NOT EXISTS`, then
  applies the tenant default and RLS.
- `studio/pages/` — the zones admin page and `[slug]`.
- `studio/src/components/` — `ListView`, `CardView`, `CalendarView`.
- Mounted at `/ext/content/portals/zones` and `/ext/content/portals/views`.

**`content/page-builder`**
- 9 tables, all `zv_page*`: `zv_pages`, `zv_page_block_types`, `zv_page_menus`,
  `zv_page_redirects`, `zv_page_revisions`, `zv_page_seo_scores`,
  `zv_page_sitemap_config`, `zv_page_ab_variants`, `zv_page_metrics`.
- `engine/cms-routes.ts` — the public render path, including `hydrateBlock`
  for `collection_list`.
- `engine/routes.ts` — the admin/editor path.

**Note the table prefixes.** Portals uses `zvd_*` (it predates the convention
split), page-builder uses `zv_*`. Two page tables exist: `zvd_pages` (zone pages)
and `zv_pages` (CMS pages). They share nothing. Deciding the merged model's table
names is part of the job, and whichever way it goes, one set has to be migrated
into the other with the data intact.

## Traps that will cost you a day each

**`zvd_page_views` is a foreign key, not a join table you can drop.** A zone page
IS its views. If views become blocks, every `zvd_page_views` row becomes a block
row, and `title_override`, `col_span`, `sort_order` and `config_override` have to
land somewhere in the block model. Do not lose them — `col_span` is the layout.

**Do not edit the engine's applied migrations.** `zvd_zones/pages/views` are
still created by the engine's `001_initial.sql`, and `007_default_tenant` and
`017_zones_views_tenant_isolation` ALTER them unguarded. Removing the CREATEs
breaks a fresh install and prints a checksum warning forever on existing ones.
The tables are adopted by this extension; the engine's copy of the DDL is
residue to clear at the next baseline squash, not something to fix now.

**Migrations must adopt, never recreate.** Existing installs have zones, pages
and views with customer data. `CREATE TABLE ... IF NOT EXISTS` plus additive
`ALTER`s. Anything that drops and rebuilds destroys a customer's portal.

**The DOWN half runs on `purgeData=true`.** Portals' DOWN deliberately does not
drop the tables. Keep that: uninstalling the extension that presents portals is
not a statement that the portals should be destroyed.

**`ctx.internals` is the channel for engine helpers.** Portals uses
`checkAccess`, `applyColumnAccess`, `buildCondition`, `getRlsFilters`,
`applyRlsFilters`, `getColumnAccess`, `resolveUserRole`, `getUserRoles`,
`isTenantAdmin`. Never reimplement an authorisation rule in the extension: a
second copy of the auth path is the shape that produced four separate defects in
this codebase. If something is missing from `internals`, add it there.

**An extension does not answer its bare prefix.** `/ext/crm` is a 404 while
`/ext/crm/contacts` is a 200. Mount under named resources.

**Two module-level helpers in `portals/engine/routes.ts` need the internals
binding.** `requireAdmin` and the role check are module-scope (they were plain
imports in the engine) and go through a `_engine` binding set in `zonesRoutes`.
If you restructure, keep that or make them closures.

**`ZVELTIO_EXTENSIONS` decides what loads.** The engine loads the names in that
env var, not whatever is on disk. An extension you rename or add will silently
not load until the list is updated — it cost time in this session.

**Register the extension in three places**, or it will not load:
`packages/engine/src/lib/extensions/extension-catalog.ts` (absence ⇒ treated as
untrusted community tier ⇒ refused), `register.ts`'s allowed-tables map for the
worker SQL policy, and `ZVELTIO_EXTENSIONS`.

## The gates that will judge the work

Run them; they are fast and they have each caught something real today.

```
bun run typecheck            # in both repos
bun run sql:backticks        # a backtick in an SQL comment ends the template
bun run catch:fabricated     # a .catch that invents a successful answer
bun run ext:seam             # every INSERT/UPDATE against the real schema
bun run ext:raw-sql
cd packages/engine && bun test src/tests/unit
```

`ext:seam` builds the engine schema plus every extension's migrations into a
template database and checks each statement against `information_schema`. It
found nine dead write paths today. It will check the merged extension's
statements for free — trust it, and read what it says.

## How to verify, and how not to

Verify by running, never by reading the diff. Boot a real engine on a scratch
database, exercise the path over HTTP, then **read the row back out of PostgreSQL
in a separate query** — `RETURNING *` echoes what you sent and will agree with
you even when the column was dropped.

```bash
export PGPASSWORD=postgres
psql -h localhost -U postgres -d postgres -c 'CREATE DATABASE zveltio_pages;'
cd packages/engine
set -a; source /home/liviu/zveltio-audit/.env.live; set +a
export DATABASE_URL='postgres://postgres:postgres@localhost:5432/zveltio_pages'
export PORT=3420 BETTER_AUTH_URL='http://localhost:3420'
export EXTENSIONS_DIR=/home/liviu/zveltio-extensions NODE_ENV=development
export ZVELTIO_EXTENSIONS="...,content/pages"      # the list is the loader
setsid bun src/index.ts > /tmp/pages.log 2>&1 < /dev/null & disown
```

Ports 3400+; never `pkill -f index.ts` — it kills the shell. Kill by port:
`ss -ltnp | grep :3420`.

Repack after every source change — the runtime loads `engine/index.js`, not your
`.ts`, and the registry refuses the same version with different bytes, so bump
the manifest version too:

```bash
bun run packages/cli/src/index.ts extension pack \
  --dir /home/liviu/zveltio-extensions/content/pages --first-party
```

## Suggested order

1. Decide the merged model on paper first: what a page is, what a site is, where
   `col_span`/`sort_order`/`config_override` live. The data migration follows
   from that and is the risky part.
2. Decide the table names and which set migrates into which. Write that
   migration first and test it on a copy of a real database with zones AND CMS
   pages in it.
3. Move the routes. Keep both URL surfaces answering during the transition if you
   can; a redirect is kinder than a 404 to anyone who bookmarked one.
4. Merge the two Studio editors last. That is the largest piece and the one where
   a mistake is most visible.
5. Delete `content/portals` and `content/page-builder` in the same commit that
   makes `content/pages` complete — never leave two half-features installed.

## One thing to check that nobody has

`content/page-builder` was never examined at the seam the way the others were.
`ext:seam` covers its INSERTs and UPDATEs now, but its **public render path**
(`cms-routes.ts`, `hydrateBlock`) builds a query from `block.content` — collection
name, fields, filters — supplied by whoever authored the block. The collection
name is regex-checked; the field list and filters deserve the same read before
that code becomes the merged extension's public surface.
