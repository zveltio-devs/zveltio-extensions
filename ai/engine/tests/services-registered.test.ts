/**
 * The services this extension publishes are part of its contract with the other
 * extensions, and nothing tested that they are actually registered.
 *
 * This exists because of a defect made while moving `document-indexer` here: the
 * import and the docstring entry for `ai.indexFile` landed, the
 * `ctx.services.register` call did not, and every gate stayed green — typecheck,
 * both unit suites, the engine's prepush. `content/media` would have silently
 * stopped indexing uploads, because a missing service is exactly the case it is
 * written to tolerate. It was caught by grepping the packed bundle, which is not
 * a thing anyone should have to remember to do.
 *
 * No Postgres and no HTTP: `register()` is called on a tolerant fake ctx, and
 * the assertion is only on which names reached the registry.
 *
 * `../index.js` is the PACKED BUNDLE, not `index.ts` — bun resolves the
 * specifier as written, and that is deliberate: it is the file the engine
 * loads. Checked by measuring, because it decides what this test proves —
 * editing the source alone leaves it green, so the proof that it bites is
 * break the source, repack, and watch it go red (it does: 2 fail, bundle hits
 * for `ai.indexFile` 1 -> 0). A stale bundle is itself a defect this catches.
 */

import { describe, expect, it } from 'bun:test';
import extension from '../index.js';

/** Every service `ai` promises to other extensions. */
const PUBLISHED = [
  'ai.providers',
  'ai.embed',
  'ai.chat',
  'ai.triggerEmbedding',
  'ai.runBackgroundTask',
  'ai.extractText',
  'ai.indexFile',
];

async function registeredNames(): Promise<string[]> {
  const names: string[] = [];
  const noop = () => undefined;
  const ctx = {
    // initAIProviders() awaits this and its failure is caught as non-fatal.
    db: {
      selectFrom: () => {
        throw new Error('no database in this test');
      },
    },
    services: { register: (n: string) => names.push(n), get: () => null, has: () => false },
    events: { on: noop, emit: noop, emitAsync: async () => undefined },
    internals: new Proxy({}, { get: () => noop }),
    config: { vars: {} },
    auth: {},
    checkPermission: async () => true,
  };
  const app = { route: noop, use: noop, get: noop, post: noop };

  await extension.register(app as never, ctx as never);
  return names;
}

describe('ai: published services', () => {
  it('registers every service other extensions consume', async () => {
    const names = await registeredNames();
    for (const svc of PUBLISHED) {
      expect(names).toContain(svc);
    }
  });

  it('registers nothing it does not document', async () => {
    const names = await registeredNames();
    expect([...names].sort()).toEqual([...PUBLISHED].sort());
  });
});
