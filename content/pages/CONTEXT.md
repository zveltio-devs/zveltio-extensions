# Context

## Studio admin UI

- **SDUI** list at `/admin/pages` — sites + page metadata.
- **Tier-3 block builder** at `/admin/pages/builder/:id` (2026-08-23) — canvas,
  library, properties, undo/redo, save via `PUT /ext/content/pages/pages/:id`.

View renderers (`ListView`, `CardView`, `CalendarView`) ship via `studioComponents`.

## SDUI migration (2026-08-21)

Reduced list CRUD via schema. Nested-route validator fixed in @zveltio/sdk.

---

## Role hydration had never run — repaired 2026-09-05

Found by grepping for the `selectFrom('user')` class after repairing `auth/saml`
and `auth/ldap`, not by pressing a route. A third instance, and the only silent
one.

`sitesRoutes` hydrates `role` onto the session user, with a comment saying why:
*"Better-Auth does not put `role` on the session, so it comes from the row.
Without this every role check compares against undefined."* The read was
`db.selectFrom('user')`, which `ctx.db` refuses. Measured with this extension's
real allowedTables:

```
content/pages allowedTables: zv_page_ab_variants, zv_page_block_types, zv_page_menus,
  zv_page_metrics, zv_page_redirects, zv_page_revisions, zv_page_seo_scores,
  zv_page_sitemap_config, zv_page_sites, zv_page_templates, zv_pages
selectFrom("user"): REFUSED — ExtensionSecurityError
```

And it sat inside `try { … } catch { /* anonymous is a valid state on the render
path */ }`. That catch is true of a missing session and says nothing about a
refused table, so the hydration the comment describes had never once happened, on
any installation — exactly the state the comment exists to prevent.

**Not fail-open.** `hasRole` falls through to the Casbin lookup when `user.role`
is absent, which is why nothing visibly broke and why this survived a pressed
verification. What was lost is the `user.role === 'god'` fast path and any caller
reading the role off the context.

Now a raw `SELECT role FROM "user"`, the same deliberate bypass documented in
`auth/saml`, and it returns a role where it previously returned nothing:

```
content/pages role hydration now: {"role":"member"}
```

The lesson is the one already recorded in `compliance/ro/documents/CONTEXT.md`:
repair the class, not the instance. Two extensions were named in the report; the
grep found the third.

---

## Section 2 — file-by-file review, in progress (2026-09-05)

Two authorisation defects, both found by mapping guards mechanically rather than
by reading for them.

### `GET /cms/nav` served the navigation with no public site

Every route in `cms-routes.ts` calls `publicSite(c)` first — a site that is both
`is_public` and `is_active` — and declines when there is none. `/cms/nav` queried
`zv_page_menus` by tenant and menu key alone. `/cms/*` is in the manifest's
`publicRoutes`, so there is no session in front of it.

Measured against a real database, on a tenant owning only an internal portal:

```
public sites for the tenant: 0
every other /cms/* route:    404 / empty
/cms/nav returned:           [{"label":"Board minutes (confidential)",
                               "url":"/portal/board-minutes"}, …]
```

Menu items carry labels and paths, so that is the internal site's structure handed
to anyone who asks. Now gated like its siblings.

**Not fixed, because it is a schema question:** `zv_page_menus` has no `site_id`.
One `main` and one `footer` per TENANT, shared by every site that tenant owns — so
an operator running a public site beside a portal shares one menu between them by
design, and an internal entry still reaches the public payload. Splitting menus
per site is a migration and a product decision.

### The editor's READS were open to any session

`editor.ts` guarded all 13 writes with `requireAdmin` and all 13 reads with
`requireAuth`, which is `getUser` and nothing else. That is not the rule the
rendered page obeys: `sites.ts:574` refuses a caller who does not hold the site's
`access_roles`.

So a member refused the rendered page could read the same page from
`GET /pages/:id`, `blocks` and all. `GET /pages/` was worse — `selectAll()` with
no status filter, returning every page in the tenant with its body, drafts and
unpublished work included.

Demonstrated in `editor-read-authz.test.ts` as a pair, because a refusal on the
render path alone proves nothing: same user, same mount, render refuses and both
editor reads serve.

Closed with a router-level guard rather than 13 separate calls — the defect is "a
route that forgot", so a route added tomorrow is covered for free. Admin, not the
render path's role check, because that is the rule this module already states for
itself: *"Authoring is therefore an admin-only capability."* A non-admin cannot
author, so there is nothing here for them to read.

Checked before changing it, since the risk was breaking the admin UI: the only
consumer of these reads is the Studio page, whose schema calls `/pages` and
`/pages/{id}`. The public renderer uses `/cms/*`. The two telemetry endpoints the
rendered page posts to — `/metrics/track` and `/:id/ab-variants/:id/track`, both in
`publicRoutes` — are excluded, and a test asserts they stayed open, because a guard
that closed them would look identical to a working fix from the other assertions.

### The `zvd_` prefix guard had no test — found by removing it

`hydrate.ts` has two independent guards on the anonymous path. The registry check
(`zvd_collections` must hold the name) is well covered: removing the
`publicCollections` gate fails 4 tests. The prefix — `const table = zvd_${name}`,
which the file's own header calls the difference between this resolver and the one
that leaked — was covered by **nothing**. Replacing it with `const table = name`,
the exact shape of the 2026-08-16 vulnerability, left all 47 tests passing.

The registry check carries them, because a name that is not a collection is
refused before a table name is built. The case the prefix defends is the one the
registry cannot: a collection that IS registered under a name colliding with a
real table. Creating a collection called `user` is an ordinary admin action; the
engine materialises it as `zvd_user`, and without the prefix the resolver would
read Better-Auth's `user` instead.

Now tested, and the test discriminates — it is the only one that fails when the
prefix is removed.

### Verified by exercising, not by reading

- **Anonymous gate** — removing it fails 4 tests across the block, paging,
  container and viewer-request paths.
- **Sanitizer** — replacing `scrubHtml` with the identity fails 16 of 21.
- **Migrations on an upgraded database**, which had not been done: an install
  carrying only migration 001 plus seeded rows, then 002–007 applied on top. All
  six apply cleanly, the seeded row survives with `jsonb_typeof` = array/object
  rather than string scalars, and the resulting schema is **identical** to a
  virgin install — 130 columns, and the RLS posture matches table for table.
  `zv_page_block_types` carries no RLS on either path, which is migration 007's
  intent and makes the parenthesis in `tenant-isolation.test.ts` true.

### Checked and found sound

`public-seo.ts` has no tenant predicate on the sitemap query and leans on RLS.
That is correct here: the engine mounts `registerPublicRoute` behind
`tenantMiddleware`, so a request carrying a tenant (per-tenant hostname,
`x-tenant-slug`) has the GUC set. The route's own filters — `auth_required =
false`, `kind = 'page'`, `is_public`, `is_active`, and the record-page collection
having to be in `public_collections` — are the gate that matters, and they are
there.

### Still to cover in this extension

`editor.ts` and `sites.ts` beyond their guards — the write paths, revisions,
redirects, A/B variants and the SEO analyser; `jsonb.ts`; and the ~2000 lines of
client Svelte, none of which has been read.

Not yet done for this extension: exercising the write paths against a TWO-TENANT
database. The reads and the guards have been; the writes have been checked for
their guard and not for their scoping, which RLS should cover but which §6 asks to
be demonstrated rather than assumed.
