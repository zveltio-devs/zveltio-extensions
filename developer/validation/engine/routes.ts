/**
 * Data Validation Rules — Enterprise Edition
 *
 * POST   /api/validation/generate                        — AI → structured rule (admin)
 * GET    /api/validation/groups                          — list rule groups (optional ?collection=)
 * POST   /api/validation/groups                          — create rule group (admin)
 * DELETE /api/validation/groups/:id                      — delete rule group (admin)
 * GET    /api/validation/:collection                     — list rules for collection
 * POST   /api/validation/:collection                     — add rule (admin, Zod validated)
 * PATCH  /api/validation/:collection/:id                 — toggle active (admin)
 * DELETE /api/validation/:collection/:id                 — delete rule (admin)
 * POST   /api/validation/:collection/:id/test-cases      — add test case (admin)
 * GET    /api/validation/:collection/:id/test-cases      — list test cases for a rule
 * DELETE /api/validation/:collection/:id/test-cases/:testId — delete test case
 * POST   /api/validation/:collection/:id/test-cases/run  — run all test cases for a rule
 * POST   /api/validation/:collection/bulk-test           — run all test cases in collection
 * POST   /api/validation/:collection/import              — bulk import rules from JSON array (admin)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
// ── Zod schemas ───────────────────────────────────────────────────────────────

const RULE_TYPES = [
  'required', 'minLength', 'maxLength', 'min', 'max',
  'email', 'url', 'pattern', 'range', 'nlp',
] as const;

const RuleConfigSchema = z.union([
  z.object({ value: z.number() }),                               // min, max, minLength, maxLength
  z.object({ pattern: z.string() }),                             // pattern
  z.object({ min: z.number(), max: z.number() }),                // range
  z.object({ expression: z.string() }),                          // nlp
  z.object({}).passthrough(),                                    // required / email / url (empty config)
]);

const RuleCreateSchema = z.object({
  field_name: z.string().min(1).max(100),
  rule_type: z.enum(RULE_TYPES),
  rule_config: RuleConfigSchema.default({}),
  error_message: z.string().min(1).max(500),
  nl_description: z.string().optional(),
});

const RuleUpdateSchema = z.object({
  is_active: z.boolean(),
});

const TestCaseCreateSchema = z.object({
  label: z.string().min(1).max(200),
  input_value: z.string(),
  expected_result: z.boolean(),
});

const RuleGroupCreateSchema = z.object({
  name: z.string().min(1).max(100),
  collection: z.string().min(1).max(100),
  field_name: z.string().min(1).max(100),
  description: z.string().optional(),
  logic: z.enum(['AND', 'OR']).default('AND'),
  rule_ids: z.array(z.string().uuid()),
  is_active: z.boolean().default(true),
});

const BulkImportRuleSchema = z.object({
  field_name: z.string().min(1).max(100),
  rule_type: z.enum(RULE_TYPES),
  rule_config: RuleConfigSchema.default({}),
  error_message: z.string().min(1).max(500),
  nl_description: z.string().optional(),
});

// ── Test runner ───────────────────────────────────────────────────────────────

function applyRule(ruleType: string, ruleConfig: any, inputValue: string): boolean {
  try {
    switch (ruleType) {
      case 'required':
        return inputValue !== '' && inputValue !== null && inputValue !== undefined;
      case 'minLength':
        return inputValue.length >= (ruleConfig.value ?? 0);
      case 'maxLength':
        return inputValue.length <= (ruleConfig.value ?? Infinity);
      case 'min':
        return Number(inputValue) >= (ruleConfig.value ?? -Infinity);
      case 'max':
        return Number(inputValue) <= (ruleConfig.value ?? Infinity);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputValue);
      case 'url':
        return /^https?:\/\//.test(inputValue);
      case 'pattern':
        return new RegExp(ruleConfig.pattern).test(inputValue);
      case 'range':
        return Number(inputValue) >= (ruleConfig.min ?? -Infinity)
          && Number(inputValue) <= (ruleConfig.max ?? Infinity);
      case 'nlp': {
        // Safe-ish evaluator: only 'value' in scope, wrapped in try/catch
        // eslint-disable-next-line no-new-func
        const result = new Function('value', `return ${ruleConfig.expression}`)(inputValue);
        return Boolean(result);
      }
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// ── Route factory ─────────────────────────────────────────────────────────────

export function validationRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission } = ctx;
  const { invalidateRulesCache } = ctx.internals;

  const app = new Hono();

  // ── Auth middleware ───────────────────────────────────────────────────────
  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    return next();
  });

  // ── POST /generate ────────────────────────────────────────────────────────
  // Convert NL description to structured rule (admin, must come before /:collection)
  app.post('/generate', async (c) => {
    const user = c.get('user');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const { collection, field_name, field_type, description } = await c.req.json();
    if (!description) return c.json({ error: 'description required' }, 400);

    const systemPrompt = `You are a validation rule generator for a BaaS platform.
Convert natural language validation descriptions into structured JSON rules.

Output ONLY valid JSON, no markdown, no explanation. Format:
{
  "rule_type": "required|min|max|minLength|maxLength|pattern|range|email|url|nlp",
  "rule_config": { ... },
  "error_message": "Human readable error in same language as input"
}

For range: rule_config = { "min": number, "max": number }
For min/max: rule_config = { "value": number }
For minLength/maxLength: rule_config = { "value": number }
For pattern: rule_config = { "pattern": "regex string" }
For nlp (complex): rule_config = { "expression": "JavaScript boolean expression using 'value'" }`;

    const userMessage = `Field: ${field_name} (type: ${field_type || 'text'})\nDescription: ${description}`;

    try {
      const { aiProviderManager } = await import('../../../../packages/engine/src/lib/ai-provider.js');
      const provider = aiProviderManager.getDefault();
      if (!provider) return c.json({ error: 'No AI provider configured' }, 503);

      const response = await provider.chat(
        [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
        { temperature: 0.2 },
      );

      const text = response.content || '';
      const parsed = JSON.parse(text.replace(/```json?|```/g, '').trim());

      return c.json({
        rule_type: parsed.rule_type,
        rule_config: parsed.rule_config,
        error_message: parsed.error_message,
        nl_description: description,
        preview: `If saved, this rule will enforce: ${parsed.error_message}`,
      });
    } catch (err) {
      return c.json({ error: 'AI generation failed', details: String(err) }, 500);
    }
  });

  // ── GET /groups ───────────────────────────────────────────────────────────
  // List rule groups (optional ?collection= filter) — must come before /:collection
  app.get('/groups', async (c) => {
    const collection = c.req.query('collection');
    const rows = collection
      ? await sql<any>`
          SELECT * FROM zvd_validation_rule_groups
          WHERE collection = ${collection}
          ORDER BY name ASC
        `.execute(db)
      : await sql<any>`
          SELECT * FROM zvd_validation_rule_groups
          ORDER BY collection ASC, name ASC
        `.execute(db);
    return c.json({ groups: rows.rows });
  });

  // ── POST /groups ──────────────────────────────────────────────────────────
  app.post('/groups', zValidator('json', RuleGroupCreateSchema), async (c) => {
    const user = c.get('user');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const body = c.req.valid('json');
    const row = await sql<any>`
      INSERT INTO zvd_validation_rule_groups
        (name, collection, field_name, description, logic, rule_ids, is_active, created_by)
      VALUES
        (${body.name}, ${body.collection}, ${body.field_name},
         ${body.description ?? null}, ${body.logic}, ${body.rule_ids as any},
         ${body.is_active}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ group: row.rows[0] }, 201);
  });

  // ── DELETE /groups/:id ────────────────────────────────────────────────────
  app.delete('/groups/:id', async (c) => {
    const user = c.get('user');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const id = c.req.param('id');
    const res = await (db as any)
      .deleteFrom('zvd_validation_rule_groups')
      .where('id', '=', id)
      .executeTakeFirst();

    if ((res?.numDeletedRows ?? 0n) === 0n) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });

  // ── GET /:collection — list rules ─────────────────────────────────────────
  app.get('/:collection', async (c) => {
    const collection = c.req.param('collection');
    const rules = await (db as any)
      .selectFrom('zv_validation_rules')
      .selectAll()
      .where('collection', '=', collection)
      .orderBy('field_name', 'asc')
      .execute();
    return c.json({ rules });
  });

  // ── POST /:collection — add rule ──────────────────────────────────────────
  app.post('/:collection', zValidator('json', RuleCreateSchema), async (c) => {
    const user = c.get('user');
    const collection = c.req.param('collection');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const body = c.req.valid('json');
    const rule = await (db as any)
      .insertInto('zv_validation_rules')
      .values({
        collection,
        field_name: body.field_name,
        rule_type: body.rule_type,
        nl_description: body.nl_description || null,
        rule_config: JSON.stringify(body.rule_config),
        error_message: body.error_message,
        is_active: true,
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirst();

    invalidateRulesCache(collection);
    return c.json({ rule }, 201);
  });

  // ── POST /:collection/bulk-test — run all test cases in collection ─────────
  // Must be registered BEFORE /:collection/:id to avoid route conflict
  app.post('/:collection/bulk-test', async (c) => {
    const collection = c.req.param('collection');

    // Fetch all rules with their test cases
    const rulesRes = await sql<any>`
      SELECT r.id AS rule_id, r.rule_type, r.rule_config,
             tc.id AS tc_id, tc.input_value, tc.expected_result, tc.label
      FROM zv_validation_rules r
      LEFT JOIN zvd_validation_test_cases tc ON tc.rule_id = r.id
      WHERE r.collection = ${collection}
    `.execute(db);

    interface TestResult {
      rule_id: string;
      test_case_id: string;
      label: string;
      input_value: string;
      expected: boolean;
      actual: boolean;
      passed: boolean;
    }

    const results: TestResult[] = [];
    const updatePromises: Promise<any>[] = [];

    for (const row of rulesRes.rows) {
      if (!row.tc_id) continue;
      const config = typeof row.rule_config === 'string'
        ? JSON.parse(row.rule_config)
        : row.rule_config;
      const actual = applyRule(row.rule_type, config, row.input_value);
      const passed = actual === row.expected_result;
      const now = new Date();

      results.push({
        rule_id: row.rule_id,
        test_case_id: row.tc_id,
        label: row.label,
        input_value: row.input_value,
        expected: row.expected_result,
        actual,
        passed,
      });

      updatePromises.push(
        sql`
          UPDATE zvd_validation_test_cases
          SET last_run_result = ${actual}, last_run_at = ${now}
          WHERE id = ${row.tc_id}
        `.execute(db).catch(() => {}),
      );
    }

    await Promise.all(updatePromises);

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    return c.json({ total, passed, failed: total - passed, results });
  });

  // ── POST /:collection/import — bulk import rules from JSON array (admin) ───
  app.post('/:collection/import', async (c) => {
    const user = c.get('user');
    const collection = c.req.param('collection');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    let rawRules: any[];
    try {
      const body = await c.req.json();
      rawRules = Array.isArray(body) ? body : body.rules;
      if (!Array.isArray(rawRules)) throw new Error('Expected JSON array');
    } catch (err: any) {
      return c.json({ error: `Invalid body: ${err.message}` }, 400);
    }

    let importedCount = 0;
    let failedCount = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < rawRules.length; i++) {
      const parsed = BulkImportRuleSchema.safeParse(rawRules[i]);
      if (!parsed.success) {
        failedCount++;
        errors.push({ index: i, error: parsed.error.message });
        continue;
      }

      const rule = parsed.data;
      try {
        await (db as any)
          .insertInto('zv_validation_rules')
          .values({
            collection,
            field_name: rule.field_name,
            rule_type: rule.rule_type,
            nl_description: rule.nl_description || null,
            rule_config: JSON.stringify(rule.rule_config),
            error_message: rule.error_message,
            is_active: true,
            created_by: user.id,
          })
          .execute();
        importedCount++;
      } catch (err: any) {
        failedCount++;
        errors.push({ index: i, error: err.message || 'Insert failed' });
      }
    }

    // Log import
    await sql`
      INSERT INTO zvd_validation_import_log
        (collection, imported_count, failed_count, errors, created_by)
      VALUES
        (${collection}, ${importedCount}, ${failedCount},
         ${JSON.stringify(errors)}::jsonb, ${user.id})
    `.execute(db).catch(() => {});

    if (importedCount > 0) invalidateRulesCache(collection);
    return c.json({ imported: importedCount, failed: failedCount, errors }, importedCount > 0 ? 201 : 422);
  });

  // ── PATCH /:collection/:id — toggle active ────────────────────────────────
  app.patch('/:collection/:id', zValidator('json', RuleUpdateSchema), async (c) => {
    const user = c.get('user');
    const collection = c.req.param('collection');
    const id = c.req.param('id');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const body = c.req.valid('json');
    const rule = await (db as any)
      .updateTable('zv_validation_rules')
      .set({ is_active: body.is_active, updated_at: new Date() })
      .where('id', '=', id)
      .where('collection', '=', collection)
      .returningAll()
      .executeTakeFirst();

    invalidateRulesCache(collection);
    return c.json({ rule });
  });

  // ── DELETE /:collection/:id — remove rule ─────────────────────────────────
  app.delete('/:collection/:id', async (c) => {
    const user = c.get('user');
    const collection = c.req.param('collection');
    const id = c.req.param('id');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    await (db as any).deleteFrom('zv_validation_rules').where('id', '=', id).execute();
    invalidateRulesCache(collection);
    return c.json({ success: true });
  });

  // ── POST /:collection/:id/test-cases/run — run all test cases for a rule ──
  // Must be registered BEFORE /:collection/:id/test-cases (POST) to avoid conflict
  app.post('/:collection/:id/test-cases/run', async (c) => {
    const id = c.req.param('id');

    const ruleRes = await sql<any>`
      SELECT id, rule_type, rule_config FROM zv_validation_rules WHERE id = ${id}
    `.execute(db);
    const rule = ruleRes.rows[0];
    if (!rule) return c.json({ error: 'Rule not found' }, 404);

    const casesRes = await sql<any>`
      SELECT * FROM zvd_validation_test_cases WHERE rule_id = ${id}
    `.execute(db);

    const config = typeof rule.rule_config === 'string'
      ? JSON.parse(rule.rule_config)
      : rule.rule_config;

    interface RunResult {
      id: string;
      label: string;
      input_value: string;
      expected: boolean;
      actual: boolean;
      passed: boolean;
    }

    const results: RunResult[] = [];
    const now = new Date();

    for (const tc of casesRes.rows) {
      const actual = applyRule(rule.rule_type, config, tc.input_value);
      const passed = actual === tc.expected_result;
      results.push({
        id: tc.id,
        label: tc.label,
        input_value: tc.input_value,
        expected: tc.expected_result,
        actual,
        passed,
      });

      await sql`
        UPDATE zvd_validation_test_cases
        SET last_run_result = ${actual}, last_run_at = ${now}
        WHERE id = ${tc.id}
      `.execute(db).catch(() => {});
    }

    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    return c.json({ total, passed, failed: total - passed, results });
  });

  // ── GET /:collection/:id/test-cases — list test cases for a rule ──────────
  app.get('/:collection/:id/test-cases', async (c) => {
    const id = c.req.param('id');
    const rows = await sql<any>`
      SELECT * FROM zvd_validation_test_cases
      WHERE rule_id = ${id}
      ORDER BY created_at ASC
    `.execute(db);
    return c.json({ test_cases: rows.rows });
  });

  // ── POST /:collection/:id/test-cases — add test case (admin) ─────────────
  app.post('/:collection/:id/test-cases', zValidator('json', TestCaseCreateSchema), async (c) => {
    const user = c.get('user');
    const id = c.req.param('id');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    // Verify rule exists
    const ruleRes = await sql<any>`
      SELECT id FROM zv_validation_rules WHERE id = ${id}
    `.execute(db);
    if (!ruleRes.rows[0]) return c.json({ error: 'Rule not found' }, 404);

    const body = c.req.valid('json');
    const row = await sql<any>`
      INSERT INTO zvd_validation_test_cases
        (rule_id, label, input_value, expected_result, created_by)
      VALUES
        (${id}, ${body.label}, ${body.input_value}, ${body.expected_result}, ${user.id})
      RETURNING *
    `.execute(db);
    return c.json({ test_case: row.rows[0] }, 201);
  });

  // ── DELETE /:collection/:id/test-cases/:testId — delete test case ─────────
  app.delete('/:collection/:id/test-cases/:testId', async (c) => {
    const user = c.get('user');
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    if (!isAdmin) return c.json({ error: 'Admin access required' }, 403);

    const testId = c.req.param('testId');
    const ruleId = c.req.param('id');
    const res = await (db as any)
      .deleteFrom('zvd_validation_test_cases')
      .where('id', '=', testId)
      .where('rule_id', '=', ruleId)
      .executeTakeFirst();

    if ((res?.numDeletedRows ?? 0n) === 0n) return c.json({ error: 'Not found' }, 404);
    return c.json({ success: true });
  });

  return app;
}
