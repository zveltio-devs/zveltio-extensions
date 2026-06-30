/**
 * Data Quality Dashboard — Enterprise Edition
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
const VALID_SCAN_TYPES = ['duplicates', 'anomalies', 'missing_data', 'normalization', 'full'];

const ScanSchema = z.object({
  collection: z.string().min(1),
  scan_type: z.enum(['duplicates', 'anomalies', 'missing_data', 'normalization', 'full']).default('full'),
});

const RuleSchema = z.object({
  name: z.string().min(1),
  collection: z.string().min(1),
  field_name: z.string().optional(),
  rule_type: z.enum(['not_null','unique','pattern','range','reference','custom']),
  rule_config: z.record(z.string(), z.any()).default({}),
  severity: z.enum(['info','warning','error','critical']).default('warning'),
});

const SlaTargetSchema = z.object({
  collection: z.string().min(1),
  min_score: z.number().int().min(0).max(100).default(80),
  max_critical_issues: z.number().int().min(0).default(0),
  max_error_issues: z.number().int().min(0).default(5),
  alert_email: z.string().email().optional(),
});

export function qualityRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission } = ctx;

  // Per-request DB handle (CRM PR #1 pattern). After
  // migration 002_tenant_rls.sql, this extension's tables have FORCE
  // RLS keyed on `zveltio.current_tenant`; routes must run through
  // this handle so the GUC is active inside the transaction.
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

  const { runQualityScan } = ctx.internals;

  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    return next();
  });

  // ── Existing routes ─────────────────────────────────────────────

  // POST /scan — start async scan
  app.post('/scan', zValidator('json', ScanSchema), async (c) => {
    const user = c.get('user') as any;
    const { collection, scan_type } = c.req.valid('json');

    const canRead = await checkPermission(user.id, collection, 'read');
    if (!canRead) return c.json({ error: 'Forbidden' }, 403);

    const scanId = await runQualityScan(db, collection, scan_type, user.id);

    // Calculate and store quality score after scan completes (fire-and-forget)
    const storeScore = async () => {
      try {
        await new Promise(r => setTimeout(r, 2000)); // brief wait for scan to progress
        const scan = await (reqDb(c) as any).selectFrom('zv_quality_scans').selectAll().where('id', '=', scanId).executeTakeFirst();
        if (!scan || scan.status !== 'completed') return;

        const issues = await (reqDb(c) as any).selectFrom('zv_quality_issues').selectAll().where('scan_id', '=', scanId).execute();
        const critical = issues.filter((i: any) => i.severity === 'critical').length;
        const error = issues.filter((i: any) => i.severity === 'error').length;
        const warning = issues.filter((i: any) => i.severity === 'warning').length;
        const info = issues.filter((i: any) => i.severity === 'info').length;
        const total = scan.total_records || 1;

        const deduction = (critical * 10 + error * 5 + warning * 2 + info * 0.5) / total * 100;
        const score = Math.max(0, Math.round(100 - deduction));

        await (reqDb(c) as any).insertInto('zvd_quality_scores')
          .values({ collection, scan_id: scanId, score, total_records: total, critical_count: critical, error_count: error, warning_count: warning, info_count: info })
          .execute();
      } catch { /* non-critical */ }
    };
    storeScore().catch(() => {});

    return c.json({ scan_id: scanId, message: 'Scan started' }, 202);
  });

  // GET /scans/:collection — list recent scans
  app.get('/scans/:collection', async (c) => {
    const collection = c.req.param('collection');
    const scans = await (db as any)
      .selectFrom('zv_quality_scans')
      .selectAll()
      .where('collection', '=', collection)
      .orderBy('started_at', 'desc')
      .limit(10)
      .execute();
    return c.json({ scans });
  });

  // GET /scan/:scanId — get scan status
  app.get('/scan/:scanId', async (c) => {
    const scan = await (reqDb(c) as any).selectFrom('zv_quality_scans').selectAll().where('id', '=', c.req.param('scanId')).executeTakeFirst();
    if (!scan) return c.json({ error: 'Scan not found' }, 404);
    return c.json({ scan });
  });

  // GET /scan/:scanId/issues
  app.get('/scan/:scanId/issues', async (c) => {
    const includeDismissed = c.req.query('dismissed') === 'true';
    let query = (reqDb(c) as any).selectFrom('zv_quality_issues').selectAll().where('scan_id', '=', c.req.param('scanId'));
    if (!includeDismissed) query = query.where('dismissed', '=', false);
    const issues = await query.orderBy('severity', 'asc').orderBy('created_at', 'asc').execute();
    return c.json({ issues });
  });

  // POST /issues/:id/dismiss
  app.post('/issues/:id/dismiss', async (c) => {
    const user = c.get('user') as any;
    await (reqDb(c) as any).updateTable('zv_quality_issues').set({ dismissed: true, dismissed_by: user.id, dismissed_at: new Date() }).where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // POST /scan/:scanId/dismiss-all
  app.post('/scan/:scanId/dismiss-all', async (c) => {
    const user = c.get('user') as any;
    await (reqDb(c) as any).updateTable('zv_quality_issues').set({ dismissed: true, dismissed_by: user.id, dismissed_at: new Date() }).where('scan_id', '=', c.req.param('scanId')).execute();
    return c.json({ success: true });
  });

  // GET /summary — admin only
  app.get('/summary', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Forbidden' }, 403);

    const [summary, latestScans, latestScores] = await Promise.all([
      sql`SELECT i.collection, i.severity, COUNT(i.id) as count FROM zv_quality_issues i WHERE i.dismissed = false GROUP BY i.collection, i.severity`.execute(reqDb(c)).then(r => r.rows),
      (db as any)
        .selectFrom('zv_quality_scans')
        .select(['collection', 'status', 'issues_found', 'completed_at'])
        .distinctOn(['collection'])
        .orderBy('collection')
        .orderBy('started_at', 'desc')
        .execute()
        .catch(() => []),
      (db as any)
        .selectFrom('zvd_quality_scores')
        .select(['collection', 'score', 'calculated_at'])
        .distinctOn(['collection'])
        .orderBy('collection')
        .orderBy('calculated_at', 'desc')
        .execute()
        .catch(() => []),
    ]);

    return c.json({ summary, latest_scans: latestScans, latest_scores: latestScores });
  });

  // ── Enterprise: Quality Rules ───────────────────────────────────

  app.get('/rules', async (c) => {
    const { collection } = c.req.query();
    let query = (reqDb(c) as any).selectFrom('zvd_quality_rules').selectAll().orderBy('created_at', 'desc');
    if (collection) query = query.where('collection', '=', collection);
    const rules = await query.execute();
    return c.json({ rules });
  });

  app.post('/rules', zValidator('json', RuleSchema), async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    const data = c.req.valid('json');
    const rule = await (db as any)
      .insertInto('zvd_quality_rules')
      .values({ ...data, rule_config: JSON.stringify(data.rule_config), created_by: user.id })
      .returningAll()
      .executeTakeFirst();
    return c.json({ rule }, 201);
  });

  app.patch('/rules/:id', zValidator('json', RuleSchema.partial()), async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    const data = c.req.valid('json');
    const updates: any = { ...data };
    if (data.rule_config) updates.rule_config = JSON.stringify(data.rule_config);
    const rule = await (reqDb(c) as any).updateTable('zvd_quality_rules').set(updates).where('id', '=', c.req.param('id')).returningAll().executeTakeFirst();
    if (!rule) return c.json({ error: 'Rule not found' }, 404);
    return c.json({ rule });
  });

  app.delete('/rules/:id', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    await (reqDb(c) as any).deleteFrom('zvd_quality_rules').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // ── Enterprise: Quality Scores ──────────────────────────────────

  app.get('/scores/:collection', async (c) => {
    const scores = await (db as any)
      .selectFrom('zvd_quality_scores')
      .selectAll()
      .where('collection', '=', c.req.param('collection'))
      .orderBy('calculated_at', 'desc')
      .limit(30)
      .execute();
    return c.json({ scores });
  });

  // ── Enterprise: SLA Targets ─────────────────────────────────────

  app.get('/sla-targets', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    const targets = await (reqDb(c) as any).selectFrom('zvd_quality_sla_targets').selectAll().orderBy('collection', 'asc').execute();
    return c.json({ targets });
  });

  app.post('/sla-targets', zValidator('json', SlaTargetSchema), async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    const data = c.req.valid('json');
    const target = await (db as any)
      .insertInto('zvd_quality_sla_targets')
      .values({ ...data, created_by: user.id })
      .onConflict((oc: any) => oc.column('collection').doUpdateSet({ min_score: data.min_score, max_critical_issues: data.max_critical_issues, max_error_issues: data.max_error_issues, alert_email: data.alert_email }))
      .returningAll()
      .executeTakeFirst();
    return c.json({ target }, 201);
  });

  app.delete('/sla-targets/:id', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    await (reqDb(c) as any).deleteFrom('zvd_quality_sla_targets').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // POST /scan/:scanId/check-sla
  app.post('/scan/:scanId/check-sla', async (c) => {
    const user = c.get('user') as any;
    const scanId = c.req.param('scanId');

    const scan = await (reqDb(c) as any).selectFrom('zv_quality_scans').selectAll().where('id', '=', scanId).executeTakeFirst();
    if (!scan) return c.json({ error: 'Scan not found' }, 404);

    const target = await (reqDb(c) as any).selectFrom('zvd_quality_sla_targets').selectAll().where('collection', '=', scan.collection).where('is_active', '=', true).executeTakeFirst();
    if (!target) return c.json({ compliant: true, message: 'No SLA target configured for this collection' });

    const score = await (reqDb(c) as any).selectFrom('zvd_quality_scores').selectAll().where('scan_id', '=', scanId).executeTakeFirst();
    const issues = await (reqDb(c) as any).selectFrom('zv_quality_issues').selectAll().where('scan_id', '=', scanId).where('dismissed', '=', false).execute();

    const criticalCount = issues.filter((i: any) => i.severity === 'critical').length;
    const errorCount = issues.filter((i: any) => i.severity === 'error').length;

    const breaches: string[] = [];
    if (score && score.score < target.min_score) breaches.push(`Quality score ${score.score} below minimum ${target.min_score}`);
    if (criticalCount > target.max_critical_issues) breaches.push(`${criticalCount} critical issues exceeds max ${target.max_critical_issues}`);
    if (errorCount > target.max_error_issues) breaches.push(`${errorCount} error issues exceeds max ${target.max_error_issues}`);

    return c.json({
      compliant: breaches.length === 0,
      score: score?.score ?? null,
      critical_count: criticalCount,
      error_count: errorCount,
      breaches,
      target: { min_score: target.min_score, max_critical_issues: target.max_critical_issues, max_error_issues: target.max_error_issues },
    });
  });

  // ── Enterprise: Remediations ────────────────────────────────────

  app.get('/issues/:id/remediations', async (c) => {
    const remediations = await (reqDb(c) as any).selectFrom('zvd_quality_remediations').selectAll().where('issue_id', '=', c.req.param('id')).orderBy('created_at', 'desc').execute();
    return c.json({ remediations });
  });

  app.post('/issues/:id/remediations', zValidator('json', z.object({
    action_type: z.enum(['set_default','delete_record','manual_review','auto_fix']),
    description: z.string().min(1),
  })), async (c) => {
    const data = c.req.valid('json');
    const rem = await (reqDb(c) as any).insertInto('zvd_quality_remediations').values({ issue_id: c.req.param('id'), ...data }).returningAll().executeTakeFirst();
    return c.json({ remediation: rem }, 201);
  });

  app.post('/issues/:id/remediations/:remId/apply', async (c) => {
    const user = c.get('user') as any;
    const updated = await (db as any)
      .updateTable('zvd_quality_remediations')
      .set({ applied_at: new Date(), applied_by: user.id, result: 'applied' })
      .where('id', '=', c.req.param('remId'))
      .returningAll()
      .executeTakeFirst();
    if (!updated) return c.json({ error: 'Remediation not found' }, 404);
    return c.json({ remediation: updated });
  });

  // ── Enhanced stats ──────────────────────────────────────────────

  app.get('/stats', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);

    const [scansCount, issuesByCollection, slaTargets, latestScores] = await Promise.all([
      sql<{ count: string }>`SELECT COUNT(*)::text FROM zv_quality_scans WHERE created_at >= NOW() - INTERVAL '30 days'`.execute(reqDb(c)),
      sql<{ collection: string; total: string; dismissed: string }>`
        SELECT collection, COUNT(*)::text AS total, SUM(CASE WHEN dismissed THEN 1 ELSE 0 END)::text AS dismissed
        FROM zv_quality_issues GROUP BY collection ORDER BY total DESC LIMIT 10
      `.execute(reqDb(c)),
      (reqDb(c) as any).selectFrom('zvd_quality_sla_targets').select(['collection', 'min_score', 'is_active']).where('is_active', '=', true).execute().catch(() => []),
      (db as any)
        .selectFrom('zvd_quality_scores')
        .select(['collection', 'score', 'calculated_at'])
        .distinctOn(['collection'])
        .orderBy('collection')
        .orderBy('calculated_at', 'desc')
        .execute()
        .catch(() => []),
    ]);

    return c.json({
      scans_last_30_days: parseInt(scansCount.rows[0]?.count || '0'),
      issues_by_collection: issuesByCollection.rows,
      sla_targets: slaTargets,
      latest_scores: latestScores,
    });
  });

  return app;
}
