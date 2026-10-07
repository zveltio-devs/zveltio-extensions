/**
 * An `ai_task` background run holds no transaction while it waits on the model.
 *
 * The scheduler used to run the whole task inside one tenant transaction, and it
 * sat `idle in transaction` through every model call until the server's
 * `idle_in_transaction_session_timeout` (60 s) killed it, and the task with it.
 * The host now hands the task its firm as `tenantId` and no transaction; each
 * stretch of database work opens a short one through
 * `ctx.internals.withTenantIsolation`.
 *
 * Asserted by recording, at every model call and every query, whether that
 * transaction is open — including `text_to_sql`, which calls the model in the
 * middle of a tool.
 */

import { afterEach, describe, expect, it } from 'bun:test';
import type { AIProvider, ChatResult } from '../lib/ai-provider.js';
import { aiProviderManager } from '../lib/ai-provider.js';
import { ZveltioAIEngine } from '../lib/zveltio-ai/engine.js';
import { CannedDb } from './fixtures/canned-db.js';

const FIRM = '11111111-1111-1111-1111-111111111111';

afterEach(() => {
  (aiProviderManager as unknown as { providers: Map<string, AIProvider> }).providers.delete(
    'fake-bg',
  );
});

describe('ai: background task transactions', () => {
  it('waits on the model with no transaction open; every query runs inside one, as its firm', async () => {
    let open: string | null = null;
    const events: string[] = [];
    const firms: string[] = [];
    const db = new CannedDb();
    db.when(/./, (q) => {
      events.push(`${open ? 'trx' : 'NO TRX'} db ${q.sql.slice(0, 30)}`);
      return /from "zvd_collections"/.test(q.sql) ? [{ name: 'orders', fields: [] }] : [];
    });

    const replies: Array<Partial<ChatResult>> = [
      {
        content: '',
        tool_calls: [
          { id: 't1', type: 'function', function: { name: 'list_collections', arguments: '{}' } },
          {
            id: 't2',
            type: 'function',
            function: { name: 'text_to_sql', arguments: '{"question":"how many orders"}' },
          },
        ],
      },
      { content: 'SELECT count(*) FROM zvd_orders' }, // text_to_sql's own model call
      { content: 'done' },
    ];
    const provider: AIProvider = {
      name: 'fake-bg',
      label: 'fake',
      async chat() {
        events.push(`${open ? 'trx' : 'NO TRX'} model`);
        await Bun.sleep(5);
        return {
          model: 'fake',
          provider: 'fake-bg',
          usage: { prompt_tokens: 1, response_tokens: 1 },
          content: '',
          ...replies.shift(),
        } as ChatResult;
      },
    };
    aiProviderManager.register(provider, true);

    const ctx = {
      db: db.kysely,
      checkPermission: async () => true,
      // The engine's registry reads run on the handle they are given, so a read
      // outside a transaction shows up here as one.
      DDLManager: {
        getCollections: (d: any) => d.selectFrom('zvd_collections').selectAll().execute(),
        getCollection: (d: any, name: string) =>
          d.selectFrom('zvd_collections').selectAll().where('name', '=', name).executeTakeFirst(),
      },
      internals: {
        enqueueDDLJob: async () => undefined,
        sendNotification: async () => {
          events.push(`${open ? 'trx' : 'NO TRX'} notify`);
        },
        withTenantIsolation: async <T>(tenantId: string, fn: (d: unknown) => Promise<T>) => {
          firms.push(tenantId);
          open = tenantId;
          try {
            return await fn(db.kysely);
          } finally {
            open = null;
          }
        },
      },
    };

    const engine = new ZveltioAIEngine(ctx as never);
    const result = await engine.processBackgroundTask('u1', 'count the orders', {
      tenantId: FIRM,
      notifyOnResult: true,
    });

    expect(result.executed).toBe(true);
    const model = events.filter((e) => e.endsWith(' model'));
    expect(model).toEqual(['NO TRX model', 'NO TRX model', 'NO TRX model']);
    const rest = events.filter((e) => !e.endsWith(' model'));
    expect(rest.length).toBeGreaterThan(0);
    expect(rest.filter((e) => e.startsWith('NO TRX'))).toEqual([]);
    expect(rest).toContain('trx notify');
    expect(new Set(firms)).toEqual(new Set([FIRM]));
  });
});
