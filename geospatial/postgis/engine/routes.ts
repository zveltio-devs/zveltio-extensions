import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';

async function getUser(c: any, auth: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

const SAFE_IDENTIFIER = /^[a-z][a-z0-9_]*$/i;

function safeRef(name: string): ReturnType<typeof sql.ref> {
  if (!SAFE_IDENTIFIER.test(name)) throw new Error(`Invalid field name: "${name}"`);
  return sql.ref(name);
}

function safeFieldList(fields: string[] | undefined): ReturnType<typeof sql.raw> | '*' {
  if (!fields || fields.length === 0) return sql.raw('*') as any;
  for (const f of fields) {
    if (!SAFE_IDENTIFIER.test(f)) throw new Error(`Invalid field name: "${f}"`);
  }
  return sql.raw(fields.map(f => `"${f}"`).join(', ')) as any;
}

async function resolveCollection(ctx: ExtensionContext, userId: string, collection: string): Promise<string | null> {
  const shortName = collection.startsWith('zvd_') ? collection.slice(4) : collection;
  if (!/^[a-z][a-z0-9_]*$/.test(shortName)) return null;
  const tableName = `zvd_${shortName}`;
  const exists = await sql<{ exists: boolean }>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = ${tableName}
    ) AS exists
  `.execute(ctx.db).then(r => r.rows[0]?.exists ?? false).catch(() => false);
  if (!exists) return null;
  const canRead = await (ctx.checkPermission as any)(userId, `data:${shortName}`, 'read').catch(() => false);
  if (!canRead) return null;
  return tableName;
}

const latLng = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

export function postgisRoutes(ctx: ExtensionContext): Hono {
  const { db, auth } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

  const app = new Hono();

  // ─── Proximity search ─────────────────────────────────────────

  app.post(
    '/near',
    zValidator('json', z.object({
      collection: z.string().min(1),
      location_field: z.string().default('location'),
      lat: z.number(),
      lng: z.number(),
      radius_meters: z.number().positive().default(1000),
      limit: z.number().int().positive().max(500).default(20),
      fields: z.array(z.string()).optional(),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { collection, location_field, lat, lng, radius_meters, limit, fields } = c.req.valid('json');
      const tableName = await resolveCollection(ctx, user.id, collection);
      if (!tableName) return c.json({ error: 'Collection not found or access denied' }, 403);

      let fieldListSql: any;
      try { fieldListSql = safeFieldList(fields); } catch (e: any) { return c.json({ error: e.message }, 400); }

      let locationRef: any;
      try { locationRef = safeRef(location_field); } catch (e: any) { return c.json({ error: e.message }, 400); }

      const records = await sql`
        SELECT ${fieldListSql},
               ST_Distance(${locationRef}::geography, ST_SetSRID(ST_MakePoint(${sql.lit(lng)}, ${sql.lit(lat)}), 4326)::geography) AS distance_meters
        FROM ${sql.id(tableName)}
        WHERE ST_DWithin(
          ${locationRef}::geography,
          ST_SetSRID(ST_MakePoint(${sql.lit(lng)}, ${sql.lit(lat)}), 4326)::geography,
          ${sql.lit(radius_meters)}
        )
        ORDER BY distance_meters ASC
        LIMIT ${sql.lit(limit)}
      `.execute(reqDb(c));

      return c.json({ records: records.rows, count: records.rows.length });
    },
  );

  app.post(
    '/within-bbox',
    zValidator('json', z.object({
      collection: z.string().min(1),
      location_field: z.string().default('location'),
      min_lat: z.number(), min_lng: z.number(),
      max_lat: z.number(), max_lng: z.number(),
      limit: z.number().int().positive().max(1000).default(100),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { collection, location_field, min_lat, min_lng, max_lat, max_lng, limit } = c.req.valid('json');
      const tableName = await resolveCollection(ctx, user.id, collection);
      if (!tableName) return c.json({ error: 'Collection not found or access denied' }, 403);

      let locationRef: any;
      try { locationRef = safeRef(location_field); } catch (e: any) { return c.json({ error: e.message }, 400); }

      const records = await sql`
        SELECT *
        FROM ${sql.id(tableName)}
        WHERE ${locationRef} && ST_SetSRID(ST_MakeEnvelope(${sql.lit(min_lng)}, ${sql.lit(min_lat)}, ${sql.lit(max_lng)}, ${sql.lit(max_lat)}, 4326), 4326)::geography
        LIMIT ${sql.lit(limit)}
      `.execute(reqDb(c));

      return c.json({ records: records.rows, count: records.rows.length });
    },
  );

  app.post(
    '/cluster',
    zValidator('json', z.object({
      collection: z.string().min(1),
      location_field: z.string().default('location'),
      eps_meters: z.number().positive().default(500),
      min_points: z.number().int().positive().default(3),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { collection, location_field, eps_meters, min_points } = c.req.valid('json');
      const tableName = await resolveCollection(ctx, user.id, collection);
      if (!tableName) return c.json({ error: 'Collection not found or access denied' }, 403);

      let locationRef: any;
      try { locationRef = safeRef(location_field); } catch (e: any) { return c.json({ error: e.message }, 400); }

      const result = await sql`
        WITH clustered AS (
          SELECT id, ${locationRef},
                 ST_ClusterDBSCAN(${locationRef}::geometry, ${sql.lit(eps_meters / 111000)}, ${sql.lit(min_points)})
                   OVER () AS cluster_id
          FROM ${sql.id(tableName)}
          WHERE ${locationRef} IS NOT NULL
        )
        SELECT cluster_id, COUNT(*) AS point_count,
               ST_AsGeoJSON(ST_Centroid(ST_Collect(${locationRef}::geometry)))::jsonb AS centroid
        FROM clustered
        GROUP BY cluster_id ORDER BY point_count DESC
      `.execute(reqDb(c));

      return c.json({ clusters: result.rows });
    },
  );

  // ─── Geofences ─────────────────────────────────────────────────

  app.get('/geofences', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const geofences = await reqDb(c)
      .selectFrom('zv_geofences')
      .select(['id', 'name', 'description', 'metadata', 'is_active', 'created_at'])
      .where('is_active', '=', true)
      .execute();

    return c.json({ geofences });
  });

  app.post(
    '/geofences',
    zValidator('json', z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
      metadata: z.record(z.string(), z.any()).default({}),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { name, description, coordinates, metadata } = c.req.valid('json');
      const geojson = JSON.stringify({ type: 'Polygon', coordinates });

      const geofence = await sql`
        INSERT INTO zv_geofences (name, description, zone, metadata)
        VALUES (${name}, ${description || null}, ST_GeographyFromText(ST_AsText(ST_GeomFromGeoJSON(${geojson}))), ${JSON.stringify(metadata)})
        RETURNING id, name, description, is_active, created_at
      `.execute(reqDb(c));

      return c.json({ geofence: geofence.rows[0] }, 201);
    },
  );

  app.delete('/geofences/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await reqDb(c).updateTable('zv_geofences').set({ is_active: false }).where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  app.post('/geofences/:id/contains', zValidator('json', latLng), async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { lat, lng } = c.req.valid('json');
    const result = await sql<{ contains: boolean }>`
      SELECT ST_Contains(zone::geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)) AS contains
      FROM zv_geofences WHERE id = ${c.req.param('id')}::uuid
    `.execute(reqDb(c));

    return c.json({ contains: result.rows[0]?.contains ?? false, lat, lng, geofence_id: c.req.param('id') });
  });

  // GET /geofences/:id/events
  app.get('/geofences/:id/events', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { entity_type, limit = '50' } = c.req.query();
    const events = await sql<any>`
      SELECT id, entity_type, entity_id, event_type, metadata, occurred_at
      FROM zv_geofence_events
      WHERE geofence_id = ${c.req.param('id')}::uuid
        ${entity_type ? sql`AND entity_type = ${entity_type}` : sql``}
      ORDER BY occurred_at DESC
      LIMIT ${parseInt(limit, 10)}
    `.execute(reqDb(c)).catch(() => ({ rows: [] }));

    return c.json({ events: events.rows });
  });

  // POST /geofences/:id/check-entities — batch check which entities are inside
  app.post(
    '/geofences/:id/check-entities',
    zValidator('json', z.object({
      collection: z.string().min(1),
      location_field: z.string().default('location'),
      limit: z.number().int().positive().max(500).default(100),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { collection, location_field, limit } = c.req.valid('json');
      const tableName = await resolveCollection(ctx, user.id, collection);
      if (!tableName) return c.json({ error: 'Collection not found or access denied' }, 403);

      let locationRef: any;
      try { locationRef = safeRef(location_field); } catch (e: any) { return c.json({ error: e.message }, 400); }

      const result = await sql`
        SELECT t.id, ST_AsGeoJSON(${locationRef}::geometry)::jsonb AS location
        FROM ${sql.id(tableName)} t
        JOIN zv_geofences g ON g.id = ${c.req.param('id')}::uuid
        WHERE ST_Within(${locationRef}::geometry, g.zone::geometry)
          AND ${locationRef} IS NOT NULL
        LIMIT ${sql.lit(limit)}
      `.execute(reqDb(c));

      return c.json({ entities_inside: result.rows, count: result.rows.length });
    },
  );

  // ─── Location history ──────────────────────────────────────────

  app.post(
    '/location-history',
    zValidator('json', z.object({
      entity_type: z.string().min(1),
      entity_id: z.string().min(1),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      accuracy_m: z.number().nonnegative().optional(),
      altitude_m: z.number().optional(),
      speed_kmh: z.number().nonnegative().optional(),
      heading_deg: z.number().min(0).max(360).optional(),
      source: z.enum(['api', 'gps', 'manual']).default('api'),
      metadata: z.record(z.string(), z.any()).default({}),
      recorded_at: z.string().datetime().optional(),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const point = `SRID=4326;POINT(${body.lng} ${body.lat})`;

      const entry = await sql<any>`
        INSERT INTO zv_geo_location_history
          (entity_type, entity_id, location, accuracy_m, altitude_m, speed_kmh, heading_deg, source, metadata, recorded_at)
        VALUES
          (${body.entity_type}, ${body.entity_id}, ${point}::geography,
           ${body.accuracy_m ?? null}, ${body.altitude_m ?? null},
           ${body.speed_kmh ?? null}, ${body.heading_deg ?? null},
           ${body.source}, ${JSON.stringify(body.metadata)},
           ${body.recorded_at ?? new Date().toISOString()})
        RETURNING id, entity_type, entity_id, recorded_at
      `.execute(reqDb(c));

      // Check geofence rules asynchronously
      sql<any>`
        SELECT g.id AS geofence_id, g.name,
               ST_Within(${point}::geometry, g.zone::geometry) AS inside
        FROM zv_geofences g WHERE g.is_active = true
      `.execute(reqDb(c)).then(async (fences: any) => {
        for (const fence of fences.rows) {
          await sql`
            INSERT INTO zv_geofence_events (geofence_id, entity_type, entity_id, event_type, location)
            SELECT ${fence.geofence_id}::uuid, ${body.entity_type}, ${body.entity_id},
                   CASE WHEN ${fence.inside} THEN 'enter' ELSE 'exit' END,
                   ${point}::geography
            WHERE NOT EXISTS (
              SELECT 1 FROM zv_geofence_events
              WHERE geofence_id = ${fence.geofence_id}::uuid
                AND entity_id = ${body.entity_id}
                AND event_type = CASE WHEN ${fence.inside} THEN 'enter' ELSE 'exit' END
                AND occurred_at > NOW() - INTERVAL '5 minutes'
            )
          `.execute(reqDb(c)).catch(() => {});
        }
      }).catch(() => {});

      return c.json({ location: entry.rows[0] }, 201);
    },
  );

  app.get('/location-history/:entityType/:entityId', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { limit = '100', from, to } = c.req.query();
    const history = await sql<any>`
      SELECT id, entity_type, entity_id,
             ST_AsGeoJSON(location::geometry)::jsonb AS location,
             accuracy_m, speed_kmh, heading_deg, source, recorded_at
      FROM zv_geo_location_history
      WHERE entity_type = ${c.req.param('entityType')}
        AND entity_id = ${c.req.param('entityId')}
        ${from ? sql`AND recorded_at >= ${from}::timestamptz` : sql``}
        ${to ? sql`AND recorded_at <= ${to}::timestamptz` : sql``}
      ORDER BY recorded_at DESC
      LIMIT ${parseInt(limit, 10)}
    `.execute(reqDb(c)).catch(() => ({ rows: [] }));

    return c.json({ history: history.rows });
  });

  // ─── Routes ────────────────────────────────────────────────────

  app.get('/routes', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const routes = await reqDb(c).selectFrom('zv_geo_routes')
      .select(['id', 'name', 'description', 'distance_m', 'metadata', 'created_at'])
      .where('is_active', '=', true)
      .orderBy('name', 'asc')
      .execute();

    return c.json({ routes });
  });

  app.post(
    '/routes',
    zValidator('json', z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      waypoints: z.array(z.object({ lat: z.number(), lng: z.number(), name: z.string().optional() })).min(2),
      metadata: z.record(z.string(), z.any()).default({}),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { name, description, waypoints, metadata } = c.req.valid('json');
      const pointsList = waypoints.map(w => `${w.lng} ${w.lat}`).join(',');
      const linestring = `SRID=4326;LINESTRING(${pointsList})`;

      const route = await sql<any>`
        INSERT INTO zv_geo_routes (name, description, waypoints, path, metadata, created_by)
        VALUES (${name}, ${description ?? null}, ${JSON.stringify(waypoints)},
                ${linestring}::geography, ${JSON.stringify(metadata)}, ${user.id})
        RETURNING id, name, description,
                  ST_Length(path) AS distance_m, created_at
      `.execute(reqDb(c));

      return c.json({ route: route.rows[0] }, 201);
    },
  );

  app.delete('/routes/:id', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await reqDb(c).updateTable('zv_geo_routes').set({ is_active: false }).where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // ─── Geofence rules ────────────────────────────────────────────

  app.get('/geofences/:id/rules', async (c) => {
    const user = await getUser(c, auth);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const rules = await sql<any>`
      SELECT * FROM zv_geofence_rules WHERE geofence_id = ${c.req.param('id')}::uuid ORDER BY created_at
    `.execute(reqDb(c)).catch(() => ({ rows: [] }));

    return c.json({ rules: rules.rows });
  });

  app.post(
    '/geofences/:id/rules',
    zValidator('json', z.object({
      name: z.string().min(1),
      trigger_on: z.enum(['enter', 'exit', 'both']),
      entity_type: z.string().optional(),
      action_type: z.enum(['webhook', 'notification', 'email']).default('webhook'),
      action_config: z.record(z.string(), z.any()).default({}),
    })),
    async (c) => {
      const user = await getUser(c, auth);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const rule = await sql<any>`
        INSERT INTO zv_geofence_rules (geofence_id, name, trigger_on, entity_type, action_type, action_config, created_by)
        VALUES (${c.req.param('id')}::uuid, ${body.name}, ${body.trigger_on},
                ${body.entity_type ?? null}, ${body.action_type}, ${JSON.stringify(body.action_config)}, ${user.id})
        RETURNING *
      `.execute(reqDb(c));

      return c.json({ rule: rule.rows[0] }, 201);
    },
  );

  return app;
}
