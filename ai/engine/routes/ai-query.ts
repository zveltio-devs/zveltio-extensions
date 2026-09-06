import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { Database } from '@zveltio/engine-db';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { aiProviderManager } from '../lib/ai-provider.js';
// The validator and the read-only window live in lib/sql-guard.ts so the
// assistant's execute_sql / text_to_sql tools use the SAME ones. They had
// neither. See the header of that file.
import { runReadOnly, validateGeneratedSQL } from '../lib/sql-guard.js';

const QuerySchema = z.object({
  prompt: z.string().min(3).max(2000),
  analyze: z.boolean().default(true),
  chart: z.boolean().default(false),
  limit: z.number().min(1).max(10000).default(500),
});

/**
 * Text-to-SQL: natural language → PostgreSQL SELECT → optional AI analysis.
 * Mounted at /ext/ai/query
 */
export function aiQueryRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, DDLManager } = ctx;
  const app = new Hono();

  app.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401);
    c.set('user', session.user);
    await next();
  });

  // POST /ext/ai/query
  app.post('/', zValidator('json', QuerySchema), async (c) => {
    const user = c.get('user') as any;
    const { prompt, analyze, chart, limit } = c.req.valid('json');

    const provider = aiProviderManager.getDefault();
    if (!provider?.chat) {
      return c.json({ error: 'No AI provider configured' }, 503);
    }

    const start = Date.now();

    try {
      // Build schema context — only collections the user can read
      const allCollections = await DDLManager.getCollections(db);
      const accessibleCollections: any[] = [];

      for (const col of allCollections) {
        const canRead = await checkPermission(user.id, col.name, 'read');
        if (canRead) accessibleCollections.push(col);
      }

      if (accessibleCollections.length === 0) {
        return c.json({ error: 'No collections accessible' }, 403);
      }

      const schemaContext = accessibleCollections.map((col) => {
        const fields = typeof col.fields === 'string' ? JSON.parse(col.fields) : (col.fields ?? []);
        const fieldList = fields
          .map((f: any) => `${f.name} (${f.type}${f.required ? ', required' : ''})`)
          .join(', ');
        return `Table: zvd_${col.name} (${col.display_name || col.name})\n  Fields: id (uuid, PK), ${fieldList}, created_at (timestamp), updated_at (timestamp), status (text), created_by (uuid)`;
      }).join('\n\n');

      // Generate SQL
      const sqlResult = await provider.chat([
        {
          role: 'system',
          content: `You are a PostgreSQL expert for Zveltio BaaS.
Generate a single SELECT query based on the user's question.

RULES:
- Use ONLY the tables and columns listed below
- All user tables are prefixed with zvd_ (e.g. zvd_products, zvd_orders)
- System tables start with zv_ — NEVER query these
- Always use double quotes for column names that might be reserved words
- Always add LIMIT ${limit} unless the user asks for all data
- For aggregations, always include meaningful column aliases
- For date filtering, use ISO format and TIMESTAMPTZ comparisons
- Return ONLY the SQL query, no explanation, no markdown, no backticks

AVAILABLE SCHEMA:
${schemaContext}

CURRENT TIMESTAMP: ${new Date().toISOString()}`,
        },
        { role: 'user', content: prompt },
      ], { temperature: 0.1, max_tokens: 1000 });

      let generatedSQL = (sqlResult.content || '').trim();
      generatedSQL = generatedSQL.replace(/^```sql?\n?/i, '').replace(/\n?```$/i, '').trim();

      // Security validation
      const validation = validateGeneratedSQL(generatedSQL, accessibleCollections);
      if (!validation.safe) {
        await logQuery(db, user.id, prompt, generatedSQL, null, null, null, null, validation.reason!);
        return c.json({ error: `Unsafe query: ${validation.reason}` }, 400);
      }

      const execStart = Date.now();
      const result = await runReadOnly(db, generatedSQL);
      const executionMs = Date.now() - execStart;
      const rows = result.rows as any[];

      // Optional AI analysis
      let analysis: string | null = null;
      let chartConfig: any = null;

      if (analyze && rows.length > 0) {
        const sampleData = rows.slice(0, 20);
        const analysisResult = await provider.chat([
          { role: 'system', content: 'You are a data analyst. Be concise and actionable.' },
          {
            role: 'user',
            content: `Analyze these query results and provide insights.

User's question: "${prompt}"
Row count: ${rows.length}
Sample data (first ${sampleData.length} rows):
${JSON.stringify(sampleData, null, 2)}

Provide:
1. A brief summary (2-3 sentences)
2. Key insights or trends (bullet points)
3. Actionable recommendations if relevant
${chart ? '\n4. Suggest a chart config JSON: { "type": "bar"|"line"|"pie"|"area", "xField": "...", "yField": "...", "title": "..." }' : ''}

Respond in the same language as the user's question.`,
          },
        ], { temperature: 0.3, max_tokens: 1000 });

        analysis = analysisResult.content || null;

        if (chart && analysis) {
          const chartMatch = analysis.match(/\{[^}]*"type"\s*:\s*"(bar|line|pie|area)"[^}]*\}/);
          if (chartMatch) {
            try { chartConfig = JSON.parse(chartMatch[0]); } catch { /* ignore */ }
          }
        }
      }

      await logQuery(db, user.id, prompt, generatedSQL, rows.length, executionMs, analysis, chartConfig, null);

      return c.json({
        prompt,
        sql: generatedSQL,
        results: rows,
        count: rows.length,
        execution_ms: executionMs,
        analysis,
        chart: chartConfig,
        total_ms: Date.now() - start,
      });

    } catch (err: any) {
      const msg = err.message || String(err);
      await logQuery(db, user.id, prompt, null, null, null, null, null, msg);
      return c.json({ error: 'Query failed', details: msg }, 500);
    }
  });

  // GET /ext/ai/query/history
  app.get('/history', async (c) => {
    const user = c.get('user') as any;
    const { saved_only } = c.req.query();

    const savedFilter = saved_only === 'true' ? sql`AND is_saved = true` : sql``;
    const rows = await sql`
      SELECT id, prompt, generated_sql, result_count, execution_ms, ai_analysis, is_saved, title, error, created_at
      FROM zv_ai_queries WHERE user_id = ${user.id}
      ${savedFilter}
      ORDER BY created_at DESC LIMIT 50
    `.execute(db);
    return c.json({ queries: rows.rows });
  });

  // PATCH /ext/ai/query/:id/save
  app.patch('/:id/save', zValidator('json', z.object({ title: z.string().min(1) })), async (c) => {
    const user = c.get('user') as any;
    await sql`
      UPDATE zv_ai_queries SET is_saved = true, title = ${c.req.valid('json').title}
      WHERE id = ${c.req.param('id')} AND user_id = ${user.id}
    `.execute(db);
    return c.json({ success: true });
  });

  // DELETE /ext/ai/query/:id
  app.delete('/:id', async (c) => {
    const user = c.get('user') as any;
    await sql`DELETE FROM zv_ai_queries WHERE id = ${c.req.param('id')} AND user_id = ${user.id}`.execute(db);
    return c.json({ success: true });
  });

  // POST /ext/ai/query/:id/rerun
  app.post('/:id/rerun', async (c) => {
    const user = c.get('user') as any;
    const saved = await sql`
      SELECT prompt, generated_sql FROM zv_ai_queries
      WHERE id = ${c.req.param('id')} AND user_id = ${user.id}
    `.execute(db);
    if (!saved.rows[0]) return c.json({ error: 'Query not found' }, 404);

    const { generated_sql } = saved.rows[0] as any;

    // Re-validate stored SQL — the stored query may have been tampered with or
    // the user's accessible collections may have changed since it was saved.
    // The resource is the bare collection name, as it is on the generate path
    // above and as migration 034 writes it into `zvd_permissions`. This asked for
    // `data:<name>`, a namespace no policy uses, so nothing ever matched: for
    // every user who is not `god`, `accessibleCollections` came back empty and
    // re-running a query they had just run successfully answered
    // `No access to table "zvd_…"`.
    const allCollections = await DDLManager.getCollections(db);
    const accessibleCollections: any[] = [];
    for (const col of allCollections) {
      const canRead = await checkPermission(user.id, col.name, 'read');
      if (canRead) accessibleCollections.push(col);
    }

    const validation = validateGeneratedSQL(generated_sql, accessibleCollections);
    if (!validation.safe) {
      return c.json({ error: `Unsafe stored query: ${validation.reason}` }, 400);
    }

    const execStart = Date.now();
    const result = await runReadOnly(db, generated_sql);
    return c.json({
      results: result.rows,
      count: (result.rows as any[]).length,
      execution_ms: Date.now() - execStart,
    });
  });

  return app;
}

async function logQuery(
  db: Database,
  userId: string,
  prompt: string,
  generatedSql: string | null,
  resultCount: number | null,
  executionMs: number | null,
  analysis: string | null,
  chartConfig: any,
  error: string | null,
): Promise<void> {
  // Named on failure. This was `.catch(() => {})`, which is how the history
  // stayed empty for as long as `SET TRANSACTION READ ONLY` was leaking into the
  // request's transaction: the INSERT failed every time and said nothing.
  // `::text::jsonb`, not `::jsonb`. A single cast on a stringified parameter is
  // a no-op under the driver the engine actually runs (Bun.SQL types the
  // parameter as json, so there is nothing to parse) and the column ends up
  // holding a JSON string scalar. The test suite cannot see this — it reaches
  // Postgres through `pg`, which sends the parameter as text and makes the
  // defect disappear.
  //
  // Nothing reads `chart_config` today: `/history` selects nine columns and that
  // is not one of them, so this stored a malformed value nobody looked at. It is
  // corrected rather than left, because the first reader would inherit the bug
  // and would be looking for it in their own code.
  //
  // `scripts/check-jsonb-cast.ts` did not flag this line: its pattern requires
  // `}` immediately after `JSON.stringify(...)`, and this is a ternary. That gap
  // is fixed in the same change as this.
  await sql`
    INSERT INTO zv_ai_queries (user_id, prompt, generated_sql, result_count, execution_ms, ai_analysis, chart_config, error)
    VALUES (${userId}, ${prompt}, ${generatedSql}, ${resultCount}, ${executionMs}, ${analysis},
      ${chartConfig ? JSON.stringify(chartConfig) : null}::text::jsonb, ${error})
  `
    .execute(db)
    .catch((err: Error) => {
      console.warn('[ai.query] could not record query history:', err.message);
    });
}
