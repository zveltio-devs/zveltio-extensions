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
  max_critical_issues: z.number().int().min(0).default(0),
  max_error_issues: z.number().int().min(0).default(5),
  alert_email: z.string().email().optional(),
});

export function qualityRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission } = ctx;

  // `db` is `ctx.db`: a proxy the engine hands over that resolves the CURRENT
  // tenant transaction per query via AsyncLocalStorage (H-12). A plain `db` in
  // a handler is therefore already RLS-scoped — there is one spelling, so there
  // is none to forget.

  const { runQualityScan } = ctx.internals;

  // There is deliberately no quality score.
  //
  // There used to be one, computed from a formula nobody chose:
  // `(critical*10 + error*5 + warning*2 + info*0.5) / records * 100`. Measured on
  // a real instance, 4 warnings over 2 records deducted 400% and scored 0, while
  // the same 4 warnings over 100 records scored 92 — so the number said more
  // about how big a collection was than about how good its data were.
  //
  // It also never worked: the write was launched detached, slept two seconds and
  // landed on a closed transaction, so `zvd_quality_scores` was empty on every
  // installation that has ever existed. Nobody has ever seen one of these
  // numbers, which is the only reason it can be deleted rather than migrated.
  //
  // What is left is what can be defended: issue counts by severity, and SLA
  // thresholds expressed in those counts. "No critical issues" is a rule anyone
  // can argue for; "score at least 80" was not, because nobody could say what 80
  // meant.
  //
  // A score is worth having when someone CONFIGURES what it means — weights per
  // checklist item, several schemes over the same list, stored with the scheme
  // that produced them so history does not move when the weights do. That
  // belongs to workflow/checklists, not here, and it needs the master-detail
  // renderer before its configuration screen can exist.

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

    return c.json({ scan_id: scanId, message: 'Scan started' }, 202);
  });

  // GET /scans — recent scans across all collections (dashboard history)
  app.get('/scans', async (c) => {
    const scans = await (db as any)
      .selectFrom('zv_quality_scans')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(50)
      .execute();
    return c.json({ scans });
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
    const scan = await (db as any).selectFrom('zv_quality_scans').selectAll().where('id', '=', c.req.param('scanId')).executeTakeFirst();
    if (!scan) return c.json({ error: 'Scan not found' }, 404);
    return c.json({ scan });
  });

  // GET /scan/:scanId/issues
  app.get('/scan/:scanId/issues', async (c) => {
    const includeDismissed = c.req.query('dismissed') === 'true';
    let query = (db as any).selectFrom('zv_quality_issues').selectAll().where('scan_id', '=', c.req.param('scanId'));
    if (!includeDismissed) query = query.where('dismissed', '=', false);
    const issues = await query.orderBy('severity', 'asc').orderBy('created_at', 'asc').execute();
    return c.json({ issues });
  });

  // POST /issues/:id/dismiss
  app.post('/issues/:id/dismiss', async (c) => {
    const user = c.get('user') as any;
    await (db as any).updateTable('zv_quality_issues').set({ dismissed: true, dismissed_by: user.id, dismissed_at: new Date() }).where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // POST /scan/:scanId/dismiss-all
  app.post('/scan/:scanId/dismiss-all', async (c) => {
    const user = c.get('user') as any;
    await (db as any).updateTable('zv_quality_issues').set({ dismissed: true, dismissed_by: user.id, dismissed_at: new Date() }).where('scan_id', '=', c.req.param('scanId')).execute();
    return c.json({ success: true });
  });

  // GET /summary — admin only
  app.get('/summary', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Forbidden' }, 403);

    const [summary, latestScans] = await Promise.all([
      sql`SELECT i.collection, i.severity, COUNT(i.id) as count FROM zv_quality_issues i WHERE i.dismissed = false GROUP BY i.collection, i.severity`.execute(db).then(r => r.rows),
      (db as any)
        .selectFrom('zv_quality_scans')
        .select(['collection', 'status', 'issues_found', 'completed_at'])
        .distinctOn(['collection'])
        .orderBy('collection')
        .orderBy('started_at', 'desc')
        .execute()
        .catch(() => []),
    ]);

    return c.json({ summary, latest_scans: latestScans });
  });

  // ── Enterprise: Quality Rules ───────────────────────────────────

  app.get('/rules', async (c) => {
    const { collection } = c.req.query();
    let query = (db as any).selectFrom('zvd_quality_rules').selectAll().orderBy('created_at', 'desc');
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
    const rule = await (db as any).updateTable('zvd_quality_rules').set(updates).where('id', '=', c.req.param('id')).returningAll().executeTakeFirst();
    if (!rule) return c.json({ error: 'Rule not found' }, 404);
    return c.json({ rule });
  });

  app.delete('/rules/:id', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    await (db as any).deleteFrom('zvd_quality_rules').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // ── Enterprise: SLA Targets ─────────────────────────────────────

  app.get('/sla-targets', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    const targets = await (db as any).selectFrom('zvd_quality_sla_targets').selectAll().orderBy('collection', 'asc').execute();
    return c.json({ targets });
  });

  app.post('/sla-targets', zValidator('json', SlaTargetSchema), async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    const data = c.req.valid('json');
    const target = await (db as any)
      .insertInto('zvd_quality_sla_targets')
      .values({ ...data, created_by: user.id })
      // `(tenant_id, collection)`, not `collection`. The key was widened so two
      // companies on one instance can each set a target for a collection of the
      // same name; a conflict target that still named one column would have
      // matched no constraint and thrown at runtime. Missed by the sweep that
      // moved the SQL-text `ON CONFLICT (...)` clauses, because this one is
      // Kysely's builder form.
      .onConflict((oc: any) =>
        oc.columns(['tenant_id', 'collection']).doUpdateSet({
          max_critical_issues: data.max_critical_issues,
          max_error_issues: data.max_error_issues,
          alert_email: data.alert_email,
        }),
      )
      .returningAll()
      .executeTakeFirst();
    return c.json({ target }, 201);
  });

  app.delete('/sla-targets/:id', async (c) => {
    const user = c.get('user') as any;
    if (!(await checkPermission(user.id, 'admin', '*'))) return c.json({ error: 'Admin access required' }, 403);
    await (db as any).deleteFrom('zvd_quality_sla_targets').where('id', '=', c.req.param('id')).execute();
    return c.json({ success: true });
  });

  // POST /scan/:scanId/check-sla
  app.post('/scan/:scanId/check-sla', async (c) => {
    const user = c.get('user') as any;
    const scanId = c.req.param('scanId');

    const scan = await (db as any).selectFrom('zv_quality_scans').selectAll().where('id', '=', scanId).executeTakeFirst();
    if (!scan) return c.json({ error: 'Scan not found' }, 404);

    const target = await (db as any).selectFrom('zvd_quality_sla_targets').selectAll().where('collection', '=', scan.collection).where('is_active', '=', true).executeTakeFirst();
    if (!target) return c.json({ compliant: true, message: 'No SLA target configured for this collection' });

    const issues = await (db as any).selectFrom('zv_quality_issues').selectAll().where('scan_id', '=', scanId).where('dismissed', '=', false).execute();

    const criticalCount = issues.filter((i: any) => i.severity === 'critical').length;
    const errorCount = issues.filter((i: any) => i.severity === 'error').length;

    const breaches: string[] = [];
    if (criticalCount > target.max_critical_issues) breaches.push(`${criticalCount} critical issues exceeds max ${target.max_critical_issues}`);
    if (errorCount > target.max_error_issues) breaches.push(`${errorCount} error issues exceeds max ${target.max_error_issues}`);

    return c.json({
      compliant: breaches.length === 0,
      critical_count: criticalCount,
      error_count: errorCount,
      breaches,
      target: {
        max_critical_issues: target.max_critical_issues,
        max_error_issues: target.max_error_issues,
      },
    });
  });

  // ── Enterprise: Remediations ────────────────────────────────────

  app.get('/issues/:id/remediations', async (c) => {
    const remediations = await (db as any).selectFrom('zvd_quality_remediations').selectAll().where('issue_id', '=', c.req.param('id')).orderBy('created_at', 'desc').execute();
    return c.json({ remediations });
  });

  app.post('/issues/:id/remediations', zValidator('json', z.object({
    action_type: z.enum(['set_default','delete_record','manual_review','auto_fix']),
    description: z.string().min(1),
  })), async (c) => {
    const data = c.req.valid('json');
    const rem = await (db as any).insertInto('zvd_quality_remediations').values({ issue_id: c.req.param('id'), ...data }).returningAll().executeTakeFirst();
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

    const [scansCount, issuesByCollection, slaTargets] = await Promise.all([
      sql<{ count: string }>`SELECT COUNT(*)::text FROM zv_quality_scans WHERE created_at >= NOW() - INTERVAL '30 days'`.execute(db),
      sql<{ collection: string; total: string; dismissed: string }>`
        SELECT collection, COUNT(*)::text AS total, SUM(CASE WHEN dismissed THEN 1 ELSE 0 END)::text AS dismissed
        FROM zv_quality_issues GROUP BY collection ORDER BY total DESC LIMIT 10
      `.execute(db),
      (db as any)
        .selectFrom('zvd_quality_sla_targets')
        .select(['collection', 'max_critical_issues', 'max_error_issues', 'is_active'])
        .where('is_active', '=', true)
        .execute()
        .catch(() => []),
    ]);

    return c.json({
      scans_last_30_days: parseInt(scansCount.rows[0]?.count || '0'),
      issues_by_collection: issuesByCollection.rows,
      sla_targets: slaTargets,
    });
  });

  return app;
}
