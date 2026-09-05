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
