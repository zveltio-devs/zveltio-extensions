import { Hono } from 'hono';
import type { ExtensionContext } from '@zveltio/sdk/extension';
import { aiRoutes } from './ai.js';
import { aiChatsRoutes } from './ai-chats.js';
import { aiSchemaGenRoutes } from './ai-schema-gen.js';
import { aiAlchemistRoutes } from './ai-alchemist.js';
import { aiQueryRoutes } from './ai-query.js';
import { aiAnalyticsRoutes } from './ai-analytics.js';
import { zveltioAIRoutes } from './zveltio-ai.js';

/**
 * Mount points (relative to extension root):
 *   /api/ai             — providers, embeddings, search, chat, schema-gen
 *   /api/ai/alchemist   — Data Alchemist (unstructured doc → schema)
 *   /api/ai/query       — Text-to-SQL natural language queries
 *   /api/ai-analytics   — usage analytics, cost recommendations
 *   /api/zveltio-ai     — agentic ReAct loop / tool use
 */
export function buildAIRoutes(ctx: ExtensionContext): Hono {
  const app = new Hono();
  app.route('/api/ai', aiRoutes(ctx));
  app.route('/api/ai', aiChatsRoutes(ctx));
  app.route('/api/ai', aiSchemaGenRoutes(ctx));
  app.route('/api/ai/alchemist', aiAlchemistRoutes(ctx));
  app.route('/api/ai/query', aiQueryRoutes(ctx));
  app.route('/api/ai-analytics', aiAnalyticsRoutes(ctx));
  app.route('/api/zveltio-ai', zveltioAIRoutes(ctx));
  return app;
}
