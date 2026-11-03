/**
 * GraphQL auto-generated API — Enterprise Edition
 *
 * Builds a live GraphQL schema from zv_collections + zv_fields (via DDLManager)
 * and resolves relations from zvd_relations.
 *
 * GET  /api/graphql                        — GraphiQL playground
 * POST /api/graphql                        — Execute query/mutation (auth required)
 * POST /api/graphql/refresh-schema         — Invalidate cached schema (admin only)
 * POST /api/graphql/persisted/:name/execute — Execute a stored query by name (auth)
 *
 * Stored queries are the declared collection `graphql_queries`: the engine
 * creates it and serves it through the data API, under the operator's rules.
 */

import { Hono } from 'hono';
import {
  execute,
  parse,
  validate,
  specifiedRules,
  NoSchemaIntrospectionCustomRule,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
} from 'graphql';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { checkQueryDepth, checkQueryWidth } from './lib/graphql-dataloader.js';

// The OWN tenant (the `tenant_id` column default's expression). Query names are
// unique per tenant, but the row policy admits the caller's READ REACH — every
// firm for a god — so a match on name alone ran another firm's query.
const OWN_TENANT = sql`COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
                                '00000000-0000-0000-0000-000000000001'::uuid)`;

// ── Types ─────────────────────────────────────────────────────────────────────

/** What one caller may read from one collection — see `readGate`. */
interface ReadGate {
  canRead: boolean;
  /** A column the caller may see, and so may filter or join on. */
  readable(column: string): boolean;
  /** Query alters + row policies onto a SELECT. */
  rows<Q>(qb: Q): Q;
  /** The fetched rows entity access lets the caller view, each column-masked. */
  keep(rows: any[]): Promise<any[]>;
  /** A row a write handed back, as the caller may read it, or null. */
  readBack(row: any): Promise<any>;
}

interface RelationInfo {
  id: string;
  name: string;
  type: 'm2o' | 'o2m' | 'm2m' | 'm2a';
  source_collection: string;
  source_field: string;
  target_collection: string;
  target_field?: string;
  junction_table?: string;
}

// ── Value coercion at the DB → GraphQL boundary ───────────────────────────────
//
// Postgres timestamp columns come back from `pg`/Kysely as JS `Date` objects,
// not strings — `created_at`/`updated_at` and any `date`/`datetime` field are
// mapped to `GraphQLString` (see `mapFieldType`), and graphql-js's default
// field resolver hands the raw `Date` straight to `GraphQLString.serialize`.
// That serializer special-cases object-like values via `.valueOf()`, and
// `Date.prototype.valueOf()` returns the EPOCH MILLISECOND NUMBER — so it
// passed through the "finite number" branch and came back as e.g.
// `"1789297650063"` instead of an ISO timestamp. Measured directly:
// `GraphQLString.serialize(new Date('2026-09-13T11:07:30.063Z'))` returns
// `"1789297650063"`, silently — no error, no obviously-wrong shape, just the
// wrong string. One conversion at the boundary, applied to every scalar field
// a resolver hands back, closes it for base fields and custom ones alike.

function readFieldValue(parent: any, fieldName: string): any {
  const value = parent[fieldName];
  return value instanceof Date ? value.toISOString() : value;
}

/** An API-key principal: the engine names it `apikey:<uuid>`. It holds no role and is never an admin. */
function isApiKey(user: { id?: unknown } | null | undefined): boolean {
  return String(user?.id ?? '').startsWith('apikey:');
}

// ── Field type mapping ────────────────────────────────────────────────────────

function mapFieldType(fieldType: string): any {
  const map: Record<string, any> = {
    text:      GraphQLString,
    string:    GraphQLString,
    email:     GraphQLString,
    url:       GraphQLString,
    richtext:  GraphQLString,
    textarea:  GraphQLString,
    password:  GraphQLString,
    slug:      GraphQLString,
    color:     GraphQLString,
    phone:     GraphQLString,
    tags:      GraphQLString,
    enum:      GraphQLString,
    date:      GraphQLString,
    datetime:  GraphQLString,
    json:      GraphQLString,
    number:    GraphQLFloat,
    float:     GraphQLFloat,
    integer:   GraphQLInt,
    boolean:   GraphQLBoolean,
    uuid:      GraphQLID,
    reference: GraphQLID,
    file:      GraphQLID,
    image:     GraphQLID,
  };
  return map[fieldType] ?? GraphQLString;
}

// ── Schema builder ────────────────────────────────────────────────────────────
//
// IMPORTANT: every resolver below uses the *request-scoped* context
//   ({ user, db })
// instead of the closure-captured ctx.db. That lets us:
//   - use the tenant-isolated transaction (`tenantTrx`) when the
//     extension is mounted in a multi-tenant deployment, so RLS
//     policies see the right `zveltio.current_tenant` GUC;
//   - call `checkAccess(db, user, collection, action)` so the
//     GraphQL surface honours the same RBAC and key scopes as `routes/data.ts`.
//
// Without this every authenticated user could `query { list_users { ... } }`
// and bypass every tenant isolation and RBAC policy the rest of the engine
// enforces — GraphQL was a hidden door past the entire `data.ts` security
// layer.

async function buildDynamicSchema(ctx: ExtensionContext): Promise<GraphQLSchema> {
  const { db, DDLManager } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  let collections: any[] = [];
  let relations: RelationInfo[] = [];

  try {
    collections = await DDLManager.getCollections(db);
    // The engine's registry: `ctx.db` refuses `zvd_relations` since engine #858,
    // and the swallowed refusal built every schema without a single relation.
    relations = (await DDLManager.getRelations(db)) as RelationInfo[];
  } catch { /* no collections yet */ }

  // ── The read gate ──
  //
  // Every resolver used to check read permission on the COLLECTION and then run
  // `selectAll()`. The data API answers the same question with row policies and
  // column permissions as well, so this surface served what `/api/data`
  // withholds — measured on a live engine: a column hidden from `member` came
  // back in `list_*`, and an o2m field read a collection the caller gets 403 on.
  //
  // One gate per collection per operation, resolved once and cached on the
  // operation's context. Every read goes through it: list, get, all three
  // relation kinds, and what a mutation hands back. It is the engine's own
  // `readScope` — row policies, query alters, entity access and column
  // permissions together. Composing the lookups here left out the alters and the
  // entity checks: a row another extension hid came back from `list_*`. Nothing
  // is caught — a failed lookup read as "no restriction" is how rows leak.
  function readGate(context: any, collection: string): Promise<ReadGate> {
    context.__readGates ??= new Map<string, Promise<ReadGate>>();
    let gate = context.__readGates.get(collection);
    if (!gate) {
      gate = (async (): Promise<ReadGate> => {
        const { user } = context;
        // `checkAccess`, as `GET /api/data` asks it: a key by its collection
        // scopes. `ctx.checkPermission` answers a key from `$ext:developer/graphql`
        // for every collection — a key granted that and `read` on A listed B.
        const [canRead, scope] = await Promise.all([
          ctx.internals.checkAccess(db, user, collection, 'read'),
          ctx.internals.readScope(collection, user, isApiKey(user) ? 'api_key' : 'session'),
        ]);
        return {
          canRead: canRead === true,
          readable: scope.readable,
          rows: scope.query,
          keep: async (rows) => (await scope.keep(rows)).map((row) => scope.shape(row)),
          // A RETURNING row did not come through `query`, so all three row gates
          // run on it in memory; an alter that restricts this caller refuses.
          readBack: async (row) =>
            canRead === true && row && (await scope.admits(row)) ? scope.shape(row) : null,
        };
      })();
      context.__readGates.set(collection, gate);
    }
    return gate;
  }
  async function mustRead(context: any, collection: string): Promise<ReadGate> {
    const gate = await readGate(context, collection);
    if (!gate.canRead) throw new Error(`Forbidden: no read permission on "${collection}"`);
    return gate;
  }
  // ── Writes ──
  //
  // A mutation is the data API's own write — `ctx.internals.createRecord` and
  // friends run `POST`/`PATCH`/`DELETE /api/data` as the caller the engine
  // authenticated for this request (`context.c`). They used to be Kysely
  // through `ctx.db`, which applied row policies and nothing else: an update or
  // delete reached rows an alter hides or entity access locks, `created_by`
  // stayed NULL, no revision, webhook, flow or realtime event followed, and
  // hooks ran as `system:developer/graphql` instead of the caller.
  //
  // The data API's answer, as GraphQL: its body on success, `notFound` for a
  // 404 (a row the caller cannot see is not there), its message otherwise.
  function answered(res: { status: number; body: any }, notFound?: unknown): any {
    if (res.status < 300) return res.body;
    if (res.status === 404 && notFound !== undefined) return notFound;
    const b = res.body ?? {};
    throw new Error(b.errors?.join('; ') ?? b.message ?? b.reason ?? b.error ?? `HTTP ${res.status}`);
  }
  const first = async (gate: ReadGate, row: any) => (row ? ((await gate.keep([row]))[0] ?? null) : null);

  const baseFields = {
    id:         { type: GraphQLID },
    created_at: { type: GraphQLString },
    updated_at: { type: GraphQLString },
  };

  const queryFields:      Record<string, any>               = {};
  const mutationFields:   Record<string, any>               = {};
  const collectionTypes:  Record<string, GraphQLObjectType> = {};

  // ── First pass: create all object types ──
  for (const col of collections) {
    const typeName = col.name.charAt(0).toUpperCase() + col.name.slice(1);
    const scalarFields: Record<string, any> = { ...baseFields };
    for (const field of (col.fields || [])) {
      scalarFields[field.name] = { type: mapFieldType(field.type) };
    }
    for (const fieldName of Object.keys(scalarFields)) {
      scalarFields[fieldName] = {
        type: scalarFields[fieldName].type,
        resolve: (parent: any) => readFieldValue(parent, fieldName),
      };
    }

    const colType = new GraphQLObjectType({
      name: typeName,
      fields: () => {
        const allFields: Record<string, any> = { ...scalarFields };
        for (const rel of relations.filter((r) => r.source_collection === col.name)) {
          const targetType = collectionTypes[rel.target_collection];
          if (!targetType) continue;
          if (rel.type === 'm2o') {
            allFields[rel.source_field] = { type: targetType };
          } else if (rel.type === 'o2m' || rel.type === 'm2m') {
            allFields[rel.source_field] = { type: new GraphQLList(targetType) };
          }
        }
        return allFields;
      },
    });

    collectionTypes[col.name] = colType;
  }

  // ── Second pass: query/mutation fields + relation resolvers ──
  for (const col of collections) {
    const tableName = DDLManager.getTableName(col.name);
    const colType   = collectionTypes[col.name];

    const inputFields: Record<string, any> = {};
    for (const field of (col.fields || [])) {
      inputFields[field.name] = { type: mapFieldType(field.type) };
    }

    queryFields[`list_${col.name}`] = {
      type: new GraphQLList(colType),
      args: {
        limit:         { type: GraphQLInt, defaultValue: 50 },
        offset:        { type: GraphQLInt, defaultValue: 0 },
        filter_id:     { type: GraphQLID },
        filter_id_in:  { type: new GraphQLList(GraphQLID) },
      },
      resolve: async (_: any, { limit, offset, filter_id, filter_id_in }: any, context: any) => {
        const gate = await mustRead(context, col.name);
        // A predicate on a column the caller may not see answers questions
        // about its values.
        if ((filter_id || filter_id_in?.length) && !gate.readable('id')) {
          throw new Error(`Forbidden: cannot filter "${col.name}" by id`);
        }
        const trx = context.reqDb ?? context.tenantTrx ?? context.db ?? db;
        let q = gate.rows((trx as any).selectFrom(tableName).selectAll());
        if (filter_id)               q = q.where('id', '=', filter_id);
        if (filter_id_in?.length)    q = q.where('id', 'in', filter_id_in);
        // Clamp limit to 500 so a single GraphQL query can't pull
        // arbitrary amounts of data — matches the `routes/data.ts`
        // QuerySchema cap.
        const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 500));
        const safeOffset = Math.max(0, Number(offset) || 0);
        return gate.keep(await q.limit(safeLimit).offset(safeOffset).execute());
      },
    };

    queryFields[`get_${col.name}`] = {
      type: colType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_: any, { id }: any, context: any) => {
        const gate = await mustRead(context, col.name);
        if (!gate.readable('id')) throw new Error(`Forbidden: cannot filter "${col.name}" by id`);
        const trx = context.reqDb ?? context.tenantTrx ?? context.db ?? db;
        return first(gate, await gate.rows((trx as any).selectFrom(tableName).selectAll())
          .where('id', '=', id)
          .executeTakeFirst());
      },
    };

    mutationFields[`create_${col.name}`] = {
      type: colType,
      args: inputFields,
      resolve: async (_: any, args: any, context: any) => {
        // Resolved before the write, so a failed lookup refuses the write too
        // instead of committing it and failing on the way out.
        const gate = await readGate(context, col.name);
        return gate.readBack(answered(await ctx.internals.createRecord(context.c, col.name, args)));
      },
    };

    mutationFields[`update_${col.name}`] = {
      type: colType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) }, ...inputFields },
      resolve: async (_: any, { id, ...data }: any, context: any) => {
        const gate = await readGate(context, col.name);
        return gate.readBack(answered(await ctx.internals.updateRecord(context.c, col.name, id, data), null));
      },
    };

    mutationFields[`delete_${col.name}`] = {
      type: GraphQLBoolean,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_: any, { id }: any, context: any) =>
        answered(await ctx.internals.deleteRecord(context.c, col.name, id), false) !== false,
    };

    const collectionRelations = relations.filter((r) => r.source_collection === col.name);
    if (collectionRelations.length > 0) {
      const liveFields = colType.getFields();

      for (const rel of collectionRelations) {
        const fieldName       = rel.source_field;
        const targetTableName = DDLManager.getTableName(rel.target_collection);
        const targetType      = collectionTypes[rel.target_collection];
        if (!targetType) continue;

        if (rel.type === 'm2o') {
          (liveFields as any)[fieldName] = {
            name: fieldName,
            type: targetType,
            args: [],
            description: `Many-to-one relation → ${rel.target_collection}`,
            // `parent` has been through its own gate, so a foreign key hidden
            // from the caller is already gone and resolves to null here.
            //
            // This used to call `context.loaders.get(t).load(fk)`, but `get`
            // returns the batch function itself, which has no `.load` — the
            // TypeError was caught and every m2o answered null. It now reads the
            // target through the target's gate.
            // ponytail: one query per parent row (N+1, bounded by the 500-row
            // list cap); batch the ids through the gate if m2o lists get slow.
            resolve: async (parent: any, _args: any, context: any) => {
              const fk = parent[fieldName];
              if (!fk) return null;
              const gate = await mustRead(context, rel.target_collection);
              try {
                return await first(gate, await gate.rows((db as any).selectFrom(targetTableName).selectAll())
                  .where('id', '=', fk).executeTakeFirst());
              } catch { return null; }
            },
          };

        } else if (rel.type === 'o2m') {
          const foreignKey = rel.target_field || `${col.name}_id`;
          (liveFields as any)[fieldName] = {
            name: fieldName,
            type: new GraphQLList(targetType),
            args: [],
            description: `One-to-many relation → ${rel.target_collection}`,
            resolve: async (parent: any, _args: any, context: any) => {
              const gate = await mustRead(context, rel.target_collection);
              // Joining on a column the caller may not see reveals its value.
              if (!gate.readable(foreignKey)) return [];
              try {
                return await gate.keep(await gate.rows((db as any).selectFrom(targetTableName).selectAll())
                  .where(foreignKey, '=', parent.id).execute());
              } catch { return []; }
            },
          };

        } else if (rel.type === 'm2m') {
          const junctionTable = rel.junction_table || `zvd_${col.name}_${rel.target_collection}`;
          const sourceColumn  = `${col.name}_id`;
          const targetColumn  = `${rel.target_collection}_id`;
          (liveFields as any)[fieldName] = {
            name: fieldName,
            type: new GraphQLList(targetType),
            args: [],
            description: `Many-to-many relation → ${rel.target_collection}`,
            resolve: async (parent: any, _args: any, context: any) => {
              const gate = await mustRead(context, rel.target_collection);
              try {
                // A subquery rather than a join, so the row policies' bare
                // column names name the target table's columns.
                const linked = (db as any)
                  .selectFrom(junctionTable)
                  .select(targetColumn)
                  .where(sourceColumn, '=', parent.id);
                return await gate.keep(await gate.rows((db as any).selectFrom(targetTableName).selectAll())
                  .where('id', 'in', linked)
                  .execute());
              } catch { return []; }
            },
          };
        }
      }
    }
  }

  if (Object.keys(queryFields).length === 0) {
    queryFields['_empty'] = {
      type: GraphQLString,
      resolve: () => 'No collections defined yet',
    };
  }

  return new GraphQLSchema({
    query: new GraphQLObjectType({ name: 'Query', fields: queryFields }),
    mutation: Object.keys(mutationFields).length > 0
      ? new GraphQLObjectType({ name: 'Mutation', fields: mutationFields })
      : undefined,
  });
}

// ── Schema cache (TTL 60 s, per tenant) ───────────────────────────────────────
//
// `buildDynamicSchema` reads `zv_collections`/`zv_fields` through `ctx.db`,
// which resolves whichever tenant transaction is active WHEN THE CACHE IS
// BUILT (H-12). A single module-global cache entry does not know that: the
// first request after the TTL expires decides the schema every tenant's
// GraphQL endpoint serves for the next 60 seconds, regardless of who issued
// it. Measured: tenant A defines a `widgets_a` collection, tenant B defines
// `gadgets_b`; if A's request is the one that repopulates the cache, B's very
// next request introspects a schema with `list_widgets_a` in it and no
// `list_gadgets_b` — someone else's collection and field names, not B's own,
// for up to a minute. Keyed by tenant id so each tenant only ever rebuilds
// and reads its own.

const _cachedSchemas = new Map<string, { schema: GraphQLSchema; builtAt: number }>();
const SCHEMA_TTL_MS = 60_000;

async function getSchema(ctx: ExtensionContext, tenantKey: string): Promise<GraphQLSchema> {
  const now = Date.now();
  const entry = _cachedSchemas.get(tenantKey);
  if (!entry || now - entry.builtAt > SCHEMA_TTL_MS) {
    const schema = await buildDynamicSchema(ctx);
    _cachedSchemas.set(tenantKey, { schema, builtAt: now });
    return schema;
  }
  return entry.schema;
}

// ── GraphiQL playground ───────────────────────────────────────────────────────

const PLAYGROUND_HTML = `<!DOCTYPE html>
<html>
  <head>
    <title>Zveltio GraphQL</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/graphiql/3.0.6/graphiql.min.css" />
  </head>
  <body style="margin:0">
    <div id="graphiql" style="height:100vh"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/graphiql/3.0.6/graphiql.min.js"></script>
    <script>
      const fetcher = GraphiQL.createFetcher({ url: '/api/graphql' });
      ReactDOM.render(React.createElement(GraphiQL, { fetcher }), document.getElementById('graphiql'));
    </script>
  </body>
</html>`;

// ── Route factory ─────────────────────────────────────────────────────────────

export function graphqlRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;
  // `DataLoaderRegistry`, `checkQueryDepth` and `checkQueryWidth` used to come
  // from `ctx.internals`: the engine carried the batching and the two query
  // guards while this extension carried the GraphQL API they protect. They now
  // live in `./lib/`, with the feature. Nothing else in the engine used them —
  // `routes/index.ts` has said "moved to extensions/developer/graphql" since
  // the API itself moved.

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  const app = new Hono();

  // Who the `/ext/*` gate admitted: a session, or an API key on a manifest
  // `apiKeyRoutes` route — for which `getSession` is null. With the gate off
  // (`ZVELTIO_EXT_AUTH_GATE=0`) nothing is set, and only a session gets in.
  async function caller(c: any): Promise<any> {
    const admitted = c.get('user');
    if (admitted) return admitted;
    return (await auth.api.getSession({ headers: c.req.raw.headers }))?.user ?? null;
  }

  // The engine object `admin` (ADR 0002), asked as the tenant admin. A key is
  // no admin.
  async function adminCaller(c: any): Promise<any | Response> {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    if (!(await ctx.internals.isTenantAdmin(session.user.id))) return c.json({ error: 'Admin required' }, 403);
    return session.user;
  }

  // `graphql()`, plus one validation rule for a caller who is not a tenant admin:
  // no introspection. The schema is cached per tenant, not per caller, so it
  // names every collection and every column — including the ones this caller's
  // column permissions hide. The engine serves collection schemas to admins only
  // (`/api/collections` sits behind `guardAdmin`).
  async function run(c: any, user: any, schema: GraphQLSchema, source: string, variableValues?: Record<string, any>, operationName?: string): Promise<any> {
    let document;
    try {
      document = parse(source);
    } catch (err) {
      return { errors: [err] };
    }
    const isAdmin = isApiKey(user) ? Promise.resolve(false) : ctx.internals.isTenantAdmin(user.id);
    const rules = (await isAdmin) ? specifiedRules : [...specifiedRules, NoSchemaIntrospectionCustomRule];
    const errors = validate(schema, document, rules);
    if (errors.length) return { errors };
    // Route handler is mounted inside the engine's tenantMiddleware →
    // c.get('tenantTrx') exposes the per-request transaction with
    // `SET LOCAL "zveltio.current_tenant"` already applied. Resolvers
    // use this in preference to the raw pool so RLS policies fire.
    const tenantTrx = (c.get as any)?.('tenantTrx') ?? null;
    return execute({
      schema,
      document,
      variableValues,
      operationName,
      // `c` is what a mutation hands `ctx.internals` to write as this caller.
      contextValue: { c, user, db, tenantTrx, reqDb: db },
    });
  }

  // ── GET / — GraphiQL playground ───────────────────────────────────────────
  // In production we gate the playground behind admin auth because
  // (a) it exposes the entire schema via introspection and
  // (b) it loads scripts from cdnjs that can't satisfy a strict CSP.
  // In dev/staging it stays open so developers can explore.
  app.get('/', async (c) => {
    if (ctx.config?.isProduction) {
      const admin = await adminCaller(c);
      if (admin instanceof Response) return admin;
    }
    return c.html(PLAYGROUND_HTML);
  });

  // ── POST / — Execute GraphQL operation ───────────────────────────────────
  app.post('/', async (c) => {
    const user = await caller(c);
    if (!user) return c.json({ errors: [{ message: 'Unauthorized' }] }, 401);

    let body: { query?: string; variables?: Record<string, any>; operationName?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ errors: [{ message: 'Invalid JSON body' }] }, 400);
    }

    const { query, variables, operationName } = body;
    if (!query) return c.json({ errors: [{ message: 'query is required' }] }, 400);

    const depthError = checkQueryDepth(query, 5);
    if (depthError) return c.json({ errors: [{ message: depthError }] }, 400);
    // Depth bounds how deep one field goes; this bounds how many there are.
    // 600 aliases of the same root field returned 200 OK in 0.42 s and up to
    // 300k rows, all of it one request as far as the rate limiter could tell.
    const widthError = checkQueryWidth(query, 50);
    if (widthError) return c.json({ errors: [{ message: widthError }] }, 400);

    let result: any;
    let errorCount = 0;

    try {
      const tenantKey = (c.get as any)?.('tenant')?.id ?? 'default';
      const schema = await getSchema(ctx, tenantKey);
      result = await run(c, user, schema, query, variables, operationName);
      errorCount = result.errors?.length ?? 0;
    } catch (err) {
      errorCount = 1;
      result = { errors: [{ message: String(err) }] };
    }

    if (errorCount > 0 && !result.data) {
      return c.json(result, 400);
    }
    return c.json(result);
  });

  // ── POST /refresh-schema — admin only ─────────────────────────────────────
  app.post('/refresh-schema', async (c) => {
    const admin = await adminCaller(c);
    if (admin instanceof Response) return admin;

    // Clears every tenant's entry, not just the caller's: the cache is a
    // shared module-level map (see the comment above `_cachedSchemas`), so an
    // admin fixing a stale schema for their own tenant has no way to name
    // just their own entry, and leaving the others would leave the same
    // staleness the endpoint exists to clear.
    _cachedSchemas.clear();
    const tenantKey = (c.get as any)?.('tenant')?.id ?? 'default';
    await getSchema(ctx, tenantKey);
    return c.json({ success: true, message: 'Schema refreshed' });
  });

  // ── POST /persisted/:name/execute — execute persisted query by name ────────
  app.post('/persisted/:name/execute', async (c) => {
    const user = await caller(c);
    if (!user) return c.json({ errors: [{ message: 'Unauthorized' }] }, 401);

    const name = c.req.param('name');
    // Who may run a stored query is the engine's `read` on `graphql_queries`,
    // row rules included, as `GET /api/data` asks it. The query then runs as the
    // caller, under the caller's own permissions, like any query posted to `/`.
    // The collection has no default grants: whoever may edit a stored query
    // chooses what its readers execute, mutations included.
    if ((await ctx.internals.checkAccess(db, user, 'graphql_queries', 'read')) !== true) {
      return c.json({ errors: [{ message: 'Access denied to this persisted query' }] }, 403);
    }
    const scope = await ctx.internals.readScope('graphql_queries', user, isApiKey(user) ? 'api_key' : 'session');
    const pqRes = await sql<any>`
      SELECT * FROM zvd_graphql_queries WHERE name = ${name} AND tenant_id = ${OWN_TENANT}
    `.execute(db);

    const pq = pqRes.rows[0];
    if (!pq || !(await scope.admits(pq))) {
      return c.json({ errors: [{ message: 'Persisted query not found' }] }, 404);
    }

    let variables: Record<string, any> = {};
    try {
      const bodyText = await c.req.text();
      if (bodyText) variables = JSON.parse(bodyText).variables || {};
    } catch { /* no variables */ }

    const widthErrorPersisted = checkQueryWidth(pq.query, 50);
    if (widthErrorPersisted)
      return c.json({ errors: [{ message: widthErrorPersisted }] }, 400);
    const depthError = checkQueryDepth(pq.query, 5);
    if (depthError) return c.json({ errors: [{ message: depthError }] }, 400);

    try {
      const tenantKey = (c.get as any)?.('tenant')?.id ?? 'default';
      const schema = await getSchema(ctx, tenantKey);
      const result = await run(c, user, schema, pq.query, variables);
      return c.json(result);
    } catch (err) {
      return c.json({ errors: [{ message: String(err) }] }, 400);
    }
  });

  return app;
}
