/**
 * Sites and their pages.
 *
 * A site is what `content/portals` called a zone: a base path, its own
 * navigation and branding, and the roles that may enter. What changed in the
 * merge is what a page inside it is made of — blocks, the same blocks the CMS
 * editor writes, instead of a list of saved views.
 *
 *   GET    /sites                                   list
 *   POST   /sites                                   create
 *   GET    /sites/:slug                             one
 *   PUT    /sites/:slug                             update
 *   DELETE /sites/:slug                             delete
 *
 *   GET    /sites/:slug/pages                       pages in a site
 *   POST   /sites/:slug/pages                       add a page
 *   PUT    /sites/:slug/pages/:pageSlug             update
 *   DELETE /sites/:slug/pages/:pageSlug             delete
 *   POST   /sites/:slug/pages/reorder               reorder
 *
 *   GET    /sites/:slug/render                      nav + branding
 *   GET    /sites/:slug/render/:pageSlug            a page, blocks resolved
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { sql } from 'kysely';
import { z } from 'zod';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { findBlockById, resolveBlockAt, resolveBlocks, resolveRecord } from './hydrate.js';
import { sanitizeBlocks, sanitizeBlocksForWrite } from './sanitize.js';
import { placeholdersIn } from '../client/bind.js';
import { jsonb } from './jsonb.js';
import { tenantId } from './tenant.js';

// biome-ignore lint/suspicious/noExplicitAny: the internals bag is typed engine-side
type Any = any;

const SiteCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  is_public: z.boolean().optional(),
  access_roles: z.array(z.string()).optional(),
  public_collections: z.array(z.string()).optional(),
  base_path: z.string().min(1).max(200).optional(),
  site_name: z.string().max(100).nullable().optional(),
  site_logo_url: z.preprocess((v) => (v === '' ? null : v), z.string().url().nullable().optional()),
  primary_color: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  ),
  secondary_color: z.preprocess(
    (v) => (v === '' ? null : v),
    z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  ),
  custom_css: z.string().max(50_000).nullable().optional(),
  nav_position: z.enum(['sidebar', 'topbar', 'both']).optional(),
  show_breadcrumbs: z.boolean().optional(),
});

const SiteUpdateSchema = SiteCreateSchema.partial();

const PageCreateSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9/-]+$/),
  icon: z.string().max(50).optional(),
  description: z.string().max(500).optional(),
  is_active: z.boolean().optional(),
  is_homepage: z.boolean().optional(),
  auth_required: z.boolean().optional(),
  allowed_roles: z.array(z.string()).optional(),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().min(0).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  blocks: z.array(z.any()).optional(),
  kind: z.enum(['page', 'popup']).optional(),
  /**
   * The collection this page shows ONE row of, and the column its URL segment
   * matches. Both null for an ordinary page.
   */
  record_collection: z.string().max(100).nullable().optional(),
  record_field: z.string().max(100).nullable().optional(),
  /**
   * Which rows of that collection the page will answer for — the same
   * `{ field, op, value }` list a data block carries.
   *
   * The operator is an enum rather than a string on purpose. `resolveRecord`
   * refuses a page whose filter it cannot read, because a dropped restriction
   * is a restored address; enumerating the operators here means a typo comes
   * back as a 400 naming the field, instead of every record page on the site
   * going dark at the next request.
   */
  record_filter: z
    .array(
      z.object({
        field: z.string().min(1).max(100),
        op: z.enum([
          'eq', 'neq', 'ne', 'lt', 'lte', 'gt', 'gte',
          'like', 'ilike', 'contains', 'in', 'not_in',
          'null', 'not_null', 'is_null', 'is_not_null',
        ]),
        value: z.any().optional(),
      }),
    )
    .max(20)
    .optional(),
  /**
   * When and where a popup appears. Free-form on purpose: these are read as a
   * whole by one component and never queried on. The renderer clamps every
   * number it uses, so a hostile value costs nothing.
   */
  popup_config: z.record(z.string(), z.any()).optional(),
});

const PageUpdateSchema = PageCreateSchema.partial();

const ReorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1) });

/**
 * May this user enter a site or page restricted to `allowed` roles?
 *
 * Both sources count. Authorisation everywhere else comes from Casbin, where a
 * user holds SEVERAL roles and holds them PER TENANT; `user.role` is
 * Better-Auth's single global string. Checking only the latter — which this did
 * for a long time, written out three times — refused a person granted
 * `hr_manager` the normal way, so operators widened `access_roles` until they
 * let everyone in. That is how a fail-closed bug becomes an open door.
 *
 * `getUserRoles` lives on `ctx`, NOT on `ctx.internals`. Portals read it off
 * internals, where it is declared on the neighbouring interface and never built
 * into the object — so it was `undefined`, the call threw a TypeError before the
 * `.catch` could see it, and a zone with `access_roles` answered **500 instead
 * of 403** for every user who needed the Casbin lookup to be let in. Which is
 * everyone the comment above says the lookup exists for: the repair that made
 * roles "the real grant" never executed once. Measured on a live engine, not
 * read out of the source.
 */
async function hasRole(
  getUserRoles: (userId: string) => Promise<string[]>,
  user: { id?: string; role?: string } | null | undefined,
  allowed: readonly string[],
): Promise<boolean> {
  if (allowed.length === 0) return true;
  if (!user) return false;
  if (user.role === 'god') return true;
  if (user.role && allowed.includes(user.role)) return true;
  if (!user.id) return false;
  const roles = await Promise.resolve(getUserRoles(user.id)).catch(() => [] as string[]);
  return roles.some((r: string) => allowed.includes(r));
}

/** Thrown to roll a transaction back on a miss — a returned value commits. */
const NOT_FOUND = Symbol('page-not-found');

export function sitesRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  const engine = ctx.internals as Any;
  // On `ctx`, not on `ctx.internals` — see `hasRole`.
  const getUserRoles = (ctx as Any).getUserRoles as (userId: string) => Promise<string[]>;
  const app = new Hono();

  async function requireAdmin(c: Any): Promise<Response | null> {
    const user = c.get('user');
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const allowed = await engine.isTenantAdmin(user.id).catch(() => false);
    if (!allowed) return c.json({ error: 'Forbidden' }, 403);
    return null;
  }

  // Hydrate the session user. The render endpoints work without one.
  app.use('*', async (c, next) => {
    try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (session?.user) {
        // Better-Auth does not put `role` on the session, so it comes from the
        // row. Without this every role check compares against undefined.
        //
        // This was `db.selectFrom('user')`, which `ctx.db` refuses — `user` is
        // neither `zvd_*`, nor this extension's namespace, nor a table its
        // migrations create. Measured against its real allowedTables:
        //
        //   selectFrom("user"): REFUSED — ExtensionSecurityError
        //
        // And the `catch` below swallowed it, so the hydration this comment
        // describes had never once happened: `role` was always undefined, on
        // every installation, exactly the state the comment says it exists to
        // prevent. A silent failure inside a catch written for a different
        // reason — "anonymous is a valid state" is true of a missing session and
        // says nothing about a refused table.
        //
        // Not fail-open: `hasRole` falls through to the Casbin lookup when
        // `user.role` is absent, which is why nothing visibly broke. What was
        // lost is the `user.role === 'god'` fast path and any caller reading the
        // role off the context. Raw SQL is the same deliberate bypass documented
        // in `auth/saml` — it needs the same grant when the engine closes it.
        const row = await sql<{ role: string | null }>`
          SELECT role FROM "user" WHERE id = ${session.user.id} LIMIT 1
        `
          .execute(db)
          .then((r) => r.rows[0]);
        c.set('user', { ...session.user, role: row?.role ?? (session.user as Any).role });
      }
    } catch {
      /* anonymous is a valid state on the render path */
    }
    await next();
  });

  // ── Sites ─────────────────────────────────────────────────────────────────

  app.get('/', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    const sites = await db
      .selectFrom('zv_page_sites')
      .selectAll()
      .where('tenant_id', '=', tenantId(c))
      .orderBy('name asc')
      .execute();

    return c.json({ sites });
  });

  app.post('/', zValidator('json', SiteCreateSchema), async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    const data = c.req.valid('json');
    try {
      const site = await db
        .insertInto('zv_page_sites')
        .values({
          name: data.name,
          slug: data.slug,
          description: data.description ?? null,
          is_active: data.is_active ?? false,
          is_public: data.is_public ?? false,
          access_roles: data.access_roles ?? [],
          public_collections: data.public_collections ?? [],
          base_path: data.base_path ?? `/${data.slug}`,
          site_name: data.site_name ?? null,
          site_logo_url: data.site_logo_url ?? null,
          primary_color: data.primary_color ?? '#069494',
          secondary_color: data.secondary_color ?? null,
          custom_css: data.custom_css ?? null,
          nav_position: data.nav_position ?? 'sidebar',
          show_breadcrumbs: data.show_breadcrumbs ?? true,
          tenant_id: tenantId(c),
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return c.json({ site }, 201);
    } catch (e) {
      // Bun's SQL driver puts the Postgres SQLSTATE in `errno`; its `code` is
      // the generic ERR_POSTGRES_SERVER_ERROR. 23505 = unique_violation.
      if (String((e as { errno?: string | number }).errno) === '23505') {
        return c.json({ error: `A site with slug "${data.slug}" already exists` }, 409);
      }
      throw e;
    }
  });

  app.get('/:slug', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    const site = await db
      .selectFrom('zv_page_sites')
      .selectAll()
      .where('slug', '=', c.req.param('slug'))
      .where('tenant_id', '=', tenantId(c))
      .executeTakeFirst();

    if (!site) return c.json({ error: 'Site not found' }, 404);
    return c.json({ site });
  });

  app.put('/:slug', zValidator('json', SiteUpdateSchema), async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    const site = await db
      .updateTable('zv_page_sites')
      .set({ ...c.req.valid('json'), updated_at: new Date() })
      .where('slug', '=', c.req.param('slug'))
      .where('tenant_id', '=', tenantId(c))
      .returningAll()
      .executeTakeFirst();

    if (!site) return c.json({ error: 'Site not found' }, 404);
    return c.json({ site });
  });

  app.delete('/:slug', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    await db
      .deleteFrom('zv_page_sites')
      .where('slug', '=', c.req.param('slug'))
      .where('tenant_id', '=', tenantId(c))
      .execute();

    return c.json({ success: true });
  });

  // ── Pages in a site ───────────────────────────────────────────────────────

  async function siteBySlug(c: Any) {
    return db
      .selectFrom('zv_page_sites')
      .selectAll()
      .where('slug', '=', c.req.param('slug'))
      .where('tenant_id', '=', tenantId(c))
      .executeTakeFirst();
  }

  app.get('/:slug/pages', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    const site = await siteBySlug(c);
    if (!site) return c.json({ error: 'Site not found' }, 404);

    const pages = await db
      .selectFrom('zv_pages')
      .selectAll()
      .where('site_id', '=', site.id)
      .where('tenant_id', '=', tenantId(c))
      .orderBy('sort_order asc')
      .orderBy('created_at asc')
      .execute();

    return c.json({ pages });
  });

  app.post('/:slug/pages', zValidator('json', PageCreateSchema), async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    const site = await siteBySlug(c);
    if (!site) return c.json({ error: 'Site not found' }, 404);

    const data = c.req.valid('json');
    const user = c.get('user');

    // One homepage per site. The database enforces it too
    // (uq_zv_pages_site_homepage); clearing the old one first means the editor
    // gets the change it asked for rather than a 409 it has to interpret.
    // Demoting the old homepage and creating the new one are one change. Split,
    // the site is left with NO homepage: the unique index means only one can
    // hold the flag, and the visitor hitting the root gets nothing while every
    // page still lists fine in the editor.
    const page = await db.transaction().execute(async (trx) => {
    if (data.is_homepage) {
      await trx
        .updateTable('zv_pages')
        .set({ is_homepage: false })
        .where('site_id', '=', site.id)
        .where('tenant_id', '=', tenantId(c))
        .where('is_homepage', '=', true)
        .execute();
    }

    return await trx
      .insertInto('zv_pages')
      .values({
        site_id: site.id,
        title: data.title,
        slug: data.slug,
        icon: data.icon ?? null,
        description: data.description ?? null,
        is_active: data.is_active ?? true,
        is_homepage: data.is_homepage ?? false,
        auth_required: data.auth_required ?? !site.is_public,
        allowed_roles: data.allowed_roles ?? [],
        parent_id: data.parent_id ?? null,
        sort_order: data.sort_order ?? 0,
        status: data.status ?? 'draft',
        kind: data.kind ?? 'page',
        record_collection: data.record_collection ?? null,
        record_field: data.record_field ?? null,
        record_filter: jsonb(data.record_filter ?? []),
        popup_config: jsonb(data.popup_config ?? {}),
        blocks: jsonb(sanitizeBlocksForWrite(data.blocks ?? [])),
        created_by: user?.id ?? null,
        updated_by: user?.id ?? null,
        tenant_id: tenantId(c),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    });

    return c.json({ page }, 201);
  });

  app.put('/:slug/pages/:pageSlug', zValidator('json', PageUpdateSchema), async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    const site = await siteBySlug(c);
    if (!site) return c.json({ error: 'Site not found' }, 404);

    const data = c.req.valid('json');
    const user = c.get('user');

    // Worse than a crash window here: the demotion runs BEFORE the update that
    // can match nothing. A PUT naming a slug that does not exist, with
    // `is_homepage: true`, cleared the site's homepage and answered 404 — the
    // site lost its front page on a request that failed. No crash required.
    let page: Awaited<ReturnType<typeof runUpdate>>;
    const runUpdate = () =>
      db.transaction().execute(async (trx) => {
    if (data.is_homepage) {
      await trx
        .updateTable('zv_pages')
        .set({ is_homepage: false })
        .where('site_id', '=', site.id)
        .where('tenant_id', '=', tenantId(c))
        .where('is_homepage', '=', true)
        .execute();
    }

    const patch: Record<string, unknown> = {
      ...data,
      updated_at: new Date(),
      updated_by: user?.id ?? null,
    };
    // Blocks land on a page an audience reads, so they are scrubbed on the way
    // in as well as on the way out.
    if (data.blocks !== undefined) patch.blocks = jsonb(sanitizeBlocksForWrite(data.blocks));
    if (data.popup_config !== undefined) patch.popup_config = jsonb(data.popup_config);
    // Same treatment as the other two JSONB columns: without the cast the array
    // is stored as a JSON string and reads back as text, which `parseFilterList`
    // then parses into nothing — a silently unfiltered record page.
    if (data.record_filter !== undefined) patch.record_filter = jsonb(data.record_filter);

    const updated = await trx
      .updateTable('zv_pages')
      .set(patch)
      .where('site_id', '=', site.id)
      .where('tenant_id', '=', tenantId(c))
      .where('slug', '=', c.req.param('pageSlug'))
      .returningAll()
      .executeTakeFirst();
    // Nothing matched. THROWN, not returned: a callback that returns normally
    // COMMITS, which would leave the demotion above in place — the exact bug
    // this transaction exists to prevent.
    if (!updated) throw NOT_FOUND;
    return updated;
      });
    try {
      page = await runUpdate();
    } catch (err) {
      if (err === NOT_FOUND) return c.json({ error: 'Page not found' }, 404);
      throw err;
    }

    return c.json({ page });
  });

  app.delete('/:slug/pages/:pageSlug', async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    const site = await siteBySlug(c);
    if (!site) return c.json({ error: 'Site not found' }, 404);

    await db
      .deleteFrom('zv_pages')
      .where('site_id', '=', site.id)
      .where('tenant_id', '=', tenantId(c))
      .where('slug', '=', c.req.param('pageSlug'))
      .execute();

    return c.json({ success: true });
  });

  app.post('/:slug/pages/reorder', zValidator('json', ReorderSchema), async (c) => {
    const denied = await requireAdmin(c);
    if (denied) return denied;

    const site = await siteBySlug(c);
    if (!site) return c.json({ error: 'Site not found' }, 404);

    const { ids } = c.req.valid('json');
    await Promise.all(
      ids.map((id, index) =>
        db
          .updateTable('zv_pages')
          .set({ sort_order: index })
          .where('id', '=', id)
          .where('site_id', '=', site.id)
          .where('tenant_id', '=', tenantId(c))
          .execute(),
      ),
    );

    return c.json({ success: true });
  });

  // ── Render ────────────────────────────────────────────────────────────────

  /** Navigation and branding for a site. */
  app.get('/:slug/render', async (c) => {
    const site = await db
      .selectFrom('zv_page_sites')
      .selectAll()
      .where('slug', '=', c.req.param('slug'))
      .where('is_active', '=', true)
      .where('tenant_id', '=', tenantId(c))
      .executeTakeFirst();

    if (!site) return c.json({ error: 'Site not found' }, 404);

    const user = c.get('user');
    if (site.access_roles.length > 0) {
      if (!user) return c.json({ error: 'Authentication required' }, 401);
      if (!(await hasRole(getUserRoles, user, site.access_roles))) {
        return c.json({ error: 'Insufficient role' }, 403);
      }
    }

    const pages = await db
      .selectFrom('zv_pages')
      .select(['id', 'title', 'slug', 'icon', 'parent_id', 'sort_order', 'is_homepage'])
      .where('site_id', '=', site.id)
      .where('tenant_id', '=', tenantId(c))
      .where('is_active', '=', true)
      .where('status', '=', 'published')
      .orderBy('sort_order asc')
      .execute();

    const nav = pages
      .filter((p: Any) => !p.parent_id)
      .map((p: Any) => ({ ...p, children: pages.filter((k: Any) => k.parent_id === p.id) }));

    return c.json({ site, nav });
  });

  /**
   * GET /sites/:slug/render/:pageSlug/blocks/:blockId/rows?offset=N
   *
   * The paging companion to the render route, behind the SAME site and page
   * gates. The block is read out of the stored page by id; the request supplies
   * an offset and nothing else.
   */
  app.get('/:slug/render/:pageSlug/blocks/:blockId/rows', async (c) => {
    const site = await db
      .selectFrom('zv_page_sites')
      .selectAll()
      .where('slug', '=', c.req.param('slug'))
      .where('is_active', '=', true)
      .where('tenant_id', '=', tenantId(c))
      .executeTakeFirst();

    if (!site) return c.json({ error: 'Site not found' }, 404);

    const user = c.get('user');
    if (site.access_roles.length > 0) {
      if (!user) return c.json({ error: 'Authentication required' }, 401);
      if (!(await hasRole(getUserRoles, user, site.access_roles))) {
        return c.json({ error: 'Insufficient role' }, 403);
      }
    }

    const page = await db
      .selectFrom('zv_pages')
      .selectAll()
      .where('site_id', '=', site.id)
      .where('tenant_id', '=', tenantId(c))
      .where('slug', '=', c.req.param('pageSlug'))
      .where('is_active', '=', true)
      .where('status', '=', 'published')
      .where('kind', '=', 'page')
      .executeTakeFirst();

    if (!page) return c.json({ error: 'Page not found' }, 404);

    if (page.auth_required) {
      if (!user) return c.json({ error: 'Authentication required' }, 401);
      if (!(await hasRole(getUserRoles, user, page.allowed_roles as string[]))) {
        return c.json({ error: 'Insufficient role' }, 403);
      }
    }

    const raw: Any[] = typeof page.blocks === 'string' ? JSON.parse(page.blocks) : (page.blocks ?? []);
    const block = findBlockById(raw, c.req.param('blockId'));
    if (!block || block.type !== 'collection_list') return c.json({ error: 'Block not found' }, 404);

    // What the visitor may vary: the window, the sort column, the search term.
    // Each is validated against the block's own configuration inside the
    // resolver — the route only carries them across.
    const viewer = {
      offset: Math.max(0, Number(c.req.query('offset')) || 0),
      sort: c.req.query('sort') || undefined,
      sortDir: c.req.query('dir') === 'asc' ? ('asc' as const) : ('desc' as const),
      q: c.req.query('q') || undefined,
    };
    const resolved = await resolveBlockAt(
      { db, engine },
      {
        user,
        authType: c.get('authType') ?? 'session',
        tenantId: tenantId(c),
        publicCollections: site.public_collections ?? [],
      },
      block,
      viewer,
    );

    const rc = resolved.content ?? {};
    return c.json({
      data: rc._data ?? [],
      offset: rc._offset ?? viewer.offset,
      limit: rc._limit ?? 0,
      has_more: rc._has_more === true,
      error: rc._error ?? null,
    });
  });

  /**
   * One page with its blocks resolved.
   *
   * `/:key` addresses a RECORD page — the same mechanism the public site has,
   * behind this site's roles. A portal listing invoices can link each row to a
   * page showing that invoice, and the record is resolved through `checkAccess`
   * for the signed-in viewer rather than for the page's author.
   */
  app.get('/:slug/render/:pageSlug/:key?', async (c) => {
    const site = await db
      .selectFrom('zv_page_sites')
      .selectAll()
      .where('slug', '=', c.req.param('slug'))
      .where('is_active', '=', true)
      .where('tenant_id', '=', tenantId(c))
      .executeTakeFirst();

    if (!site) return c.json({ error: 'Site not found' }, 404);

    const user = c.get('user');
    if (site.access_roles.length > 0) {
      if (!user) return c.json({ error: 'Authentication required' }, 401);
      if (!(await hasRole(getUserRoles, user, site.access_roles))) {
        return c.json({ error: 'Insufficient role' }, 403);
      }
    }

    const page = await db
      .selectFrom('zv_pages')
      .selectAll()
      .where('site_id', '=', site.id)
      .where('tenant_id', '=', tenantId(c))
      .where('slug', '=', c.req.param('pageSlug'))
      .where('is_active', '=', true)
      .where('status', '=', 'published')
      .where('kind', '=', 'page')
      .executeTakeFirst();

    if (!page) return c.json({ error: 'Page not found' }, 404);

    if (page.auth_required) {
      if (!user) return c.json({ error: 'Authentication required' }, 401);
      if (!(await hasRole(getUserRoles, user, page.allowed_roles as string[]))) {
        return c.json({ error: 'Insufficient role' }, 403);
      }
    }

    const audience = {
      user,
      authType: c.get('authType') ?? 'session',
      tenantId: tenantId(c),
      publicCollections: site.public_collections ?? [],
    };

    const recordKey = c.req.param('key');
    let record: Record<string, Any> | null = null;
    if (page.record_collection) {
      if (!recordKey) return c.json({ error: 'Page not found' }, 404);
      record = await resolveRecord(
        { db, engine },
        audience,
        page.record_collection,
        page.record_field || 'slug',
        recordKey,
        page.record_filter,
      );
      if (!record) return c.json({ error: 'Page not found' }, 404);
    } else if (recordKey) {
      return c.json({ error: 'Page not found' }, 404);
    }

    const raw: Any[] = typeof page.blocks === 'string' ? JSON.parse(page.blocks) : (page.blocks ?? []);

    // Only the fields the page names — see the same note on the public path. A
    // portal viewer is signed in, but "signed in" is not "entitled to every
    // column of that row", and the page's own references are the honest list.
    if (record) {
      const named = new Set(placeholdersIn(raw));
      record = Object.fromEntries(Object.entries(record).filter(([k]) => named.has(k)));
    }
    const blocks = sanitizeBlocks(await resolveBlocks({ db, engine }, audience, raw));

    return c.json({
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        base_path: site.base_path,
        primary_color: site.primary_color,
        secondary_color: site.secondary_color,
        site_logo_url: site.site_logo_url,
        custom_css: site.custom_css,
        nav_position: site.nav_position,
        show_breadcrumbs: site.show_breadcrumbs,
      },
      page: { ...page, blocks: undefined },
      record,
      blocks,
    });
  });

  return app;
}
