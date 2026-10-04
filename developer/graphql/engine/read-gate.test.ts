// Regression: every resolver in this extension checked read permission on the
// COLLECTION and then ran `selectAll()`. The engine's data API answers the same
// question with row policies and column permissions as well, so GraphQL served
// what `/api/data` withholds. Measured on a live engine (2026-09-30), one member,
// one session:
//
//   GET  /api/data/notes                     -> salary absent (column permission)
//   POST /ext/developer/graphql list_notes   -> salary "100"
//   GET  /api/data/secrets                   -> 403 (no read permission)
//   POST ... list_notes { secrets { secret } } -> "launch-codes" (o2m traversal)
//
// Runs against the packed bundle + real Postgres. The engine's own
// `applyRlsFilters` and `applyColumnAccess` do the filtering; only the three
// LOOKUPS (which policy, which columns, which role) are answered here, keyed by
// user, because they read engine tables this suite does not own.
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { join } from 'node:path';

// biome-ignore lint/suspicious/noExplicitAny: test doubles and the packed module
type Any = any;

const DB_URL = process.env.TEST_DATABASE_URL ?? '';
const d = DB_URL ? describe : describe.skip;

const MEMBER = { id: 'u-rg-member', email: 'member@example.test' };
const ADMIN = { id: 'u-rg-admin', email: 'admin@example.test' };

/** What the member may do, per collection. The admin may do anything. */
const GRANTS: Record<string, string[]> = {
  rg_notes: ['read', 'create', 'update', 'delete'],
  rg_comments: ['read'],
  rg_tags: ['read'],
  rg_secrets: ['create'],
};
/** Row policies for the member (the admin holds data:view_all). */
const RLS: Record<string, Any[]> = {
  rg_notes: [{ field: 'bucket', condition: { op: 'eq', value: 'open' } }],
  rg_tags: [{ field: 'bucket', condition: { op: 'eq', value: 'open' } }],
};
/** Column permissions for the member role (the admin holds data:view_all_columns). */
const HIDDEN: Record<string, string[]> = {
  rg_notes: ['salary'],
  rg_comments: ['note_id', 'id'],
  rg_tags: ['code'],
};
const READ_ONLY: Record<string, string[]> = {
  rg_notes: ['status'],
};

const COLLECTIONS = [
  { name: 'rg_notes', fields: ['title', 'bucket', 'salary', 'status'] },
  { name: 'rg_secrets', fields: ['note_id', 'secret'] },
  { name: 'rg_comments', fields: ['note_id', 'body', 'pinned_note', 'secret_ref'] },
  { name: 'rg_tags', fields: ['label', 'bucket', 'code', 'note_ref'] },
].map((c) => ({ name: c.name, fields: c.fields.map((f) => ({ name: f, type: 'text' })) }));

const RELATIONS = [
  // every relation kind into a collection the member may not read at all
  ['rg_secrets_rel', 'o2m', 'rg_notes', 'secrets', 'rg_secrets', 'note_id', null],
  ['rg_secret_ref_rel', 'm2o', 'rg_comments', 'secret_ref', 'rg_secrets', null, null],
  ['rg_secret_links_rel', 'm2m', 'rg_notes', 'secret_links', 'rg_secrets', null, 'zvd_rg_notes_secrets'],
  // o2m into a collection with its own row policy and column permissions
  ['rg_tag_rows_rel', 'o2m', 'rg_notes', 'tag_rows', 'rg_tags', 'note_ref', null],
  // o2m whose foreign key is a column hidden from the member
  ['rg_comments_rel', 'o2m', 'rg_notes', 'comments', 'rg_comments', 'note_id', null],
  // m2o through a visible foreign key, and through a hidden one
  ['rg_pinned_rel', 'm2o', 'rg_comments', 'pinned_note', 'rg_notes', null, null],
  ['rg_note_rel', 'm2o', 'rg_comments', 'note_id', 'rg_notes', null, null],
  ['rg_tags_rel', 'm2m', 'rg_notes', 'tags', 'rg_tags', null, 'zvd_rg_notes_tags'],
];

let pool: Any;
let db: Any;
let app: Any;
let currentUser: Any = MEMBER;
let rlsLookupFails = false;
const ids: Record<string, string> = {};

async function gql(query: string) {
  const res = await app.request('/', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return res.json();
}
const one = async (q: string) => (await pool.query(q)).rows[0];

d('developer/graphql — resolvers go through the read gate', () => {
  beforeAll(async () => {
    const { Kysely, PostgresDialect } = (await import(
      join(import.meta.dir, '..', '..', '..', 'node_modules', 'kysely', 'dist', 'index.js')
    )) as Any;
    const pg = (await import('pg')) as Any;
    pool = new (pg.Pool ?? pg.default.Pool)({ connectionString: DB_URL, max: 2 });
    db = new Kysely({ dialect: new PostgresDialect({ pool }) });

    // The engine's own filtering code, not a copy of it.
    const tenancy = (await import(
      join(import.meta.dir, '..', '..', '..', '..', 'zveltio', 'packages', 'engine', 'src', 'lib', 'tenancy', 'index.js')
    )) as Any;

    for (const c of COLLECTIONS) {
      await pool.query(`DROP TABLE IF EXISTS zvd_${c.name}`);
      await pool.query(
        `CREATE TABLE zvd_${c.name} (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ` +
          c.fields.map((f) => `${f.name} TEXT`).join(', ') +
          `, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`,
      );
    }
    await pool.query('DROP TABLE IF EXISTS zvd_rg_notes_tags');
    await pool.query('CREATE TABLE zvd_rg_notes_tags (rg_notes_id UUID, rg_tags_id UUID)');
    await pool.query('DROP TABLE IF EXISTS zvd_rg_notes_secrets');
    await pool.query('CREATE TABLE zvd_rg_notes_secrets (rg_notes_id UUID, rg_secrets_id UUID)');

    ids.open = (await one(`INSERT INTO zvd_rg_notes (title, bucket, salary) VALUES ('open-row', 'open', '100') RETURNING id`)).id;
    ids.hidden = (await one(`INSERT INTO zvd_rg_notes (title, bucket, salary) VALUES ('hidden-row', 'restricted', '999') RETURNING id`)).id;
    ids.secret = (await one(`INSERT INTO zvd_rg_secrets (note_id, secret) VALUES ('${ids.open}', 'launch-codes') RETURNING id`)).id;
    await pool.query(`INSERT INTO zvd_rg_notes_secrets VALUES ('${ids.open}', '${ids.secret}')`);
    ids.comment = (await one(
      `INSERT INTO zvd_rg_comments (note_id, body, pinned_note, secret_ref) VALUES
         ('${ids.open}', 'on-open', '${ids.open}', '${ids.secret}'), ('${ids.open}', 'pins-hidden', '${ids.hidden}', NULL)
       RETURNING id`,
    )).id;
    ids.tagOpen = (await one(`INSERT INTO zvd_rg_tags (label, bucket, code, note_ref) VALUES ('tag-open', 'open', 'T1', '${ids.open}') RETURNING id`)).id;
    ids.tagHidden = (await one(`INSERT INTO zvd_rg_tags (label, bucket, code, note_ref) VALUES ('tag-hidden', 'restricted', 'T2', '${ids.open}') RETURNING id`)).id;
    await pool.query(
      `INSERT INTO zvd_rg_notes_tags VALUES ('${ids.open}', '${ids.tagOpen}'), ('${ids.open}', '${ids.tagHidden}')`,
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS zvd_relations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, type TEXT,
        source_collection TEXT, source_field TEXT, target_collection TEXT,
        target_field TEXT, junction_table TEXT)`);
    await pool.query(`DELETE FROM zvd_relations WHERE name LIKE 'rg\\_%'`);
    for (const r of RELATIONS) {
      await pool.query(
        `INSERT INTO zvd_relations (name, type, source_collection, source_field, target_collection, target_field, junction_table)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        r,
      );
    }

    const isAdmin = (u: Any) => u.id === ADMIN.id;
    const ctx: Any = {
      db,
      config: {},
      auth: { api: { getSession: async () => ({ user: currentUser }) } },
      checkPermission: async (userId: string, resource: string, action: string) =>
        userId === ADMIN.id || (GRANTS[resource] ?? []).includes(action),
      getUserRoles: async () => [],
      DDLManager: {
        getCollections: async () => COLLECTIONS,
        // The engine's registry, as `ctx.DDLManager.getRelations` reads it.
        getRelations: async () =>
          (await pool.query(`SELECT * FROM zvd_relations WHERE name LIKE 'rg\\_%'`)).rows,
        getTableName: (name: string) => `zvd_${name}`,
      },
      internals: {
        isTenantAdmin: async (userId: string) => userId === ADMIN.id,
        // The collection-level check the resolvers ask, as the stub above answers it.
        checkAccess: async (_db: unknown, u: Any, resource: string, action: string) =>
          u.id === ADMIN.id || (GRANTS[resource] ?? []).includes(action),
        applyRlsFilters: tenancy.applyRlsFilters,
        // The engine's `readScope` with its lookups answered from the tables
        // above; alters and entity access are `engine-gate.test.ts`'s.
        readScope: async (collection: string, u: Any) => {
          if (rlsLookupFails) throw new Error('policy lookup failed');
          const member = !isAdmin(u);
          const rls = member ? (RLS[collection] ?? []) : [];
          const columns = {
            hidden: new Set(member ? (HIDDEN[collection] ?? []) : []),
            readOnly: new Set(member ? (READ_ONLY[collection] ?? []) : []),
          };
          return {
            rls,
            columns,
            query: (q: Any) => tenancy.applyRlsFilters(q, rls),
            keep: async (rows: Any[]) => rows,
            admits: (row: Any) => tenancy.matchesRlsFilters(row, rls),
            shape: (row: Any) => tenancy.applyColumnAccess(row, columns),
            readable: (c: string) => !columns.hidden.has('*') && !columns.hidden.has(c),
          };
        },
        // Stand-ins for the data API's writes, which answer who may write what
        // (`engine-gate.test.ts` runs the real ones). Here only the row policy
        // decides what is found, so these tests pin what a mutation hands BACK.
        createRecord: async (_c: Any, collection: string, data: Any) => ({
          status: 201,
          body: await db.insertInto(`zvd_${collection}`).values(data).returningAll().executeTakeFirst(),
        }),
        updateRecord: async (_c: Any, collection: string, id: string, data: Any) => {
          const rls = isAdmin(currentUser) ? [] : (RLS[collection] ?? []);
          const row = await tenancy.applyRlsFilters(db.updateTable(`zvd_${collection}`), rls)
            .set(data).where('id', '=', id).returningAll().executeTakeFirst();
          return row ? { status: 200, body: row } : { status: 404, body: { error: 'Record not found' } };
        },
        deleteRecord: async (_c: Any, collection: string, id: string) => {
          const rls = isAdmin(currentUser) ? [] : (RLS[collection] ?? []);
          const res = await tenancy.applyRlsFilters(db.deleteFrom(`zvd_${collection}`), rls)
            .where('id', '=', id).executeTakeFirst();
          return res.numDeletedRows > 0n ? { status: 200, body: { success: true, id } } : { status: 404, body: { error: 'Record not found' } };
        },
      },
    };

    const { Hono } = (await import(
      join(import.meta.dir, '..', '..', '..', 'node_modules', 'hono', 'dist', 'index.js')
    )) as Any;
    const mod = await import(join(import.meta.dir, 'index.js'));
    app = new Hono();
    // Own schema-cache key: the cache is module-global across test files.
    app.use('*', async (c: Any, next: Any) => {
      c.set('tenant', { id: 'test-read-gate' });
      await next();
    });
    await mod.default.register(app, ctx);
  });

  afterAll(async () => {
    for (const c of COLLECTIONS) await pool?.query(`DROP TABLE IF EXISTS zvd_${c.name}`).catch(() => undefined);
    await pool?.query('DROP TABLE IF EXISTS zvd_rg_notes_tags, zvd_rg_notes_secrets').catch(() => undefined);
    await pool?.query(`DELETE FROM zvd_relations WHERE name LIKE 'rg\\_%'`).catch(() => undefined);
    await db?.destroy().catch(() => undefined);
  });

  it('an exempt caller still sees every row and column (the gate is not a blanket deny)', async () => {
    currentUser = ADMIN;
    const r = await gql('{ list_rg_notes { title salary tags { code } } }');
    expect(r.errors).toBeUndefined();
    expect(r.data.list_rg_notes).toHaveLength(2);
    expect(r.data.list_rg_notes.map((n: Any) => n.salary).sort()).toEqual(['100', '999']);
  });

  it('list_ drops the rows a row policy hides and the columns a column permission hides', async () => {
    currentUser = MEMBER;
    const r = await gql('{ list_rg_notes { title salary } }');
    expect(r.errors).toBeUndefined();
    expect(r.data.list_rg_notes).toEqual([{ title: 'open-row', salary: null }]);
  });

  it('get_ answers null for a row the policy hides, and masks the one it shows', async () => {
    currentUser = MEMBER;
    const r = await gql(`{ h: get_rg_notes(id: "${ids.hidden}") { title } o: get_rg_notes(id: "${ids.open}") { title salary } }`);
    expect(r.errors).toBeUndefined();
    expect(r.data.h).toBeNull();
    expect(r.data.o).toEqual({ title: 'open-row', salary: null });
  });

  it('filter_id cannot reach a hidden row', async () => {
    currentUser = MEMBER;
    const r = await gql(`{ list_rg_notes(filter_id_in: ["${ids.hidden}"]) { title } }`);
    expect(r.data.list_rg_notes).toEqual([]);
  });

  it('filtering by an id the caller may not see is refused', async () => {
    currentUser = MEMBER;
    const l = await gql(`{ list_rg_comments(filter_id: "${ids.comment}") { body } }`);
    const g = await gql(`{ get_rg_comments(id: "${ids.comment}") { body } }`);
    for (const r of [l, g]) {
      expect(r.errors?.[0]?.message).toContain('Forbidden');
      expect(JSON.stringify(r.data)).not.toContain('on-open');
    }
  });

  for (const [kind, query] of [
    ['o2m', '{ list_rg_notes { title secrets { secret } } }'],
    ['m2o', '{ list_rg_comments { body secret_ref { secret } } }'],
    ['m2m', '{ list_rg_notes { title secret_links { secret } } }'],
  ]) {
    it(`${kind} into a collection without read permission is refused`, async () => {
      currentUser = MEMBER;
      const r = await gql(query!);
      expect(JSON.stringify(r.data)).not.toContain('launch-codes');
      expect(r.errors?.[0]?.message).toContain('Forbidden');
    });
  }

  it('o2m applies the target collection row policy and column permissions', async () => {
    currentUser = MEMBER;
    const r = await gql('{ list_rg_notes { tag_rows { label code } } }');
    expect(r.errors).toBeUndefined();
    expect(r.data.list_rg_notes).toEqual([{ tag_rows: [{ label: 'tag-open', code: null }] }]);
  });

  it('o2m through a foreign key hidden from the caller returns nothing', async () => {
    currentUser = MEMBER;
    const r = await gql('{ list_rg_notes { comments { body } } }');
    expect(r.errors).toBeUndefined();
    expect(r.data.list_rg_notes).toEqual([{ comments: [] }]);
  });

  it('m2o follows a visible key through the gate, and a hidden key not at all', async () => {
    currentUser = MEMBER;
    const r = await gql('{ list_rg_comments { body note_id { title } pinned_note { title salary } } }');
    expect(r.errors).toBeUndefined();
    const byBody = Object.fromEntries(r.data.list_rg_comments.map((c: Any) => [c.body, c]));
    expect(byBody['on-open'].note_id).toBeNull();
    expect(byBody['on-open'].pinned_note).toEqual({ title: 'open-row', salary: null });
    expect(byBody['pins-hidden'].pinned_note).toBeNull();
  });

  it('m2m applies the target collection row policy and column permissions', async () => {
    currentUser = MEMBER;
    const r = await gql('{ list_rg_notes { tags { label code } } }');
    expect(r.errors).toBeUndefined();
    expect(r.data.list_rg_notes).toEqual([{ tags: [{ label: 'tag-open', code: null }] }]);
  });

  it('update_ and delete_ do not reach a hidden row; update_ returns a masked row', async () => {
    currentUser = MEMBER;
    const r = await gql(
      `mutation { h: update_rg_notes(id: "${ids.hidden}", title: "pwned") { title salary }
                  o: update_rg_notes(id: "${ids.open}", title: "open-row") { title salary }
                  d: delete_rg_notes(id: "${ids.hidden}") }`,
    );
    expect(r.errors).toBeUndefined();
    expect(r.data.h).toBeNull();
    expect(r.data.o).toEqual({ title: 'open-row', salary: null });
    expect(r.data.d).toBe(false);
    expect((await one(`SELECT title FROM zvd_rg_notes WHERE id = '${ids.hidden}'`))?.title).toBe('hidden-row');
  });

  it('create_ returns the new row masked', async () => {
    currentUser = MEMBER;
    const r = await gql('mutation { create_rg_notes(title: "new", bucket: "open") { title salary } }');
    expect(r.errors).toBeUndefined();
    expect(r.data.create_rg_notes).toEqual({ title: 'new', salary: null });
    await pool.query(`DELETE FROM zvd_rg_notes WHERE title = 'new'`);
  });

  // Which columns a caller may write is the data API's answer (`filterWritableFields`),
  // pinned against the real one in `engine-gate.test.ts`.

  it('create_ by a caller who may create but not read hands nothing back', async () => {
    currentUser = MEMBER;
    const r = await gql('mutation { create_rg_secrets(secret: "drop-box") { secret } }');
    expect(r.errors).toBeUndefined();
    expect(r.data.create_rg_secrets).toBeNull();
    await pool.query(`DELETE FROM zvd_rg_secrets WHERE secret = 'drop-box'`);
  });

  // The schema is cached per tenant, not per caller, so it names the columns
  // this caller's permissions hide. The engine serves schemas to admins only.
  it('a caller who is not an admin cannot introspect the schema', async () => {
    const q = '{ __type(name: "Rg_notes") { fields { name } } }';
    currentUser = MEMBER;
    const r = await gql(q);
    expect(r.errors?.[0]?.message).toContain('introspection has been disabled');
    expect(JSON.stringify(r)).not.toContain('salary');
    currentUser = ADMIN;
    const a = await gql(q);
    expect(a.errors).toBeUndefined();
    expect(a.data.__type.fields.map((f: Any) => f.name)).toContain('salary');
  });

  it('a failed policy lookup refuses instead of reading as "no restriction"', async () => {
    currentUser = MEMBER;
    rlsLookupFails = true;
    try {
      const r = await gql('{ list_rg_notes { title } }');
      expect(r.data?.list_rg_notes ?? null).toBeNull();
      expect(r.errors?.length).toBeGreaterThan(0);
    } finally {
      rlsLookupFails = false;
    }
  });
});
