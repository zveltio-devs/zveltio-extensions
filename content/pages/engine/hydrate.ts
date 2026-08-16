/**
 * Resolving a data block — the ONE place a `collection_list` becomes rows.
 *
 * Both predecessors had their own copy of this and they were not equally good.
 *
 * `content/portals` did it correctly: it called `checkAccess`, compiled filters
 * with `buildCondition`, applied `getRlsFilters` and the column mask, scoped by
 * tenant, and resolved the table as `zvd_<collection>` so the name could only
 * ever address a collection.
 *
 * `content/page-builder` did none of that. `hydrateBlock` took `block.content`
 * — collection, field list, filters, sort — and built a query from it. The
 * collection name was regex-checked for SHAPE (`/^[a-zA-Z0-9_]+$/`) and used as
 * the table name verbatim, so it addressed any table in the database whose name
 * happened to match. On the PUBLIC, unauthenticated render path.
 *
 * Measured on a live engine on 2026-08-16, not inferred: an anonymous
 * `GET /cms/:slug` of a published page returned the entire `user` table — every
 * account on the instance, across every tenant, `god` included — because `user`
 * has no tenant_id and (deliberately, see engine migration 044) no RLS. Reading
 * `session`, `account`, `twoFactor` and `verification` returned "permission
 * denied": migration 044's REVOKE from `zveltio_rls` is what stopped it being a
 * credential leak, which is exactly the "next miss survivable instead of total"
 * that migration was written for. Everything below `zv_*` and outside those four
 * was readable, and every `zvd_*` collection of the tenant was readable with all
 * of its columns, bypassing the column-permission model entirely.
 *
 * It was not SQL injection — Kysely quotes identifiers, and a crafted field name
 * came back as `column "first_name""" does not exist`. It was unauthorised
 * reading, which needed no injection.
 *
 * So the merged extension has one resolver, built from the portals version, and
 * the CMS path is the one that changed. Two rules decide who may read what:
 *
 *   * A request with a user goes through `checkAccess`, the same call
 *     `/api/data` makes.
 *   * An ANONYMOUS request has no user for `checkAccess` to judge, so it needs
 *     a positive answer from somewhere else: the site's `public_collections`,
 *     written by an operator. Empty by default, so every existing install is
 *     closed until someone opts a collection in on purpose.
 *
 * And in both cases the field list, the filters and the sort column are checked
 * against the table's REAL columns before they reach a query.
 */

// biome-ignore lint/suspicious/noExplicitAny: the internals bag is typed engine-side
type Any = any;

export interface HydrateDeps {
  db: Any;
  /** `ctx.internals` — the engine helpers. Never reimplement one of these. */
  engine: Any;
}

export interface HydrateAudience {
  /** The signed-in user, or null/undefined for an anonymous visitor. */
  user: { id?: string; role?: string } | null | undefined;
  authType?: 'session' | 'api_key';
  /** Tenant to scope collection rows to. */
  tenantId: string;
  /**
   * Collections this SITE publishes anonymously. Consulted only when `user` is
   * absent. An empty list denies every data block, which is the default.
   */
  publicCollections?: readonly string[];
}

/** What a collection is, established from the database rather than from input. */
interface CollectionMeta {
  name: string;
  table: string;
  columns: Set<string>;
}

/**
 * Collections keyed by name, for the life of one request.
 *
 * Per-request and not longer: a cache that outlives the request would keep
 * serving a column list after a DDL change, and this list is what decides which
 * fields a caller may name.
 */
export function createCollectionCache(deps: HydrateDeps) {
  const seen = new Map<string, CollectionMeta | null>();

  return async function lookup(name: unknown): Promise<CollectionMeta | null> {
    if (typeof name !== 'string' || name.length === 0) return null;
    if (seen.has(name)) return seen.get(name) ?? null;

    // The collection registry is the allowlist. A name that is not a row here is
    // not a collection, whatever it may be in the database — which is the whole
    // difference between this and a regex over the string.
    //
    // Neither query below catches. A `.catch(() => null)` here would make a
    // database failure indistinguishable from "no such collection" — the same
    // answer, reached without ever having asked the question. Both are refusals
    // so nothing leaks either way, but the caller logs a thrown error and stays
    // silent about an absent row, and only one of those deserves attention.
    const row = await deps.db
      .selectFrom('zvd_collections')
      .select(['name'])
      .where('name', '=', name)
      .executeTakeFirst();

    if (!row) {
      seen.set(name, null);
      return null;
    }

    // Columns from the catalog, not from `zvd_collections.fields`: the catalog
    // cannot disagree with the table, and a field list that has drifted from the
    // DDL would otherwise decide what a caller is allowed to name.
    const table = `zvd_${name}`;
    const cols: Array<{ column_name: string }> = await deps.db
      .selectFrom('information_schema.columns as c')
      .select(['c.column_name as column_name'])
      .where('c.table_schema', '=', 'public')
      .where('c.table_name', '=', table)
      .execute();

    if (cols.length === 0) {
      // Registered but not materialised — a collection mid-DDL. Nothing to read.
      seen.set(name, null);
      return null;
    }

    const meta: CollectionMeta = {
      name,
      table,
      columns: new Set(cols.map((c: { column_name: string }) => c.column_name)),
    };
    seen.set(name, meta);
    return meta;
  };
}

function blockError(block: Any, message: string): Any {
  return { ...block, content: { ...block.content, _data: [], _error: message } };
}

/**
 * Is this caller allowed to read this collection at all?
 *
 * Returns the reason for refusal, or null to proceed. Anonymous and
 * authenticated are genuinely different questions, not one question with a
 * missing argument, so they are asked separately.
 */
async function refuseReason(
  deps: HydrateDeps,
  audience: HydrateAudience,
  collection: string,
): Promise<string | null> {
  if (!audience.user) {
    const allowed = audience.publicCollections ?? [];
    return allowed.includes(collection)
      ? null
      : 'This collection is not published on this site';
  }

  const mayRead = await deps.engine
    .checkAccess(deps.db, audience.user, collection, 'read')
    .catch(() => false);
  return mayRead ? null : 'Not permitted to read this collection';
}

/**
 * Resolve one block. A block that is not `collection_list` passes through
 * untouched — static content has nothing to look up.
 */
export async function resolveBlock(
  deps: HydrateDeps,
  audience: HydrateAudience,
  lookup: ReturnType<typeof createCollectionCache>,
  block: Any,
  /**
   * What the VISITOR asked for on top of what the author configured.
   *
   * Three things and no more: a window, a sort column, and a search term. Each
   * is checked against the block's own configuration before it reaches a query —
   * a sort column must be one the block already displays, and search only looks
   * at those columns. So a visitor can rearrange what the author published and
   * cannot reach past it.
   */
  viewer: ViewerRequest = {},
): Promise<Any> {
  return resolveWithViewer(deps, audience, lookup, block, viewer);
}

/** What a visitor may vary about a data block. */
export interface ViewerRequest {
  /**
   * Rows to skip — how paging is done.
   *
   * The block itself is read back out of the stored page by the route, never
   * taken from the request, so asking for page 4 cannot become asking for a
   * different collection. That is the whole reason paging did not become a
   * second query endpoint: a second endpoint is a second authorisation path,
   * and this area has already produced one leak from exactly that. */
  offset?: number;
  /** Column to sort by. Refused unless the block already shows it. */
  sort?: string;
  sortDir?: 'asc' | 'desc';
  /** Free text, matched against the columns the block already shows. */
  q?: string;
}

async function resolveWithViewer(
  deps: HydrateDeps,
  audience: HydrateAudience,
  lookup: ReturnType<typeof createCollectionCache>,
  block: Any,
  viewer: ViewerRequest,
): Promise<Any> {
  const offset = Math.max(0, Math.floor(Number(viewer.offset) || 0));
  // A container holds blocks, and a data block inside one must be judged by the
  // same rules as a data block at the top. Resolving only the outer level would
  // leave nested blocks unresolved — and, worse, would invite a future reader to
  // "fix" that by resolving them somewhere else, which is how this area grew two
  // authorisation paths the first time.
  if (block?.type === 'container') {
    const kids = block.content?.children;
    if (!Array.isArray(kids)) return block;
    const resolvedKids = await Promise.all(
      kids.map((k: Any) => resolveWithViewer(deps, audience, lookup, k, {})),
    );
    return { ...block, content: { ...block.content, children: resolvedKids } };
  }

  if (block?.type !== 'collection_list') return block;

  const content = block.content ?? {};

  let meta: CollectionMeta | null;
  try {
    meta = await lookup(content.collection);
  } catch (err) {
    console.error(
      `[content/pages] could not resolve collection "${String(content.collection)}":`,
      (err as Error)?.message ?? err,
    );
    return blockError(block, 'Could not load this data');
  }
  if (!meta) return blockError(block, 'Unknown collection');

  const refusal = await refuseReason(deps, audience, meta.name);
  if (refusal) return blockError(block, refusal);

  // ── The query ───────────────────────────────────────────────────────────
  // Every identifier below is checked against `meta.columns` first. Kysely
  // quotes identifiers, so an unchecked name could not inject SQL — but it
  // could still name a column the block's author was never shown, which on a
  // public page is the same leak by a slower route.

  const requested = parseFields(content);
  const fields = requested.filter((f) => meta.columns.has(f));
  // Asking for columns and being left with none is a refusal, not "all columns":
  // falling back to selectAll() there would widen the answer precisely when the
  // request was invalid.
  if (requested.length > 0 && fields.length === 0) {
    return blockError(block, 'No readable fields named');
  }

  /**
   * Columns the block actually shows — the visitor's whole vocabulary.
   *
   * When the author named no fields, everything the collection has is on the
   * page anyway, so everything is sortable and searchable. When they named some,
   * that list is the limit: sorting by a column the page does not display would
   * let a visitor order records by a field they were never shown, which leaks
   * its values one comparison at a time.
   */
  const shown = fields.length > 0 ? new Set(fields) : meta.columns;

  const authorSort =
    typeof content.sort_field === 'string' && meta.columns.has(content.sort_field)
      ? content.sort_field
      : meta.columns.has('created_at')
        ? 'created_at'
        : 'id';

  const sortField =
    typeof viewer.sort === 'string' && shown.has(viewer.sort) ? viewer.sort : authorSort;
  const sortDir = viewer.sort
    ? viewer.sortDir === 'asc' ? 'asc' : 'desc'
    : content.sort_dir === 'asc' ? 'asc' : 'desc';
  const limit = Math.min(Math.max(Number(content.limit) || 20, 1), 100);

  try {
    let q =
      fields.length > 0
        ? deps.db.selectFrom(meta.table).select(fields)
        : deps.db.selectFrom(meta.table).selectAll();

    // Tenant scope explicitly as well as through RLS. `ctx.db` is already
    // RLS-scoped, so this is defence in depth — and it is how the engine wrote
    // it, after an audit found these very reads listing other tenants' rows
    // when the predicate was absent and RLS had not yet reached the table.
    if (meta.columns.has('tenant_id')) {
      q = q.where('tenant_id', '=', audience.tenantId);
    }

    // Filters through the engine's compiler. Written out by hand, this loop
    // covered six operators in page-builder and silently dropped `in`,
    // `not_in` and the null checks — and a filter that is dropped rather than
    // rejected returns UNFILTERED rows, which for `owner_id in [...]` is the
    // whole collection.
    for (const f of parseFilters(content)) {
      if (!meta.columns.has(f.field)) continue;
      q = q.where(deps.engine.buildCondition(f.field, { op: f.op, value: f.value }));
    }

    // The visitor's search, across the columns the block displays and no others.
    // Built with the engine's condition compiler like every other filter, so the
    // term is a bound parameter rather than anything spliced into SQL.
    const term = typeof viewer.q === 'string' ? viewer.q.trim() : '';
    if (term.length > 0) {
      const searchable = [...shown].filter((c) => meta.columns.has(c));
      if (searchable.length > 0) {
        q = q.where((eb: Any) =>
          eb.or(
            searchable.map((col) =>
              deps.engine.buildCondition(col, { op: 'ilike', value: term }),
            ),
          ),
        );
      }
    }

    // Row policies, for a caller we can identify. An anonymous visitor has no
    // identity for a policy to match, which is why the gate above is a site's
    // explicit list rather than a policy evaluation.
    if (audience.user) {
      const rls = await deps.engine
        .getRlsFilters(meta.name, audience.user, audience.authType ?? 'session')
        .catch(() => []);
      q = deps.engine.applyRlsFilters(q, rls);
    }

    // One row more than asked for: its presence is what `_has_more` reports, and
    // it costs nothing next to a second COUNT(*) over the same predicate.
    const window = await q
      .orderBy(sortField, sortDir)
      .limit(limit + 1)
      .offset(Math.max(0, Math.floor(offset)))
      .execute();
    const hasMore = window.length > limit;
    let records = hasMore ? window.slice(0, limit) : window;

    // Column permissions.
    //
    // `ctx.internals.getColumnAccess` takes (collection, role) — the host
    // resolves the db handle itself. Portals called it as
    // `getColumnAccess(db, collection, role)`, the engine-side spelling, so the
    // handle arrived as the collection name and the collection name as the
    // role. The lookup then asked for a collection called "[object Object]",
    // matched nothing, and the mask came back empty: column permissions were
    // silently not applied on the portal render path either. `_engine` is typed
    // `any`, so nothing said so.
    const role = await deps.engine.resolveUserRole(audience.user ?? {}).catch(() => 'public');
    const colAccess = await deps.engine.getColumnAccess(meta.name, role).catch(() => null);
    if (colAccess) {
      records = records.map((r: Record<string, unknown>) =>
        deps.engine.applyColumnAccess(r, colAccess),
      );
    }

    return {
      ...block,
      content: {
        ...content,
        _data: records,
        _offset: offset,
        _limit: limit,
        _has_more: hasMore,
      },
    };
  } catch (err) {
    // The message is deliberately not the database's. `column "x" does not
    // exist` told an anonymous caller which columns exist, one guess at a time.
    console.error(
      `[content/pages] collection_list failed for "${meta.name}":`,
      (err as Error)?.message ?? err,
    );
    return blockError(block, 'Could not load this data');
  }
}

/** Resolve every block on a page, preserving order. */
export async function resolveBlocks(
  deps: HydrateDeps,
  audience: HydrateAudience,
  blocks: Any[],
): Promise<Any[]> {
  const lookup = createCollectionCache(deps);
  return Promise.all(blocks.map((b) => resolveBlock(deps, audience, lookup, b)));
}

/**
 * Find a block by id anywhere on a page, containers included.
 *
 * The paging routes used `blocks.find(...)`, which stops at the top level — so a
 * data block inside a container could be rendered but never paged, and the
 * failure would read as "Block not found" on a block plainly visible on screen.
 */
export function findBlockById(blocks: Any[], id: string): Any | null {
  if (!Array.isArray(blocks)) return null;
  for (const b of blocks) {
    if (String(b?.id) === id) return b;
    if (b?.type === 'container') {
      const hit = findBlockById(b.content?.children, id);
      if (hit) return hit;
    }
  }
  return null;
}

/**
 * Resolve ONE block of an already-authorised page, at an offset.
 *
 * `block` comes from the stored page the route just loaded and checked, not from
 * the request — the request contributes an offset and nothing else.
 */
export async function resolveBlockAt(
  deps: HydrateDeps,
  audience: HydrateAudience,
  block: Any,
  viewer: ViewerRequest,
): Promise<Any> {
  return resolveWithViewer(deps, audience, createCollectionCache(deps), block, viewer);
}

// ── Input shapes ────────────────────────────────────────────────────────────

/**
 * The field list arrives two ways and always did: page-builder wrote
 * `display_fields` as a comma-separated string, portals wrote `fields` as a
 * JSON array of field objects. Both are read so a migrated view and a
 * hand-authored CMS block behave the same.
 */
function parseFields(content: Any): string[] {
  const out: string[] = [];

  if (typeof content.display_fields === 'string') {
    for (const s of content.display_fields.split(',')) {
      const t = s.trim();
      if (t) out.push(t);
    }
  }

  if (Array.isArray(content.fields)) {
    for (const f of content.fields) {
      if (typeof f === 'string' && f.trim()) out.push(f.trim());
      else if (f && typeof f === 'object' && typeof f.field === 'string') out.push(f.field);
      else if (f && typeof f === 'object' && typeof f.name === 'string') out.push(f.name);
    }
  }

  return [...new Set(out)];
}

interface ParsedFilter {
  field: string;
  op: string;
  value: unknown;
}

/**
 * Filter operators, mapped onto the ones `buildCondition` implements.
 *
 * page-builder spelled the null checks `is_null` / `is_not_null`; the engine's
 * compiler calls them `null` / `not_null`. Passing the page-builder spelling
 * straight through would land in `buildCondition`'s default branch — so the
 * filter would be dropped and the block would answer with unfiltered rows.
 */
const OP_ALIASES: Record<string, string> = {
  is_null: 'null',
  is_not_null: 'not_null',
  ne: 'neq',
  contains: 'ilike',
};

const KNOWN_OPS = new Set([
  'eq', 'neq', 'lt', 'lte', 'gt', 'gte',
  'like', 'ilike', 'in', 'not_in', 'null', 'not_null',
]);

function parseFilters(content: Any): ParsedFilter[] {
  const raw = content.filters;
  const list = typeof raw === 'string' ? safeParse(raw) : raw;
  if (!Array.isArray(list)) return [];

  const out: ParsedFilter[] = [];
  for (const f of list) {
    if (!f || typeof f !== 'object') continue;
    if (typeof f.field !== 'string' || typeof f.op !== 'string') continue;
    const op = OP_ALIASES[f.op] ?? f.op;
    if (!KNOWN_OPS.has(op)) continue;
    out.push({ field: f.field, op, value: f.value });
  }
  return out;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
