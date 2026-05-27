import type { ZveltioExtension } from '@zveltio/sdk/extension';
import { join } from 'path';
import { buildAIRoutes } from './routes/index.js';
import { aiProviderManager, initAIProviders } from './lib/ai-provider.js';
import { triggerEmbedding } from './lib/ai-embed-hook.js';
import { ZveltioAIEngine } from './lib/zveltio-ai/engine.js';

/**
 * AI extension — providers, chat, embeddings, semantic search, text-to-SQL,
 * schema generation, agentic workflows.
 *
 * Publishes the following inter-extension services:
 *   ai.providers           — the AIProviderManager singleton (full API)
 *   ai.embed(text, opts)   — single-shot embedding helper
 *   ai.chat(messages,opts) — single-shot chat helper
 *   ai.triggerEmbedding    — re-index a record's embedding (used by data layer)
 *
 * Other extensions consume these via `ctx.services.get('ai.providers')` etc.
 * Consumers should declare a manifest dependency: { "name": "ai" }.
 */
const extension: ZveltioExtension = {
  name: 'ai',
  category: 'intelligence',
  // S3-01: sub-app mounted at /ext/ai by the engine. Sub-routers inside
  // buildAIRoutes() are exposed under /, /alchemist, /query, /analytics,
  // /zveltio (see engine/routes/index.ts).
  mountStrategy: 'subapp',

  getMigrations() {
    return [
      join(import.meta.dir, 'migrations/001_initial.sql'),
      join(import.meta.dir, 'migrations/002_ai_complete.sql'),
      join(import.meta.dir, 'migrations/003_ai_memory_columns.sql'),
    ];
  },

  async register(app, ctx) {
    // Load configured AI providers from zv_ai_providers (extension-owned table).
    // Non-fatal: if no providers are configured, the extension stays loaded but
    // routes return 503 / "AI not configured" responses.
    await initAIProviders(ctx.db).catch((err: Error) => {
      console.warn('[ai extension] initAIProviders failed (non-fatal):', err.message);
    });

    // Publish services for other extensions to consume. Helpers default to the
    // configured default provider; consumers can fetch ai.providers.get(name)
    // to target a specific one.
    ctx.services.register('ai.providers', aiProviderManager);
    ctx.services.register('ai.embed', async (text: string, model?: string) => {
      const p = aiProviderManager.getDefault();
      if (!p?.embed) throw new Error('No AI provider with embedding capability is configured.');
      return p.embed(text, model);
    });
    ctx.services.register('ai.chat', async (messages: any[], opts?: any) => {
      const p = aiProviderManager.getDefault();
      if (!p?.chat) throw new Error('No AI provider is configured.');
      return p.chat(messages, opts);
    });
    ctx.services.register('ai.triggerEmbedding', triggerEmbedding);

    // Background AI task runner — used by flow-scheduler for `ai_task` flows.
    ctx.services.register('ai.runBackgroundTask', async (userId: string, instruction: string, opts: any) => {
      const engine = new ZveltioAIEngine(ctx);
      return engine.processBackgroundTask(userId, instruction, opts);
    });

    // Subscribe to record lifecycle for auto-embedding (when collection has
    // ai_search_enabled = true). Failures are swallowed so a bad embedding
    // request never blocks data writes. `tenantId` is plumbed through from
    // `engineEvents.emit` in data.ts; we pass it explicitly to
    // `triggerEmbedding` because the hook runs on the GLOBAL pool (NOT
    // inside the request's tenant transaction), so the
    // `zveltio.current_tenant` GUC is unset and the column DEFAULT would
    // tag the embedding row with NULL tenant_id, leaking it cross-tenant.
    const onWrite = async (evt: { collection: string; id: string; record: Record<string, any>; tenantId?: string | null }) => {
      try { await triggerEmbedding(ctx.db, evt.collection, evt.id, evt.record, evt.tenantId ?? null); } catch { /* non-fatal */ }
    };
    ctx.events.on('record.created', onWrite);
    ctx.events.on('record.updated', onWrite);

    // Mount HTTP routes.
    app.route('/', buildAIRoutes(ctx));
  },
};

export default extension;
