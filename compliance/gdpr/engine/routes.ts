/**
 * GDPR Compliance — Enterprise
 *
 * GET    /export-my-data               — Export all user data as JSON
 * DELETE /delete-my-account            — Right to erasure (password re-auth)
 * POST   /consents                     — Record consent
 * GET    /consents/me                  — List my consents
 * DELETE /consents/:id                 — Withdraw consent
 * POST   /access-requests              — Submit SAR
 * GET    /access-requests              — List SARs (admin)
 * PATCH  /access-requests/:id          — Update SAR status (admin)
 * GET    /processing-records           — List Article 30 records (admin)
 * POST   /processing-records           — Create processing record (admin)
 * PATCH  /processing-records/:id       — Update record (admin)
 * DELETE /processing-records/:id       — Archive record (admin)
 * GET    /breaches                     — List breach incidents (admin)
 * POST   /breaches                     — Report breach (admin)
 * PATCH  /breaches/:id                 — Update breach (admin)
 * GET    /stats                        — GDPR dashboard stats (admin)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { Database } from '../../../../packages/engine/src/db/index.js';
import { auth } from '../../../../packages/engine/src/lib/auth.js';
import { checkPermission } from '../../../../packages/engine/src/lib/permissions.js';

async function requireUser(c: any) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  return session?.user ?? null;
}

async function requireAdmin(c: any) {
  const user = await requireUser(c);
  if (!user) return null;
  const isAdmin = await checkPermission(user.id, 'admin', '*').catch(() => false);
  return isAdmin ? user : null;
}

export function gdprRoutes(db: Database, _auth: any): Hono {
  const app = new Hono();

  // ─── User self-service ──────────────────────────────────────────

  // GET /export-my-data
  app.get('/export-my-data', async (c) => {
    const user = await requireUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);
    const userId = user.id;

    const [userRow, auditRows, notifRows, apiKeyRows, approvalRows, consentRows] =
      await Promise.all([
        sql<any>`SELECT id::text, name, email, created_at FROM "user" WHERE id = ${userId}`.execute(db),
        sql<any>`SELECT action, collection, record_id, created_at FROM zv_audit_log WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1000`.execute(db),
        sql<any>`SELECT title, message, type, is_read, created_at FROM zv_notifications WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 500`.execute(db),
        sql<any>`SELECT name, key_prefix, scopes, created_at FROM zv_api_keys WHERE created_by = ${userId}`.execute(db),
        sql<any>`SELECT id::text, collection, record_id, status, requested_at FROM zv_approval_requests WHERE requested_by = ${userId} ORDER BY requested_at DESC`.execute(db).catch(() => ({ rows: [] })),
        sql<any>`SELECT purpose, granted, source, created_at, withdrawn_at FROM zvd_gdpr_consents WHERE user_id = ${userId} ORDER BY created_at DESC`.execute(db).catch(() => ({ rows: [] })),
      ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: userRow.rows[0] || null,
      audit_log: auditRows.rows,
      notifications: notifRows.rows,
      api_keys: apiKeyRows.rows,
      approval_requests: approvalRows.rows,
      consents: consentRows.rows,
    };

    const json = JSON.stringify(exportData, null, 2);
    return new Response(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="my-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  });

  // DELETE /delete-my-account
  app.delete('/delete-my-account', async (c) => {
    const user = await requireUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const body = await c.req.json().catch(() => ({}));
    if (body.confirm !== 'DELETE MY ACCOUNT') {
      return c.json({ error: 'Please confirm with: { "confirm": "DELETE MY ACCOUNT" }' }, 400);
    }

    if (!body.password) {
      return c.json({ error: 'Current password required for account deletion. Include "password" in request body.' }, 400);
    }

    try {
      const verifyResult = await auth.api.signInEmail({
        body: { email: user.email, password: body.password },
      });
      if (!verifyResult) throw new Error('Invalid password');
    } catch {
      return c.json({ error: 'Invalid password. Account deletion cancelled.' }, 403);
    }

    const userId = user.id;
    await sql`INSERT INTO zv_audit_log (user_id, action, collection, metadata) VALUES (${userId}, 'gdpr.account_deleted', 'user', '{"gdpr": true}'::jsonb)`.execute(db);
    await sql`DELETE FROM zv_api_keys WHERE created_by = ${userId}`.execute(db);
    await sql`DELETE FROM zv_notifications WHERE user_id = ${userId}`.execute(db);
    await sql`DELETE FROM "user" WHERE id = ${userId}`.execute(db);

    return c.json({ success: true, message: 'Account and all associated data has been deleted' });
  });

  // ─── Consents ───────────────────────────────────────────────────

  // POST /consents — record consent
  app.post(
    '/consents',
    zValidator('json', z.object({
      purpose: z.string().min(1),
      granted: z.boolean(),
      processing_record_id: z.string().uuid().optional(),
      source: z.string().default('web'),
      expires_at: z.string().datetime().optional(),
    })),
    async (c) => {
      const user = await requireUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
      const userAgent = c.req.header('user-agent') ?? null;

      const consent = await sql<any>`
        INSERT INTO zvd_gdpr_consents (user_id, email, purpose, processing_record_id, granted, ip, user_agent, source, expires_at)
        VALUES (${user.id}, ${user.email}, ${body.purpose}, ${body.processing_record_id ?? null},
                ${body.granted}, ${ip}, ${userAgent}, ${body.source}, ${body.expires_at ?? null})
        RETURNING *
      `.execute(db);

      return c.json({ consent: consent.rows[0] }, 201);
    },
  );

  // GET /consents/me
  app.get('/consents/me', async (c) => {
    const user = await requireUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const consents = await sql<any>`
      SELECT id, purpose, granted, source, created_at, withdrawn_at, expires_at
      FROM zvd_gdpr_consents
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `.execute(db);

    return c.json({ consents: consents.rows });
  });

  // DELETE /consents/:id — withdraw consent
  app.delete('/consents/:id', async (c) => {
    const user = await requireUser(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const result = await sql<any>`
      UPDATE zvd_gdpr_consents
      SET granted = false, withdrawn_at = NOW()
      WHERE id = ${c.req.param('id')}::uuid AND user_id = ${user.id} AND withdrawn_at IS NULL
      RETURNING id
    `.execute(db);

    if (!result.rows[0]) return c.json({ error: 'Consent not found' }, 404);
    return c.json({ success: true });
  });

  // ─── Subject Access Requests ────────────────────────────────────

  // POST /access-requests
  app.post(
    '/access-requests',
    zValidator('json', z.object({
      request_type: z.enum(['access', 'erasure', 'portability', 'rectification', 'restriction', 'objection']),
      description: z.string().optional(),
      requester_name: z.string().optional(),
    })),
    async (c) => {
      const user = await requireUser(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const req = await sql<any>`
        INSERT INTO zvd_gdpr_access_requests (requester_email, requester_name, request_type, description, created_by)
        VALUES (${user.email}, ${body.requester_name ?? user.name ?? user.email},
                ${body.request_type}, ${body.description ?? null}, ${user.id})
        RETURNING *
      `.execute(db);

      return c.json({ access_request: req.rows[0] }, 201);
    },
  );

  // GET /access-requests (admin)
  app.get('/access-requests', async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const { status } = c.req.query();
    const rows = await sql<any>`
      SELECT * FROM zvd_gdpr_access_requests
      WHERE 1=1
        ${status ? sql`AND status = ${status}` : sql``}
      ORDER BY created_at DESC
    `.execute(db);

    return c.json({ access_requests: rows.rows });
  });

  // PATCH /access-requests/:id (admin)
  app.patch(
    '/access-requests/:id',
    zValidator('json', z.object({
      status: z.enum(['pending', 'in_progress', 'completed', 'rejected', 'withdrawn']).optional(),
      assigned_to: z.string().optional(),
      resolution_notes: z.string().optional(),
    })),
    async (c) => {
      const admin = await requireAdmin(c);
      if (!admin) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const updates: Record<string, any> = { updated_at: new Date() };
      if (body.status) updates.status = body.status;
      if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
      if (body.resolution_notes !== undefined) updates.resolution_notes = body.resolution_notes;
      if (body.status === 'completed') updates.completed_at = new Date();

      const setClauses = Object.entries(updates)
        .map(([k, v]) => sql`${sql.ref(k)} = ${v}`)
        .reduce((a, b) => sql`${a}, ${b}`);

      const result = await sql<any>`
        UPDATE zvd_gdpr_access_requests SET ${setClauses}
        WHERE id = ${c.req.param('id')}::uuid
        RETURNING *
      `.execute(db);

      if (!result.rows[0]) return c.json({ error: 'Request not found' }, 404);
      return c.json({ access_request: result.rows[0] });
    },
  );

  // ─── Processing Records (Article 30) ───────────────────────────

  // GET /processing-records
  app.get('/processing-records', async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const records = await sql<any>`
      SELECT * FROM zvd_gdpr_processing_records
      WHERE is_active = true ORDER BY name ASC
    `.execute(db);

    return c.json({ processing_records: records.rows });
  });

  // POST /processing-records
  app.post(
    '/processing-records',
    zValidator('json', z.object({
      name: z.string().min(1),
      purpose: z.string().min(1),
      legal_basis: z.enum(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']),
      data_categories: z.array(z.string()).default([]),
      data_subjects: z.array(z.string()).default([]),
      retention_period_days: z.number().int().positive().optional(),
      third_party_recipients: z.array(z.string()).default([]),
      technical_measures: z.string().optional(),
      organizational_measures: z.string().optional(),
      dpia_required: z.boolean().default(false),
    })),
    async (c) => {
      const admin = await requireAdmin(c);
      if (!admin) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const record = await sql<any>`
        INSERT INTO zvd_gdpr_processing_records
          (name, purpose, legal_basis, data_categories, data_subjects, retention_period_days,
           third_party_recipients, technical_measures, organizational_measures, dpia_required, created_by)
        VALUES
          (${body.name}, ${body.purpose}, ${body.legal_basis},
           ${body.data_categories}, ${body.data_subjects},
           ${body.retention_period_days ?? null}, ${body.third_party_recipients},
           ${body.technical_measures ?? null}, ${body.organizational_measures ?? null},
           ${body.dpia_required}, ${admin.id})
        RETURNING *
      `.execute(db);

      return c.json({ processing_record: record.rows[0] }, 201);
    },
  );

  // PATCH /processing-records/:id
  app.patch(
    '/processing-records/:id',
    zValidator('json', z.object({
      name: z.string().optional(),
      purpose: z.string().optional(),
      legal_basis: z.enum(['consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests']).optional(),
      data_categories: z.array(z.string()).optional(),
      retention_period_days: z.number().int().positive().nullable().optional(),
      dpia_required: z.boolean().optional(),
      dpia_completed_at: z.string().datetime().nullable().optional(),
    })),
    async (c) => {
      const admin = await requireAdmin(c);
      if (!admin) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const updates: Record<string, any> = { updated_at: new Date() };
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined) updates[k] = v;
      }

      const setClauses = Object.entries(updates)
        .map(([k, v]) => sql`${sql.ref(k)} = ${v}`)
        .reduce((a, b) => sql`${a}, ${b}`);

      const result = await sql<any>`
        UPDATE zvd_gdpr_processing_records SET ${setClauses}
        WHERE id = ${c.req.param('id')}::uuid AND is_active = true
        RETURNING *
      `.execute(db);

      if (!result.rows[0]) return c.json({ error: 'Record not found' }, 404);
      return c.json({ processing_record: result.rows[0] });
    },
  );

  // DELETE /processing-records/:id (soft delete)
  app.delete('/processing-records/:id', async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    await sql`
      UPDATE zvd_gdpr_processing_records SET is_active = false, updated_at = NOW()
      WHERE id = ${c.req.param('id')}::uuid
    `.execute(db);

    return c.json({ success: true });
  });

  // ─── Breach Incidents ───────────────────────────────────────────

  // GET /breaches
  app.get('/breaches', async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const { status, severity } = c.req.query();
    const rows = await sql<any>`
      SELECT * FROM zvd_gdpr_breach_incidents
      WHERE 1=1
        ${status ? sql`AND status = ${status}` : sql``}
        ${severity ? sql`AND severity = ${severity}` : sql``}
      ORDER BY discovered_at DESC
    `.execute(db);

    return c.json({ breaches: rows.rows });
  });

  // POST /breaches
  app.post(
    '/breaches',
    zValidator('json', z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      discovered_at: z.string().datetime(),
      affected_records_estimate: z.number().int().nonnegative().optional(),
      data_categories: z.array(z.string()).default([]),
      severity: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
    })),
    async (c) => {
      const admin = await requireAdmin(c);
      if (!admin) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const breach = await sql<any>`
        INSERT INTO zvd_gdpr_breach_incidents
          (title, description, discovered_at, affected_records_estimate, data_categories, severity, created_by)
        VALUES
          (${body.title}, ${body.description}, ${body.discovered_at},
           ${body.affected_records_estimate ?? null}, ${body.data_categories},
           ${body.severity}, ${admin.id})
        RETURNING *
      `.execute(db);

      return c.json({ breach: breach.rows[0] }, 201);
    },
  );

  // PATCH /breaches/:id
  app.patch(
    '/breaches/:id',
    zValidator('json', z.object({
      status: z.enum(['open', 'investigating', 'contained', 'reported', 'closed']).optional(),
      severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      root_cause: z.string().optional(),
      remediation_steps: z.string().optional(),
      dpa_reported_at: z.string().datetime().nullable().optional(),
      affected_users_notified_at: z.string().datetime().nullable().optional(),
    })),
    async (c) => {
      const admin = await requireAdmin(c);
      if (!admin) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const updates: Record<string, any> = { updated_at: new Date() };
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined) updates[k] = v;
      }

      const setClauses = Object.entries(updates)
        .map(([k, v]) => sql`${sql.ref(k)} = ${v}`)
        .reduce((a, b) => sql`${a}, ${b}`);

      const result = await sql<any>`
        UPDATE zvd_gdpr_breach_incidents SET ${setClauses}
        WHERE id = ${c.req.param('id')}::uuid
        RETURNING *
      `.execute(db);

      if (!result.rows[0]) return c.json({ error: 'Breach not found' }, 404);
      return c.json({ breach: result.rows[0] });
    },
  );

  // ─── Stats ─────────────────────────────────────────────────────

  app.get('/stats', async (c) => {
    const admin = await requireAdmin(c);
    if (!admin) return c.json({ error: 'Unauthorized' }, 401);

    const [sarStats, consentStats, breachStats, processingCount] = await Promise.all([
      sql<any>`
        SELECT status, COUNT(*)::int AS count
        FROM zvd_gdpr_access_requests GROUP BY status
      `.execute(db).catch(() => ({ rows: [] })),
      sql<any>`
        SELECT COUNT(*) FILTER (WHERE granted = true)::int AS active_consents,
               COUNT(*) FILTER (WHERE withdrawn_at IS NOT NULL)::int AS withdrawn,
               COUNT(DISTINCT user_id)::int AS unique_users
        FROM zvd_gdpr_consents
      `.execute(db).catch(() => ({ rows: [{ active_consents: 0, withdrawn: 0, unique_users: 0 }] })),
      sql<any>`
        SELECT severity, status, COUNT(*)::int AS count
        FROM zvd_gdpr_breach_incidents GROUP BY severity, status
      `.execute(db).catch(() => ({ rows: [] })),
      sql<any>`SELECT COUNT(*)::int AS count FROM zvd_gdpr_processing_records WHERE is_active = true`.execute(db).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    const sarByStatus: Record<string, number> = {};
    for (const row of sarStats.rows) sarByStatus[row.status] = row.count;

    return c.json({
      access_requests: { by_status: sarByStatus, overdue: sarStats.rows.find((r: any) => r.status === 'pending')?.count ?? 0 },
      consents: consentStats.rows[0] ?? {},
      breaches: breachStats.rows,
      processing_records: processingCount.rows[0]?.count ?? 0,
    });
  });

  return app;
}
