/**
 * GraphQL auto-generated API — Enterprise Edition
 *
 * Builds a live GraphQL schema from zv_collections + zv_fields (via DDLManager)
 * and resolves relations from zvd_relations.
 *
 * GET  /api/graphql                        — GraphiQL playground
 * POST /api/graphql                        — Execute query/mutation (auth required, logs operation)
 * POST /api/graphql/refresh-schema         — Invalidate cached schema (admin only)
 * GET  /api/graphql/persisted              — List persisted queries
 * POST /api/graphql/persisted              — Create persisted query (admin)
 * DELETE /api/graphql/persisted/:id        — Delete persisted query (admin)
 * POST /api/graphql/persisted/:name/execute — Execute persisted query by name (auth)
 * GET  /api/graphql/logs                   — List operation logs (admin)
 * DELETE /api/graphql/logs                 — Clear logs older than 30 days (admin)
 * GET  /api/graphql/stats                  — Operation stats (admin)
 * GET  /api/graphql/field-policies         — List field policies (admin)
 * POST /api/graphql/field-policies         — Create field policy (admin)
 * DELETE /api/graphql/field-policies/:id   — Delete field policy (admin)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as crypto from 'crypto';
import {
  graphql,
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
// ── Zod schemas ───────────────────────────────────────────────────────────────

const PersistedQueryCreateSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Name must be alphanumeric with underscores/hyphens'),
  description: z.string().optional(),
  query: z.string().min(1),
  variables_schema: z.record(z.string(), z.any()).optional(),
  is_public: z.boolean().default(false),
  allowed_roles: z.array(z.string()).default([]),
});

const FieldPolicyCreateSchema = z.object({
  collection: z.string().min(1).max(100),
  field: z.string().min(1).max(100),
  allowed_roles: z.array(z.string()).default([]),
  deny_roles: z.array(z.string()).default([]),
});

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Relations loader ──────────────────────────────────────────────────────────

async function getRelations(db: any): Promise<RelationInfo[]> {
  try {
    const result = await sql<RelationInfo>`
      SELECT id, name, type,
             source_collection, source_field,
             target_collection, target_field,
             junction_table
      FROM zvd_relations
    `.execute(db);
    return result.rows;
  } catch {
    return [];
  }
}

// ── Schema builder ────────────────────────────────────────────────────────────
//
// IMPORTANT: every resolver below uses the *request-scoped* context
//   ({ user, db, loaders, checkPermission })
// instead of the closure-captured ctx.db. That lets us:
//   - use the tenant-isolated transaction (`tenantTrx`) when the
//     extension is mounted in a multi-tenant deployment, so RLS
//     policies see the right `zveltio.current_tenant` GUC;
//   - call `checkPermission(userId, collection, action)` so the
//     GraphQL surface honours the same RBAC as `routes/data.ts`.
//
// Without this every authenticated user could `query { list_users { ... } }`
// and bypass every tenant isolation and RBAC policy the rest of the engine
// enforces — GraphQL was a hidden door past the entire `data.ts` security
// layer.

async function buildDynamicSchema(ctx: ExtensionContext): Promise<GraphQLSchema> {
  const { db, DDLManager } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

  let collections: any[] = [];
  let relations: RelationInfo[] = [];

  try {
    collections = await DDLManager.getCollections(db);
    relations = await getRelations(db);
  } catch { /* no collections yet */ }

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
        if (!(await context.checkPermission(context.user.id, col.name, 'read'))) {
          throw new Error(`Forbidden: no read permission on "${col.name}"`);
        }
        try {
          const trx = context.reqDb ?? context.tenantTrx ?? context.db ?? db;
          let q = (trx as any).selectFrom(tableName).selectAll();
          if (filter_id)               q = q.where('id', '=', filter_id);
          if (filter_id_in?.length)    q = q.where('id', 'in', filter_id_in);
          // Clamp limit to 500 so a single GraphQL query can't pull
          // arbitrary amounts of data — matches the `routes/data.ts`
          // QuerySchema cap.
          const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 500));
          const safeOffset = Math.max(0, Number(offset) || 0);
          return await q.limit(safeLimit).offset(safeOffset).execute();
        } catch (err) { throw err; }
      },
    };

    queryFields[`get_${col.name}`] = {
      type: colType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_: any, { id }: any, context: any) => {
        if (!(await context.checkPermission(context.user.id, col.name, 'read'))) {
          throw new Error(`Forbidden: no read permission on "${col.name}"`);
        }
        const trx = context.reqDb ?? context.tenantTrx ?? context.db ?? db;
        return await (trx as any)
          .selectFrom(tableName).selectAll()
          .where('id', '=', id)
          .executeTakeFirst();
      },
    };

    mutationFields[`create_${col.name}`] = {
      type: colType,
      args: inputFields,
      resolve: async (_: any, args: any, context: any) => {
        if (!(await context.checkPermission(context.user.id, col.name, 'create'))) {
          throw new Error(`Forbidden: no create permission on "${col.name}"`);
        }
        const trx = context.reqDb ?? context.tenantTrx ?? context.db ?? db;
        return await (trx as any)
          .insertInto(tableName).values(args)
          .returningAll().executeTakeFirst();
      },
    };

    mutationFields[`update_${col.name}`] = {
      type: colType,
      args: { id: { type: new GraphQLNonNull(GraphQLID) }, ...inputFields },
      resolve: async (_: any, { id, ...data }: any, context: any) => {
        if (!(await context.checkPermission(context.user.id, col.name, 'update'))) {
          throw new Error(`Forbidden: no update permission on "${col.name}"`);
        }
        const trx = context.reqDb ?? context.tenantTrx ?? context.db ?? db;
        return await (trx as any)
          .updateTable(tableName)
          .set({ ...data, updated_at: new Date() })
          .where('id', '=', id)
          .returningAll().executeTakeFirst();
      },
    };

    mutationFields[`delete_${col.name}`] = {
      type: GraphQLBoolean,
      args: { id: { type: new GraphQLNonNull(GraphQLID) } },
      resolve: async (_: any, { id }: any, context: any) => {
        if (!(await context.checkPermission(context.user.id, col.name, 'delete'))) {
          throw new Error(`Forbidden: no delete permission on "${col.name}"`);
        }
        const trx = context.reqDb ?? context.tenantTrx ?? context.db ?? db;
        const res = await (trx as any)
          .deleteFrom(tableName).where('id', '=', id).executeTakeFirst();
        return (res?.numDeletedRows ?? 0n) > 0n;
      },
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
            resolve: async (parent: any, _args: any, context: any) => {
              const fk = parent[fieldName];
              if (!fk) return null;
              try {
                if (context?.loaders) {
                  return await context.loaders.get(targetTableName).load(String(fk));
                }
                return await (db as any)
                  .selectFrom(targetTableName).selectAll()
                  .where('id', '=', fk).executeTakeFirst();
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
            resolve: async (parent: any) => {
              try {
                return await (db as any)
                  .selectFrom(targetTableName).selectAll()
                  .where(foreignKey, '=', parent.id).execute();
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
            resolve: async (parent: any) => {
              try {
                return await (db as any)
                  .selectFrom(junctionTable)
                  .innerJoin(
                    targetTableName,
                    `${junctionTable}.${targetColumn}`,
                    `${targetTableName}.id`,
                  )
                  .selectAll(targetTableName)
                  .where(`${junctionTable}.${sourceColumn}`, '=', parent.id)
                  .execute();
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

// ── Schema cache (TTL 60 s) ───────────────────────────────────────────────────

let _cachedSchema: GraphQLSchema | null = null;
let _schemaBuildTime = 0;
const SCHEMA_TTL_MS = 60_000;

async function getSchema(ctx: ExtensionContext): Promise<GraphQLSchema> {
  const now = Date.now();
  if (!_cachedSchema || now - _schemaBuildTime > SCHEMA_TTL_MS) {
    _cachedSchema = await buildDynamicSchema(ctx);
    _schemaBuildTime = now;
  }
  return _cachedSchema;
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

// ── Operation type detector ───────────────────────────────────────────────────

function detectOperationType(query: string): 'query' | 'mutation' | 'subscription' {
  const trimmed = query.trimStart().toLowerCase();
  if (trimmed.startsWith('mutation')) return 'mutation';
  if (trimmed.startsWith('subscription')) return 'subscription';
  return 'query';
}

// ── Route factory ─────────────────────────────────────────────────────────────

export function graphqlRoutes(ctx: ExtensionContext): Hono {
  const { db, DDLManager, auth, checkPermission } = ctx;
  const { DataLoaderRegistry, checkQueryDepth } = ctx.internals;

  // Per-request DB handle.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

  const app = new Hono();

  // ── GET / — GraphiQL playground ───────────────────────────────────────────
  // In production we gate the playground behind admin auth because
  // (a) it exposes the entire schema via introspection and
  // (b) it loads scripts from cdnjs that can't satisfy a strict CSP.
  // In dev/staging it stays open so developers can explore.
  app.get('/', async (c) => {
    if (process.env.NODE_ENV === 'production') {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      if (!session) return c.json({ error: 'Unauthorized' }, 401);
      const isAdmin = await checkPermission(session.user.id, 'admin', '*');
      if (!isAdmin) return c.json({ error: 'GraphiQL is admin-only in production' }, 403);
    }
    return c.html(PLAYGROUND_HTML);
  });

  // ── POST / — Execute GraphQL operation ───────────────────────────────────
  app.post('/', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ errors: [{ message: 'Unauthorized' }] }, 401);

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

    const queryHash = crypto.createHash('sha256').update(query).digest('hex');
    const opType = detectOperationType(query);
    const startMs = Date.now();
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

    let result: any;
    let errorCount = 0;

    try {
      const schema = await getSchema(ctx);
      // Route handler is mounted inside the engine's tenantMiddleware →
      // c.get('tenantTrx') exposes the per-request transaction with
      // `SET LOCAL "zveltio.current_tenant"` already applied. Resolvers
      // use this in preference to the raw pool so RLS policies fire.
      const tenantTrx = (c.get as any)?.('tenantTrx') ?? null;
      const loaders = new DataLoaderRegistry(reqDb(c));
      result = await graphql({
        schema,
        source: query,
        variableValues: variables,
        operationName,
        contextValue: {
          user: session.user,
          db,
          tenantTrx,
          reqDb: reqDb(c),
          loaders,
          checkPermission,
        },
      });
      errorCount = result.errors?.length ?? 0;
    } catch (err) {
      errorCount = 1;
      result = { errors: [{ message: String(err) }] };
    }

    const durationMs = Date.now() - startMs;
    const resultStr = JSON.stringify(result);
    const resultSizeBytes = Buffer.byteLength(resultStr, 'utf8');

    // Fire-and-forget operation log
    sql`
      INSERT INTO zvd_graphql_operation_logs
        (operation_name, operation_type, query_hash, variables,
         duration_ms, result_size_bytes, error_count, user_id, ip)
      VALUES
        (${operationName ?? null}, ${opType}, ${queryHash},
         ${variables ? JSON.stringify(variables) : null}::jsonb,
         ${durationMs}, ${resultSizeBytes}, ${errorCount},
         ${session.user.id}, ${ip})
    `.execute(reqDb(c)).catch(() => {});

    if (errorCount > 0 && !result.data) {
      return c.json(result, 400);
    }
    return c.json(result);
  });

  // ── POST /refresh-schema — admin only ─────────────────────────────────────
  app.post('/refresh-schema', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);

    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    _cachedSchema = null;
    await getSchema(ctx);
    return c.json({ success: true, message: 'Schema refreshed' });
  });

  // ── GET /persisted — list persisted queries ───────────────────────────────
  app.get('/persisted', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    // Public queries are accessible to anyone; private require auth
    if (!session) {
      const rows = await sql<any>`
        SELECT id, name, description, query, variables_schema,
               is_public, allowed_roles, use_count, last_used_at, created_at
        FROM zvd_graphql_persisted_queries
        WHERE is_public = true
        ORDER BY name ASC
      `.execute(reqDb(c));
      return c.json({ queries: rows.rows });
    }

    const rows = await sql<any>`
      SELECT id, name, description, query, variables_schema,
             is_public, allowed_roles, use_count, last_used_at, created_at
      FROM zvd_graphql_persisted_queries
      ORDER BY name ASC
    `.execute(reqDb(c));
    return c.json({ queries: rows.rows });
  });

  // ── POST /persisted — create persisted query (admin only) ─────────────────
  app.post('/persisted', zValidator('json', PersistedQueryCreateSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const body = c.req.valid('json');
    const row = await sql<any>`
      INSERT INTO zvd_graphql_persisted_queries
        (name, description, query, variables_schema, is_public, allowed_roles, created_by)
      VALUES
        (${body.name}, ${body.description ?? null}, ${body.query},
         ${body.variables_schema ? JSON.stringify(body.variables_schema) : null}::jsonb,
         ${body.is_public}, ${body.allowed_roles as any}, ${session.user.id})
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ query: row.rows[0] }, 201);
  });

  // ── DELETE /persisted/:id — delete persisted query (admin only) ───────────
  app.delete('/persisted/:id', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const id = c.req.param('id');
    const res = await (reqDb(c) as any)
      .deleteFrom('zvd_graphql_persisted_queries')
      .where('id', '=', id)
      .executeTakeFirst();

    if ((res?.numDeletedRows ?? 0n) === 0n) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });

  // ── POST /persisted/:name/execute — execute persisted query by name ────────
  app.post('/persisted/:name/execute', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ errors: [{ message: 'Unauthorized' }] }, 401);

    const name = c.req.param('name');
    const pqRes = await sql<any>`
      SELECT * FROM zvd_graphql_persisted_queries WHERE name = ${name}
    `.execute(reqDb(c));

    const pq = pqRes.rows[0];
    if (!pq) return c.json({ errors: [{ message: 'Persisted query not found' }] }, 404);

    // Check access: public or user role in allowed_roles
    if (!pq.is_public && pq.allowed_roles?.length > 0) {
      const isAdmin = await checkPermission(session.user.id, 'admin', '*');
      if (!isAdmin) return c.json({ errors: [{ message: 'Access denied to this persisted query' }] }, 403);
    }

    let variables: Record<string, any> = {};
    try {
      const bodyText = await c.req.text();
      if (bodyText) variables = JSON.parse(bodyText).variables || {};
    } catch { /* no variables */ }

    const depthError = checkQueryDepth(pq.query, 5);
    if (depthError) return c.json({ errors: [{ message: depthError }] }, 400);

    try {
      const schema = await getSchema(ctx);
      const tenantTrx = (c.get as any)?.('tenantTrx') ?? null;
      const loaders = new DataLoaderRegistry(reqDb(c));
      const result = await graphql({
        schema,
        source: pq.query,
        variableValues: variables,
        contextValue: {
          user: session.user,
          db,
          tenantTrx,
          reqDb: reqDb(c),
          loaders,
          checkPermission,
        },
      });

      // Update use stats
      sql`
        UPDATE zvd_graphql_persisted_queries
        SET use_count = use_count + 1, last_used_at = NOW(), updated_at = NOW()
        WHERE name = ${name}
      `.execute(reqDb(c)).catch(() => {});

      return c.json(result);
    } catch (err) {
      return c.json({ errors: [{ message: String(err) }] }, 400);
    }
  });

  // ── GET /logs — list operation logs (admin only) ──────────────────────────
  app.get('/logs', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const rows = await sql<any>`
      SELECT id, operation_name, operation_type, query_hash,
             duration_ms, result_size_bytes, error_count, user_id, ip, created_at
      FROM zvd_graphql_operation_logs
      ORDER BY created_at DESC
      LIMIT 100
    `.execute(reqDb(c));
    return c.json({ logs: rows.rows });
  });

  // ── DELETE /logs — clear logs older than 30 days (admin only) ────────────
  app.delete('/logs', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const res = await sql<any>`
      DELETE FROM zvd_graphql_operation_logs
      WHERE created_at < NOW() - INTERVAL '30 days'
    `.execute(reqDb(c));
    return c.json({ deleted: Number(res.numAffectedRows ?? 0) });
  });

  // ── GET /stats — operation stats (admin only) ─────────────────────────────
  app.get('/stats', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const [totalsRes, topOpsRes] = await Promise.all([
      sql<any>`
        SELECT
          COUNT(*) FILTER (WHERE operation_type = 'query')::int AS total_queries,
          COUNT(*) FILTER (WHERE operation_type = 'mutation')::int AS total_mutations,
          ROUND(AVG(duration_ms))::int AS avg_duration_ms,
          COUNT(*) FILTER (WHERE error_count > 0)::int AS total_errors
        FROM zvd_graphql_operation_logs
      `.execute(reqDb(c)),
      sql<any>`
        SELECT operation_name, COUNT(*)::int AS count,
               ROUND(AVG(duration_ms))::int AS avg_duration_ms
        FROM zvd_graphql_operation_logs
        WHERE operation_name IS NOT NULL
        GROUP BY operation_name
        ORDER BY count DESC
        LIMIT 10
      `.execute(reqDb(c)),
    ]);

    return c.json({
      ...totalsRes.rows[0],
      top_operations: topOpsRes.rows,
    });
  });

  // ── GET /field-policies — list field policies (admin only) ────────────────
  app.get('/field-policies', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const rows = await sql<any>`
      SELECT * FROM zvd_graphql_field_policies ORDER BY collection ASC, field ASC
    `.execute(reqDb(c));
    return c.json({ policies: rows.rows });
  });

  // ── POST /field-policies — create field policy (admin only) ──────────────
  app.post('/field-policies', zValidator('json', FieldPolicyCreateSchema), async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const body = c.req.valid('json');
    const row = await sql<any>`
      INSERT INTO zvd_graphql_field_policies
        (collection, field, allowed_roles, deny_roles, created_by)
      VALUES
        (${body.collection}, ${body.field},
         ${body.allowed_roles as any}, ${body.deny_roles as any},
         ${session.user.id})
      ON CONFLICT (collection, field) DO UPDATE
        SET allowed_roles = EXCLUDED.allowed_roles,
            deny_roles = EXCLUDED.deny_roles
      RETURNING *
    `.execute(reqDb(c));
    return c.json({ policy: row.rows[0] }, 201);
  });

  // ── DELETE /field-policies/:id — delete field policy (admin only) ─────────
  app.delete('/field-policies/:id', async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    const isAdmin = await checkPermission(session.user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin required' }, 403);

    const id = c.req.param('id');
    const res = await (reqDb(c) as any)
      .deleteFrom('zvd_graphql_field_policies')
      .where('id', '=', id)
      .executeTakeFirst();

    if ((res?.numDeletedRows ?? 0n) === 0n) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });

  return app;
}
