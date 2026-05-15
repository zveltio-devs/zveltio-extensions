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
 * Mount points under /ext/ai (engine prefixes the namespace):
 *   /              — providers, embeddings, search, chat, schema-gen
 *   /alchemist     — Data Alchemist (unstructured doc → schema)
 *   /query         — Text-to-SQL natural language queries
 *   /analytics     — usage analytics, cost recommendations
 *   /zveltio       — agentic ReAct loop / tool use
 */
export function buildAIRoutes(ctx: ExtensionContext): Hono {
  const app = new Hono();
  app.route('/', aiRoutes(ctx));
  app.route('/', aiChatsRoutes(ctx));
  app.route('/', aiSchemaGenRoutes(ctx));
  app.route('/alchemist', aiAlchemistRoutes(ctx));
  app.route('/query', aiQueryRoutes(ctx));
  app.route('/analytics', aiAnalyticsRoutes(ctx));
  app.route('/zveltio', zveltioAIRoutes(ctx));
  return app;
}
