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

### Still to cover in this extension

`hydrate.ts` (the anonymous data-resolution path, the highest-risk file left),
`sanitize.ts`, `public-seo.ts`, `jsonb.ts`, the 7 migrations against a virgin AND
an upgraded database, and the ~2000 lines of client Svelte.
