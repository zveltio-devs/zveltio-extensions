/**
 * Tests for the data-block resolver.
 *
 * The rule this file exists to hold in place: a `collection_list` block names a
 * collection, and naming one is not the same as being allowed to read it. The
 * bug these tests were written against let an anonymous visitor read the whole
 * `user` table by naming it in a block on a published page. Proved by execution
 * against a live engine before the fix; held here so it cannot come back
 * quietly.
 *
 * The db and internals are stubs — the point is which decisions the resolver
 * makes, not what Postgres does with the query it builds.
 */

import { describe, expect, test } from 'bun:test';
import { resolveBlocks } from './hydrate.js';

// biome-ignore lint/suspicious/noExplicitAny: test doubles
type Any = any;

/**
 * A query builder that records what it was asked for and returns fixed rows.
 * Every chainable method returns `this` so the resolver's chain runs unchanged.
 */
function makeDb(opts: {
  collections?: string[];
  columns?: string[];
  rows?: Array<Record<string, unknown>>;
}) {
  const collections = opts.collections ?? ['contacts'];
  const columns = opts.columns ?? ['id', 'created_at', 'tenant_id', 'first_name', 'email', 'notes'];
  const rows = opts.rows ?? [{ id: '1', first_name: 'Ana', email: 'a@x.example', notes: 'private' }];

  // Recorded PER TABLE. The resolver issues two metadata queries
  // (`zvd_collections`, `information_schema.columns`) before the data query, so
  // a single shared recorder answers questions about the wrong one — which is
  // how the first version of this file "failed" against correct code.
  const calls = {
    selectedTables: [] as string[],
    selectedFields: [] as string[][],
    selectedAll: 0,
    wheres: [] as Array<[string, string, unknown]>,
    /** Conditions passed as objects — i.e. what `buildCondition` produced. */
    conditions: [] as Any[],
    orderBy: [] as Array<[string, string]>,
    limit: [] as number[],
    offset: [] as number[],
  };

  const META = new Set(['zvd_collections', 'information_schema.columns']);

  function builder(rawTable: string): Any {
    // `selectFrom('information_schema.columns as c')` carries an alias; the
    // set holds bare names.
    const table = rawTable.split(/\s+as\s+/i)[0].trim();
    const isMeta = META.has(table);
    const localWheres: Array<[string, string, unknown]> = [];
    const b: Any = {
      select(fields: string[] | string) {
        if (Array.isArray(fields) && !isMeta) calls.selectedFields.push(fields);
        return b;
      },
      selectAll() {
        if (!isMeta) calls.selectedAll++;
        return b;
      },
      where(a: Any, op?: Any, v?: Any) {
        if (typeof a === 'string') {
          localWheres.push([a, op, v]);
          if (!isMeta) calls.wheres.push([a, op, v]);
        } else if (a && typeof a === 'object') {
          if (!isMeta) calls.conditions.push(a);
        } else if (typeof a === 'function') {
          // Kysely calls the callback with an expression builder. The resolver
          // uses that form for the visitor's search (`eb.or([...])`), so a stub
          // that only records the arguments never runs the conditions at all —
          // which reads as "search built nothing" against correct code.
          a({ or: (xs: Any[]) => xs, and: (xs: Any[]) => xs });
        }
        return b;
      },
      orderBy(f: string, d: string) {
        if (!isMeta) calls.orderBy.push([f, d]);
        return b;
      },
      limit(n: number) {
        if (!isMeta) calls.limit.push(n);
        return b;
      },
      offset(n: number) {
        if (!isMeta) calls.offset.push(n);
        return b;
      },
      execute: async () => {
        if (table === 'zvd_collections') return [];
        if (table === 'information_schema.columns') {
          return columns.map((c) => ({ column_name: c }));
        }
        return rows;
      },
      executeTakeFirst: async () => {
        if (table === 'zvd_collections') {
          const name = localWheres.find(([col]) => col === 'name')?.[2];
          return collections.includes(String(name)) ? { name } : undefined;
        }
        // `resolveRecord` reads one row this way. The stub does not evaluate
        // conditions — a filter reaching the query is proved by `calls`, and
        // one that never should have got there is proved by a null return
        // before any query is built.
        return rows[0];
      },
    };
    return b;
  }

  const db: Any = {
    selectFrom(table: string) {
      calls.selectedTables.push(table);
      return builder(table);
    },
  };
  return { db, calls };
}

function makeEngine(over: Partial<Record<string, Any>> = {}) {
  return {
    checkAccess: async () => true,
    buildCondition: (field: string, cond: Any) => ({ field, cond }),
    getRlsFilters: async () => [],
    applyRlsFilters: (q: Any) => q,
    getColumnAccess: async () => null,
    applyColumnAccess: (r: Any) => r,
    resolveUserRole: async () => 'member',
    ...over,
  } as Any;
}

const listBlock = (content: Record<string, unknown>) => ({
  type: 'collection_list',
  content,
});

describe('anonymous callers', () => {
  test('a collection the site has not published is refused', async () => {
    const { db } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1', publicCollections: [] },
      [listBlock({ collection: 'contacts' })],
    );
    expect(out.content._data).toEqual([]);
    expect(out.content._error).toContain('not published');
  });

  test('a collection the site HAS published is served', async () => {
    const { db } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1', publicCollections: ['contacts'] },
      [listBlock({ collection: 'contacts' })],
    );
    expect(out.content._error).toBeUndefined();
    expect(out.content._data).toHaveLength(1);
  });

  test('a table that is not a collection cannot be named at all', async () => {
    // `user`, `session` and `account` are real tables and none of them is a
    // collection. This is the exact block that leaked every account on the
    // instance before the resolver checked the registry.
    for (const table of ['user', 'session', 'account', 'zv_api_keys']) {
      const { db, calls } = makeDb({ collections: ['contacts'] });
      const [out] = await resolveBlocks(
        { db, engine: makeEngine() },
        // Even with the operator having published everything they could.
        { user: null, tenantId: 't1', publicCollections: ['contacts', table] },
        [listBlock({ collection: table })],
      );
      expect(out.content._error).toBe('Unknown collection');
      expect(out.content._data).toEqual([]);
      // and no query was ever built against it
      expect(calls.selectedTables).not.toContain(table);
      expect(calls.selectedTables).not.toContain(`zvd_${table}`);
    }
  });

  test('row policies are not consulted for an anonymous caller', async () => {
    let rlsCalls = 0;
    const { db } = makeDb({ collections: ['contacts'] });
    await resolveBlocks(
      {
        db,
        engine: makeEngine({
          getRlsFilters: async () => {
            rlsCalls++;
            return [];
          },
        }),
      },
      { user: null, tenantId: 't1', publicCollections: ['contacts'] },
      [listBlock({ collection: 'contacts' })],
    );
    // There is no user for a policy to match; the gate is the site's list.
    expect(rlsCalls).toBe(0);
  });
});

describe('authenticated callers', () => {
  test('checkAccess decides, and a refusal yields no rows', async () => {
    const { db } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      { db, engine: makeEngine({ checkAccess: async () => false }) },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [listBlock({ collection: 'contacts' })],
    );
    expect(out.content._error).toContain('Not permitted');
    expect(out.content._data).toEqual([]);
  });

  test('the site list is irrelevant once there is a user', async () => {
    const { db } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      { db, engine: makeEngine({ checkAccess: async () => true }) },
      // publicCollections empty, but the user passed checkAccess
      { user: { id: 'u1', role: 'member' }, tenantId: 't1', publicCollections: [] },
      [listBlock({ collection: 'contacts' })],
    );
    expect(out.content._error).toBeUndefined();
    expect(out.content._data).toHaveLength(1);
  });

  test('getColumnAccess is called with (collection, role) — not the engine spelling', async () => {
    const seen: unknown[][] = [];
    const { db } = makeDb({ collections: ['contacts'] });
    await resolveBlocks(
      {
        db,
        engine: makeEngine({
          getColumnAccess: async (...args: unknown[]) => {
            seen.push(args);
            return { hidden: new Set(['notes']), readOnly: new Set() };
          },
          applyColumnAccess: (r: Any, access: Any) => {
            const out: Any = {};
            for (const [k, v] of Object.entries(r)) if (!access.hidden.has(k)) out[k] = v;
            return out;
          },
        }),
      },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [listBlock({ collection: 'contacts' })],
    );
    // Portals passed (db, collection, role) here, so the mask silently never
    // applied. Two arguments, first one the collection name.
    expect(seen[0]?.[0]).toBe('contacts');
    expect(seen[0]).toHaveLength(2);
  });

  test('hidden columns are stripped from the rows', async () => {
    const { db } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      {
        db,
        engine: makeEngine({
          getColumnAccess: async () => ({ hidden: new Set(['notes']), readOnly: new Set() }),
          applyColumnAccess: (r: Any, access: Any) => {
            const o: Any = {};
            for (const [k, v] of Object.entries(r)) if (!access.hidden.has(k)) o[k] = v;
            return o;
          },
        }),
      },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [listBlock({ collection: 'contacts' })],
    );
    expect(out.content._data[0]).not.toHaveProperty('notes');
    expect(out.content._data[0]).toHaveProperty('first_name');
  });
});

describe('field, filter and sort names', () => {
  test('only real columns reach the select list', async () => {
    const { db, calls } = makeDb({ collections: ['contacts'] });
    await resolveBlocks(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [listBlock({ collection: 'contacts', display_fields: 'first_name,password,nope' })],
    );
    const fields = calls.selectedFields.at(-1);
    expect(fields).toEqual(['first_name']);
  });

  test('naming only unknown fields is a refusal, not "all columns"', async () => {
    const { db, calls } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [listBlock({ collection: 'contacts', display_fields: 'password,token' })],
    );
    expect(out.content._error).toContain('No readable fields');
    expect(calls.selectedAll).toBe(0);
  });

  test('a filter on an unknown column is dropped rather than passed through', async () => {
    let built = 0;
    const { db } = makeDb({ collections: ['contacts'] });
    await resolveBlocks(
      {
        db,
        engine: makeEngine({
          buildCondition: (f: string) => {
            built++;
            return { f };
          },
        }),
      },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [
        listBlock({
          collection: 'contacts',
          filters: [
            { field: 'first_name', op: 'eq', value: 'Ana' },
            { field: 'not_a_column', op: 'eq', value: 'x' },
          ],
        }),
      ],
    );
    expect(built).toBe(1);
  });

  test('page-builder null-check operators are translated, not dropped', async () => {
    const ops: string[] = [];
    const { db } = makeDb({ collections: ['contacts'] });
    await resolveBlocks(
      {
        db,
        engine: makeEngine({
          buildCondition: (_f: string, cond: Any) => {
            ops.push(cond.op);
            return {};
          },
        }),
      },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [
        listBlock({
          collection: 'contacts',
          filters: [
            { field: 'email', op: 'is_null' },
            { field: 'notes', op: 'is_not_null' },
          ],
        }),
      ],
    );
    // `buildCondition` spells these `null` / `not_null`. Passed through as
    // written they would hit its default branch and the filter would vanish —
    // which returns MORE rows than asked for, not fewer.
    expect(ops).toEqual(['null', 'not_null']);
  });

  test('an unknown sort column falls back instead of reaching the query', async () => {
    const { db, calls } = makeDb({ collections: ['contacts'] });
    await resolveBlocks(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [listBlock({ collection: 'contacts', sort_field: 'password' })],
    );
    expect(calls.orderBy.at(-1)?.[0]).toBe('created_at');
  });

  test('the limit is clamped', async () => {
    const { db, calls } = makeDb({ collections: ['contacts'] });
    await resolveBlocks(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [listBlock({ collection: 'contacts', limit: 100000 })],
    );
    // one extra row is fetched to answer `_has_more`
    expect(calls.limit.at(-1)).toBe(101);
  });

  test('rows are scoped to the request tenant', async () => {
    const { db, calls } = makeDb({ collections: ['contacts'] });
    await resolveBlocks(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 'tenant-a' },
      [listBlock({ collection: 'contacts' })],
    );
    expect(calls.wheres).toContainEqual(['tenant_id', '=', 'tenant-a']);
  });
});

describe('non-data blocks', () => {
  test('static blocks pass through untouched', async () => {
    const { db, calls } = makeDb({});
    const input = [
      { type: 'hero', content: { title: 'Hi' } },
      { type: 'richtext', content: { content: '<p>x</p>' } },
    ];
    const out = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1' },
      input,
    );
    expect(out).toEqual(input);
    expect(calls.selectedTables).toHaveLength(0);
  });

  test('a migrated view keeps its field list, which arrives as objects', async () => {
    const { db, calls } = makeDb({ collections: ['contacts'] });
    await resolveBlocks(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [
        listBlock({
          collection: 'contacts',
          // the shape zvd_views.fields migrated into
          fields: [{ field: 'first_name' }, { field: 'email' }],
        }),
      ],
    );
    expect(calls.selectedFields.at(-1)).toEqual(['first_name', 'email']);
  });
});

describe('paging', () => {
  test('an offset reaches the query, and one extra row is fetched', async () => {
    const { db, calls } = makeDb({ collections: ['contacts'] });
    const { resolveBlockAt } = await import('./hydrate.js');
    await resolveBlockAt(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      listBlock({ collection: 'contacts', limit: 5 }),
      { offset: 10 },
    );
    expect(calls.offset.at(-1)).toBe(10);
    // limit + 1: the probe row that answers `_has_more`
    expect(calls.limit.at(-1)).toBe(6);
  });

  test('the probe row is reported, not returned', async () => {
    const rows = Array.from({ length: 6 }, (_, i) => ({ id: String(i), first_name: `C${i}` }));
    const { db } = makeDb({ collections: ['contacts'], rows });
    const { resolveBlockAt } = await import('./hydrate.js');
    const out = await resolveBlockAt(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      listBlock({ collection: 'contacts', limit: 5 }),
      { offset: 0 },
    );
    expect(out.content._data).toHaveLength(5);
    expect(out.content._has_more).toBe(true);
    expect(out.content._offset).toBe(0);
    expect(out.content._limit).toBe(5);
  });

  test('a short page reports no more', async () => {
    const rows = Array.from({ length: 2 }, (_, i) => ({ id: String(i), first_name: `C${i}` }));
    const { db } = makeDb({ collections: ['contacts'], rows });
    const { resolveBlockAt } = await import('./hydrate.js');
    const out = await resolveBlockAt(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      listBlock({ collection: 'contacts', limit: 5 }),
      { offset: 5 },
    );
    expect(out.content._data).toHaveLength(2);
    expect(out.content._has_more).toBe(false);
  });

  test('paging a refused block still refuses', async () => {
    const { db } = makeDb({ collections: ['contacts'] });
    const { resolveBlockAt } = await import('./hydrate.js');
    const out = await resolveBlockAt(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1', publicCollections: [] },
      listBlock({ collection: 'contacts' }),
      { offset: 50 },
    );
    expect(out.content._error).toContain('not published');
    expect(out.content._data).toEqual([]);
  });

  test('a negative offset cannot walk backwards past zero', async () => {
    const { db, calls } = makeDb({ collections: ['contacts'] });
    const { resolveBlockAt } = await import('./hydrate.js');
    await resolveBlockAt(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      listBlock({ collection: 'contacts' }),
      { offset: -100 },
    );
    expect(calls.offset.at(-1)).toBe(0);
  });
});

describe('containers', () => {
  const container = (kids: Any[]) => ({
    id: 'box', type: 'container', content: { gap: 'md', children: kids },
  });

  test('a data block inside a container is resolved', async () => {
    const { db } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [container([listBlock({ collection: 'contacts' })])],
    );
    expect(out.content.children[0].content._data).toHaveLength(1);
  });

  test('a data block inside a container is REFUSED by the same rule', async () => {
    // The whole point of recursing here rather than resolving nested blocks
    // somewhere else: one gate, at every depth.
    const { db } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1', publicCollections: [] },
      [container([listBlock({ collection: 'contacts' })])],
    );
    expect(out.content.children[0].content._error).toContain('not published');
    expect(out.content.children[0].content._data).toEqual([]);
  });

  test('a table that is not a collection is refused inside a container too', async () => {
    const { db, calls } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1', publicCollections: ['user'] },
      [container([listBlock({ collection: 'user' })])],
    );
    expect(out.content.children[0].content._error).toBe('Unknown collection');
    expect(calls.selectedTables).not.toContain('user');
  });

  test('nesting goes deeper than one level', async () => {
    const { db } = makeDb({ collections: ['contacts'] });
    const [out] = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      [container([container([listBlock({ collection: 'contacts' })])])],
    );
    expect(out.content.children[0].content.children[0].content._data).toHaveLength(1);
  });

  test('static blocks inside a container pass through untouched', async () => {
    const { db } = makeDb({});
    const kid = { id: 'k', type: 'richtext', content: { content: '<p>x</p>' } };
    const [out] = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1' },
      [container([kid])],
    );
    expect(out.content.children[0]).toEqual(kid);
  });

  test('a container with no children is left alone', async () => {
    const { db } = makeDb({});
    const empty = { id: 'box', type: 'container', content: { gap: 'md' } };
    const [out] = await resolveBlocks(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1' },
      [empty],
    );
    expect(out).toEqual(empty);
  });

  test('findBlockById reaches a nested block, so paging works inside a container', async () => {
    const { findBlockById } = await import('./hydrate.js');
    const tree = [container([container([{ id: 'deep', type: 'collection_list', content: {} }])])];
    expect(findBlockById(tree, 'deep')?.id).toBe('deep');
    expect(findBlockById(tree, 'missing')).toBeNull();
  });
});

describe('what a visitor may vary', () => {
  const call = async (content: Record<string, Any>, viewer: Any, over: Any = {}) => {
    const { db, calls } = makeDb({ collections: ['contacts'], ...over });
    const { resolveBlockAt } = await import('./hydrate.js');
    const out = await resolveBlockAt(
      { db, engine: makeEngine() },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      listBlock(content),
      viewer,
    );
    return { out, calls };
  };

  test('sorting by a column the block displays is honoured', async () => {
    const { calls } = await call(
      { collection: 'contacts', display_fields: 'first_name,email' },
      { sort: 'email', sortDir: 'asc' },
    );
    expect(calls.orderBy.at(-1)).toEqual(['email', 'asc']);
  });

  test('sorting by a column the block does NOT display is refused', async () => {
    // The page never showed `notes`. Ordering by it would let a visitor read its
    // values one comparison at a time, without it ever appearing on screen.
    const { calls } = await call(
      { collection: 'contacts', display_fields: 'first_name', sort_field: 'first_name' },
      { sort: 'notes', sortDir: 'asc' },
    );
    expect(calls.orderBy.at(-1)?.[0]).toBe('first_name');
  });

  test('with no field list every column is on the page, so every column sorts', async () => {
    const { calls } = await call({ collection: 'contacts' }, { sort: 'notes' });
    expect(calls.orderBy.at(-1)?.[0]).toBe('notes');
  });

  test('search builds one condition per displayed column', async () => {
    const built: string[] = [];
    const { db } = makeDb({ collections: ['contacts'] });
    const { resolveBlockAt } = await import('./hydrate.js');
    await resolveBlockAt(
      {
        db,
        engine: makeEngine({
          buildCondition: (f: string, cond: Any) => { built.push(`${f}:${cond.op}`); return {}; },
        }),
      },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      listBlock({ collection: 'contacts', display_fields: 'first_name,email' }),
      { q: 'ana' },
    );
    expect(built).toEqual(['first_name:ilike', 'email:ilike']);
  });

  test('search never reaches a column the block does not display', async () => {
    const built: string[] = [];
    const { db } = makeDb({ collections: ['contacts'] });
    const { resolveBlockAt } = await import('./hydrate.js');
    await resolveBlockAt(
      {
        db,
        engine: makeEngine({
          buildCondition: (f: string) => { built.push(f); return {}; },
        }),
      },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      listBlock({ collection: 'contacts', display_fields: 'first_name' }),
      { q: 'secret' },
    );
    expect(built).toEqual(['first_name']);
    expect(built).not.toContain('notes');
  });

  test('a blank search adds nothing', async () => {
    const built: string[] = [];
    const { db } = makeDb({ collections: ['contacts'] });
    const { resolveBlockAt } = await import('./hydrate.js');
    await resolveBlockAt(
      { db, engine: makeEngine({ buildCondition: (f: string) => { built.push(f); return {}; } }) },
      { user: { id: 'u1', role: 'member' }, tenantId: 't1' },
      listBlock({ collection: 'contacts' }),
      { q: '   ' },
    );
    expect(built).toEqual([]);
  });

  test("the author's sort still wins when the visitor asks for nothing", async () => {
    const { calls } = await call(
      { collection: 'contacts', sort_field: 'email', sort_dir: 'asc' },
      {},
    );
    expect(calls.orderBy.at(-1)).toEqual(['email', 'asc']);
  });

  test('a refused block stays refused however the visitor sorts or searches', async () => {
    const { db } = makeDb({ collections: ['contacts'] });
    const { resolveBlockAt } = await import('./hydrate.js');
    const out = await resolveBlockAt(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1', publicCollections: [] },
      listBlock({ collection: 'contacts' }),
      { sort: 'first_name', q: 'ana', offset: 20 },
    );
    expect(out.content._error).toContain('not published');
    expect(out.content._data).toEqual([]);
  });
});

/**
 * `record_filter` — which rows a record page will answer for.
 *
 * The gap these hold closed was found on a live instance: a homepage table
 * filtered to `status = active` still served the archived contact at
 * `/team/maria-radu`, and the sitemap advertised it. `public_collections` is
 * still the gate and nothing unpublished leaked, but a block's filter is
 * presentation — it decides what one block draws, never what the site answers
 * for. So the page carries its own.
 *
 * The direction that matters most is what happens to a filter the server cannot
 * apply. Dropping one is not a smaller restriction, it is NO restriction: every
 * row the author excluded gets its address back, quietly, and goes into the
 * sitemap. So an unreadable filter refuses the page instead.
 */
describe('a record page filters which rows have an address', () => {
  const audience = { user: null, tenantId: 't1', publicCollections: ['contacts'] };

  async function resolve(recordFilter?: unknown) {
    const { db, calls } = makeDb({
      collections: ['contacts'],
      columns: ['id', 'tenant_id', 'slug', 'status', 'first_name'],
      rows: [{ id: '1', slug: 'maria-radu', status: 'archived', first_name: 'Maria' }],
    });
    const { resolveRecord } = await import('./hydrate.js');
    const row = await resolveRecord(
      { db, engine: makeEngine() },
      audience,
      'contacts',
      'slug',
      'maria-radu',
      recordFilter,
    );
    return { row, calls };
  }

  test('no filter answers for every row — the behaviour before this existed', async () => {
    const { row } = await resolve(undefined);
    expect(row).not.toBeNull();
  });

  test('a filter reaches the query through the engine compiler', async () => {
    const { row, calls } = await resolve([{ field: 'status', op: 'eq', value: 'active' }]);
    expect(row).not.toBeNull();
    // `makeEngine().buildCondition` returns `{ field, cond }`, so its presence
    // among the conditions is proof the filter was compiled rather than
    // hand-rolled into a `where(col, op, val)` of this module's own.
    expect(calls.conditions).toContainEqual({
      field: 'status',
      cond: { op: 'eq', value: 'active' },
    });
  });

  test('the key and the tenant are still constrained alongside it', async () => {
    const { calls } = await resolve([{ field: 'status', op: 'eq', value: 'active' }]);
    expect(calls.wheres).toContainEqual(['slug', '=', 'maria-radu']);
    expect(calls.wheres).toContainEqual(['tenant_id', '=', 't1']);
  });

  test('a filter stored as text — not jsonb — still applies', async () => {
    // The trap migration 004 was written for. A column holding a JSON *string*
    // parses to a list here; if it did not, the page would answer for every row
    // while looking filtered in Studio.
    const { row, calls } = await resolve(JSON.stringify([{ field: 'status', op: 'eq', value: 'active' }]));
    expect(row).not.toBeNull();
    expect(calls.conditions).toHaveLength(1);
  });

  test('a filter naming a column the collection does not have REFUSES the page', async () => {
    const { row, calls } = await resolve([{ field: 'nonexistent', op: 'eq', value: 'x' }]);
    expect(row).toBeNull();
    expect(calls.conditions).toEqual([]);
  });

  test('an operator the compiler does not implement REFUSES the page', async () => {
    // The failure mode without this: `parseFilterList` drops the entry, the
    // loop applies nothing, and the page silently answers for every row.
    const { row } = await resolve([{ field: 'status', op: 'sounds_like', value: 'active' }]);
    expect(row).toBeNull();
  });

  test('a malformed entry REFUSES the page', async () => {
    for (const bad of [[null], ['status = active'], [{ field: 'status' }], [{ op: 'eq' }]]) {
      const { row } = await resolve(bad);
      expect(row).toBeNull();
    }
  });

  test('page-builder operator spellings are translated, not refused', async () => {
    // `is_null` and `contains` are the older names; the resolver aliases them
    // onto `null` and `ilike`. Refusing them would turn a filter written in the
    // old Studio into a dead page.
    for (const [op, expected] of [
      ['is_null', 'null'],
      ['is_not_null', 'not_null'],
      ['contains', 'ilike'],
      ['ne', 'neq'],
    ] as const) {
      const { row, calls } = await resolve([{ field: 'status', op, value: 'x' }]);
      expect(row).not.toBeNull();
      expect(calls.conditions[0].cond.op).toBe(expected);
    }
  });

  test('every filter must pass — they are ANDed, not ORed', async () => {
    const { row, calls } = await resolve([
      { field: 'status', op: 'eq', value: 'active' },
      { field: 'first_name', op: 'not_null' },
    ]);
    expect(row).not.toBeNull();
    expect(calls.conditions).toHaveLength(2);
  });

  test('the collection gate still comes first', async () => {
    // A filter is not a substitute for permission: an unpublished collection is
    // refused before the filter is even read.
    const { db, calls } = makeDb({ collections: ['contacts'] });
    const { resolveRecord } = await import('./hydrate.js');
    const row = await resolveRecord(
      { db, engine: makeEngine() },
      { user: null, tenantId: 't1', publicCollections: [] },
      'contacts',
      'slug',
      'maria-radu',
      [{ field: 'status', op: 'eq', value: 'active' }],
    );
    expect(row).toBeNull();
    expect(calls.conditions).toEqual([]);
  });
});
