import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sql } from 'kysely';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import {
  aiProviderManager,
  OpenAIProvider,
  AnthropicProvider,
  OllamaProvider,
} from '../lib/ai-provider.js';
import { encryptApiKey, decryptApiKey, maskApiKey } from '../lib/ai-crypto.js';

export function aiRoutes(ctx: ExtensionContext): Hono {
  const { db, auth, checkPermission, internals } = ctx;
  const validatePublicUrl = internals.validatePublicUrl;
  const app = new Hono();

  /**
   * Returns the per-request tenant transaction if multi-tenant
   * middleware is active, else the global pool. Critical for
   * `zvd_ai_embeddings`: that table has FORCE RLS keyed on the
   * `zveltio.current_tenant` GUC (set by `SET LOCAL` inside the
   * tenant transaction). Querying via the raw pool inside a
   * multi-tenant deployment yields cross-tenant rows (or zero rows,
   * depending on the row's `tenant_id`). Always use this.
   */
  function reqDb(c: any): any {
    return ctx.reqDb ? ctx.reqDb(c) : (c.get('tenantTrx') ?? db);
  }

  async function requireAuth(c: any) {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    return session?.user ?? null;
  }

  async function requireAdmin(c: any) {
    const user = await requireAuth(c);
    if (!user) return null;
    const isAdmin = await checkPermission(user.id, 'admin', '*');
    return isAdmin ? user : null;
  }

  // ─── Providers ────────────────────────────────────────────────

  // GET /providers — list configured providers
  app.get('/providers', async (c) => {
    const user = await requireAuth(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const providers = await db
      .selectFrom('zv_ai_providers')
      .select([
        'id',
        'name',
        'label',
        'default_model',
        'base_url',
        'is_default',
        'is_active',
      ])
      .orderBy('name', 'asc')
      .execute();

    const activeNames = aiProviderManager.list();

    return c.json({
      providers: providers.map((p: any) => ({
        ...p,
        api_key: maskApiKey(p.api_key ?? ''), // never return the key in plain text
        loaded: activeNames.includes(p.name),
      })),
    });
  });

  // PUT /providers/:name — configure a provider (upsert)
  app.put(
    '/providers/:name',
    zValidator(
      'json',
      z.object({
        label: z.string().optional(),
        api_key: z.string().optional(),
        base_url: z
          .string()
          .url()
          .optional()
          .superRefine((url, ctx) => {
            if (!url) return;
            try {
              validatePublicUrl(url);
            } catch (e) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `base_url points to a private/internal address: ${(e as Error).message}`,
              });
            }
          }),
        default_model: z.string().optional(),
        is_default: z.boolean().optional(),
        is_active: z.boolean().optional(),
      }),
    ),
    async (c) => {
      const user = await requireAdmin(c);
      if (!user) return c.json({ error: 'Admin access required' }, 403);

      const name = c.req.param('name');
      const body = c.req.valid('json');
      const now = new Date();

      const existing = await db
        .selectFrom('zv_ai_providers')
        .selectAll()
        .where('name', '=', name)
        .executeTakeFirst();

      if (existing) {
        const updateData = { ...body, updated_at: now };
        if (updateData.api_key) {
          updateData.api_key = await encryptApiKey(updateData.api_key);
        }
        await db
          .updateTable('zv_ai_providers')
          .set(updateData)
          .where('name', '=', name)
          .execute();
      } else {
        const labels: Record<string, string> = {
          openai: 'OpenAI',
          anthropic: 'Anthropic (Claude)',
          gemini: 'Google Gemini',
          ollama: 'Ollama (Local)',
        };
        await db
          .insertInto('zv_ai_providers')
          .values({
            name,
            label: body.label || labels[name] || name,
            api_key: body.api_key
              ? await encryptApiKey(body.api_key)
              : undefined,
            base_url: body.base_url,
            default_model: body.default_model,
            is_default: body.is_default ?? false,
            is_active: body.is_active ?? true,
          })
          .execute();
      }

      // If marking as default, clear others
      if (body.is_default) {
        await db
          .updateTable('zv_ai_providers')
          .set({ is_default: false })
          .where('name', '!=', name)
          .execute();
      }

      // Hot-reload provider in memory
      const updated = await db
        .selectFrom('zv_ai_providers')
        .selectAll()
        .where('name', '=', name)
        .executeTakeFirst();

      if (updated?.is_active && (updated.api_key || name === 'ollama')) {
        const decryptedKey = await decryptApiKey(updated.api_key ?? '');
        let provider = null;
        if (name === 'openai')
          provider = new OpenAIProvider(
            decryptedKey,
            updated.base_url,
            updated.default_model,
          );
        else if (name === 'anthropic')
          provider = new AnthropicProvider(decryptedKey, updated.default_model);
        else if (name === 'ollama')
          provider = new OllamaProvider(
            updated.base_url,
            updated.default_model,
          );
        if (provider) aiProviderManager.register(provider, updated.is_default);
      }

      return c.json({ success: true });
    },
  );

  // DELETE /providers/:name — remove provider
  app.delete('/providers/:name', async (c) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Admin access required' }, 403);

    const name = c.req.param('name');
    const result = await sql`
      DELETE FROM zv_ai_providers WHERE name = ${name} RETURNING id
    `.execute(db);

    if (result.rows.length === 0)
      return c.json({ error: 'Provider not found' }, 404);
    return c.json({ success: true });
  });

  // ─── Chat ─────────────────────────────────────────────────────

  app.post(
    '/chat',
    zValidator(
      'json',
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(['system', 'user', 'assistant']),
            content: z.string(),
          }),
        ),
        provider: z.string().optional(),
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        max_tokens: z.number().int().positive().optional(),
      }),
    ),
    async (c) => {
      const user = await requireAuth(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { messages, provider: providerName, ...opts } = c.req.valid('json');

      const provider = providerName
        ? aiProviderManager.get(providerName)
        : aiProviderManager.getDefault();

      if (!provider) {
        return c.json(
          {
            error: 'No AI provider configured. Add a provider in AI Settings.',
          },
          503,
        );
      }

      const start = Date.now();
      const result = await provider.chat(messages, opts);
      const latency = Date.now() - start;

      // Log usage
      await db
        .insertInto('zv_ai_usage')
        .values({
          provider: provider.name,
          model: result.model,
          operation: 'chat',
          prompt_tokens: result.usage.prompt_tokens,
          response_tokens: result.usage.response_tokens,
          latency_ms: latency,
          user_id: user.id,
        })
        .execute()
        .catch(() => {});

      return c.json({ result });
    },
  );

  // ─── Embeddings ───────────────────────────────────────────────

  // POST /embed — generate text embeddings
  app.post(
    '/embed',
    zValidator(
      'json',
      z.object({
        text: z.union([z.string(), z.array(z.string())]),
        model: z.string().optional(),
        collection: z.string().optional(),
        record_id: z.string().optional(),
        field_name: z.string().optional(),
      }),
    ),
    async (c) => {
      const user = await requireAuth(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const provider = aiProviderManager.getDefault();

      if (!provider) return c.json({ error: 'No AI provider configured' }, 503);
      if (!provider.embed) {
        return c.json(
          {
            error:
              'Current AI provider does not support embeddings. Use OpenAI or Ollama.',
          },
          400,
        );
      }

      const texts = Array.isArray(body.text) ? body.text : [body.text];
      const start = Date.now();
      const embeddings: number[][] = [];

      for (const t of texts) {
        const vec = await provider.embed(t, body.model);
        embeddings.push(vec.embedding);
      }

      const latency = Date.now() - start;

      await db
        .insertInto('zv_ai_usage')
        .values({
          provider: provider.name,
          model: body.model || 'embedding',
          operation: 'embed',
          prompt_tokens: texts.reduce(
            (acc, t) => acc + t.split(/\s+/).length,
            0,
          ),
          response_tokens: 0,
          latency_ms: latency,
          user_id: user.id,
        })
        .execute()
        .catch(() => {});

      // Optionally persist embedding for later semantic search.
      //
      // Permission check: the caller must have write access on the
      // collection they're indexing. Without this, any authenticated
      // user could associate embeddings with rows in collections their
      // role can't write to — search results would then pull text
      // controlled by the attacker into RAG prompts for everyone else.
      if (body.collection && body.record_id && texts.length === 1) {
        if (!(await checkPermission(user.id, body.collection, 'update'))) {
          return c.json({
            error: `Forbidden: no write permission on "${body.collection}" — embedding not persisted`,
          }, 403);
        }
        const vectorLiteral = JSON.stringify(embeddings[0]);
        // tenant_id intentionally omitted from the INSERT — the column
        // has DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid
        // (see migration 009), so running this INSERT inside the tenant
        // transaction tags the row with the active tenant automatically.
        // FORCE RLS on the table then prevents cross-tenant reads.
        await sql`
          INSERT INTO zvd_ai_embeddings (collection, record_id, field, text_content, embedding, model, updated_at)
          VALUES (
            ${body.collection}, ${body.record_id}, ${body.field_name || 'content'},
            ${texts[0].slice(0, 2000)},
            ${vectorLiteral}::vector,
            ${body.model || 'embedding'},
            NOW()
          )
          ON CONFLICT (collection, record_id, field) DO UPDATE SET
            text_content = EXCLUDED.text_content,
            embedding    = EXCLUDED.embedding,
            model        = EXCLUDED.model,
            updated_at   = NOW()
        `
          .execute(reqDb(c))
          .catch((err: Error) => {
            console.warn('[ai.embed] embedding persist failed:', err.message);
          });
      }

      return c.json({
        embeddings: Array.isArray(body.text) ? embeddings : embeddings[0],
        dimensions: embeddings[0]?.length ?? 0,
        model: body.model || 'embedding',
      });
    },
  );

  // POST /search — semantic / full-text search over indexed embeddings
  app.post(
    '/search',
    zValidator(
      'json',
      z.object({
        query: z.string().min(1),
        collection: z.string(),
        field: z.string().optional().default('content'),
        limit: z.number().int().min(1).max(100).optional().default(10),
        threshold: z.number().min(0).max(1).optional().default(0.3),
      }),
    ),
    async (c) => {
      const user = await requireAuth(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const { query, collection, field, limit, threshold } =
        c.req.valid('json');

      // Per-collection read gate: without this, any authenticated user
      // could `POST /ext/ai/search { collection: "users" }` and pull
      // semantic-search hits across collections their RBAC role forbids.
      // We piggyback on the existing collection-level permission so the
      // AI surface honours the same RBAC as /api/data.
      if (!(await checkPermission(user.id, collection, 'read'))) {
        return c.json({ error: 'Forbidden: no read permission on this collection' }, 403);
      }

      // Try pgvector semantic search if we can embed the query.
      // Falls back to pg_trgm on stored text_content when no embedder
      // is available — both paths target the canonical zvd_ai_embeddings
      // table from ai/engine/migrations/002_embeddings.sql.
      // reqDb(c) routes the query through the tenant transaction, so
      // FORCE RLS on zvd_ai_embeddings (migration 009) restricts the
      // result set to rows tagged with this tenant. Without it a user
      // in tenant A could pull semantic-search hits — including the
      // raw `text_content` column — from tenant B's records.
      const tdb = reqDb(c);
      const provider = aiProviderManager.getDefault();
      if (provider?.embed) {
        try {
          const { embedding } = await provider.embed(query);
          const queryVec = JSON.stringify(embedding);
          const vecResults = await sql<any>`
            SELECT record_id, text_content AS content,
                   1 - (embedding <=> ${queryVec}::vector) AS score
            FROM zvd_ai_embeddings
            WHERE collection = ${collection}
              AND (1 - (embedding <=> ${queryVec}::vector)) > ${threshold}
            ORDER BY embedding <=> ${queryVec}::vector
            LIMIT ${limit}
          `
            .execute(tdb)
            .then((r) => r.rows)
            .catch(() => []);

          if (vecResults.length > 0) {
            return c.json({
              results: vecResults,
              query,
              collection,
              count: vecResults.length,
              method: 'pgvector',
            });
          }
        } catch (err) {
          console.warn('[ai.search] embed-query failed, falling back:', (err as Error).message);
        }
      }

      const trgmResults = await sql<any>`
        SELECT record_id, text_content AS content, similarity(text_content, ${query}) AS score
        FROM zvd_ai_embeddings
        WHERE collection = ${collection}
          AND similarity(text_content, ${query}) > ${threshold}
        ORDER BY score DESC
        LIMIT ${limit}
      `
        .execute(tdb)
        .then((r) => r.rows)
        .catch(() => []);

      if (trgmResults.length > 0) {
        return c.json({
          results: trgmResults,
          query,
          collection,
          count: trgmResults.length,
          method: 'trgm',
        });
      }

      // Fallback: ILIKE full-text search on actual collection table
      // P1: use zvd_ prefix to prevent reading system tables (zv_api_keys, etc.)
      let fallbackResults: any[] = [];
      const SAFE_COL_RE = /^[a-z][a-z0-9_]*$/;
      if (!SAFE_COL_RE.test(collection) || !SAFE_COL_RE.test(field)) {
        return c.json({
          results: [],
          query,
          collection,
          count: 0,
          method: 'ilike',
        });
      }
      try {
        const tableName = `zvd_${collection}`;
        fallbackResults = await sql<any>`
          SELECT *, 0.5 AS score
          FROM ${sql.id(tableName)}
          WHERE ${sql.id(field)} ILIKE ${'%' + query + '%'}
          LIMIT ${limit}
        `
          .execute(db)
          .then((r) => r.rows)
          .catch(() => []);
      } catch {
        /* table may not exist */
      }

      return c.json({
        results: fallbackResults,
        query,
        collection,
        count: fallbackResults.length,
        method: 'ilike',
      });
    },
  );

  // ─── Prompt templates ──────────────────────────────────────────

  app.get('/prompts', async (c) => {
    const user = await requireAuth(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const prompts = await db
      .selectFrom('zv_prompt_templates')
      .selectAll()
      .where('is_active', '=', true)
      .orderBy('name', 'asc')
      .execute();

    return c.json({ prompts });
  });

  app.post(
    '/prompts',
    zValidator(
      'json',
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        system: z.string().optional(),
        template: z.string().min(1),
        variables: z
          .array(
            z.object({
              name: z.string(),
              description: z.string().optional(),
              required: z.boolean().default(false),
            }),
          )
          .default([]),
        category: z.string().optional(),
      }),
    ),
    async (c) => {
      const user = await requireAuth(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const body = c.req.valid('json');
      const prompt = await db
        .insertInto('zv_prompt_templates')
        .values({ ...body, variables: JSON.stringify(body.variables) })
        .returningAll()
        .executeTakeFirst();

      return c.json({ prompt }, 201);
    },
  );

  app.delete('/prompts/:id', async (c) => {
    const user = await requireAuth(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    await db
      .updateTable('zv_prompt_templates')
      .set({ is_active: false })
      .where('id', '=', c.req.param('id'))
      .execute();

    return c.json({ success: true });
  });

  // POST /prompts/:id/run — render template and run
  app.post(
    '/prompts/:id/run',
    zValidator('json', z.record(z.string(), z.string())),
    async (c) => {
      const user = await requireAuth(c);
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const prompt = await db
        .selectFrom('zv_prompt_templates')
        .selectAll()
        .where('id', '=', c.req.param('id'))
        .where('is_active', '=', true)
        .executeTakeFirst();

      if (!prompt) return c.json({ error: 'Prompt not found' }, 404);

      const vars = c.req.valid('json');
      let rendered = prompt.template;
      for (const [k, v] of Object.entries(vars)) {
        rendered = rendered.replaceAll(`{{${k}}}`, String(v));
      }

      const messages: any[] = [];
      if (prompt.system)
        messages.push({ role: 'system', content: prompt.system });
      messages.push({ role: 'user', content: rendered });

      const provider = aiProviderManager.getDefault();
      if (!provider) return c.json({ error: 'No AI provider configured' }, 503);

      const result = await provider.chat(messages);
      return c.json({ result, rendered_prompt: rendered });
    },
  );

  // ─── Admin: AI Features ────────────────────────────────────────

  // GET /admin/features — list AI features configuration
  app.get('/admin/features', async (c) => {
    const user = await requireAdmin(c);
    if (!user) return c.json({ error: 'Admin access required' }, 403);

    const features = await db
      .selectFrom('zv_ai_features')
      .selectAll()
      .orderBy('feature_key', 'asc')
      .execute()
      .catch(() => []);

    return c.json({ features });
  });

  // PUT /admin/features/:featureKey — update feature config
  app.put(
    '/admin/features/:featureKey',
    zValidator(
      'json',
      z.object({
        display_name: z.string().optional(),
        description: z.string().optional(),
        is_enabled: z.boolean().optional(),
        config: z.record(z.string(), z.any()).optional(),
      }),
    ),
    async (c) => {
      const user = await requireAdmin(c);
      if (!user) return c.json({ error: 'Admin access required' }, 403);

      const featureKey = c.req.param('featureKey');
      const body = c.req.valid('json');

      const existing = await db
        .selectFrom('zv_ai_features')
        .select('id')
        .where('feature_key', '=', featureKey)
        .executeTakeFirst()
        .catch(() => null);

      if (!existing) return c.json({ error: 'Feature not found' }, 404);

      const updateFields: Record<string, any> = { updated_at: new Date() };
      if (body.display_name !== undefined)
        updateFields.display_name = body.display_name;
      if (body.description !== undefined)
        updateFields.description = body.description;
      if (body.is_enabled !== undefined)
        updateFields.is_enabled = body.is_enabled;
      if (body.config !== undefined)
        updateFields.config = JSON.stringify(body.config);

      await db
        .updateTable('zv_ai_features')
        .set(updateFields)
        .where('feature_key', '=', featureKey)
        .execute();

      return c.json({ success: true });
    },
  );

  // ─── Usage stats ───────────────────────────────────────────────

  app.get('/usage', async (c) => {
    const user = await requireAuth(c);
    if (!user) return c.json({ error: 'Unauthorized' }, 401);

    const { days = '30' } = c.req.query();
    const since = new Date(Date.now() - parseInt(days) * 86400_000);

    const usage = await db
      .selectFrom('zv_ai_usage')
      .select([
        'provider',
        'model',
        db.fn.count('id').as('requests'),
        db.fn.sum('prompt_tokens').as('prompt_tokens'),
        db.fn.sum('response_tokens').as('response_tokens'),
        db.fn.avg('latency_ms').as('avg_latency_ms'),
      ])
      .where('created_at', '>=', since)
      .groupBy(['provider', 'model'])
      .orderBy('requests', 'desc')
      .execute();

    return c.json({ usage, period_days: parseInt(days) });
  });

  return app;
}
