/**
 * Unit coverage for ai/engine/lib/document-indexer.ts — extracts text from
 * uploaded files and stores an embedding in zvd_ai_embeddings.
 *
 * Ported from the engine (src/tests/unit/document-indexer.test.ts) with the
 * module. One change, and it is the point of the move: the provider used to be
 * fetched from the host's `serviceRegistry` under 'ai.providers', so the test
 * registered a fake there. The code now reaches this extension's own
 * `aiProviderManager`, and the fake is handed to it as the last argument.
 *
 * NOT `mock.module('../lib/ai-provider.js')`: that is process-global in
 * `bun test`, and it made the whole-suite run fail the four
 * `initAIProviders — stored keys` cases in ai-provider.test.ts on
 * `aiProviderManager.register is not a function`. Measured, not guessed.
 *
 * Driven with CannedDb (records the embeddings upsert). No Postgres, no real
 * AI provider.
 */

import { beforeEach, describe, expect, it } from 'bun:test';
import {
  extractTextFromFile,
  indexFileContent,
  scheduleFileIndexing,
} from '../lib/document-indexer.js';
import { CannedDb } from './fixtures/canned-db.js';

const EMBED_INSERT = /insert into zvd_ai_embeddings/i;

let embedCalls: string[];

/** A provider manager whose default provider embeds deterministically. */
function providers(impl?: (t: string) => Promise<{ embedding: number[]; model: string }>) {
  return {
    getDefault: () => ({
      embed:
        impl ??
        (async (t: string) => {
          embedCalls.push(t);
          return { embedding: [0.1, 0.2, 0.3], model: 'fake-embed-1' };
        }),
    }),
  };
}

/** No provider configured at all. */
const noProviders = { getDefault: () => null };

beforeEach(() => {
  embedCalls = [];
});

describe('extractTextFromFile', () => {
  it('decodes text/* as utf-8', async () => {
    expect(await extractTextFromFile(Buffer.from('hello'), 'text/plain')).toBe('hello');
    expect(await extractTextFromFile(Buffer.from('# md'), 'text/markdown')).toBe('# md');
  });

  it('decodes application/json and application/xml as utf-8', async () => {
    expect(await extractTextFromFile(Buffer.from('{"a":1}'), 'application/json')).toBe('{"a":1}');
    expect(await extractTextFromFile(Buffer.from('<x/>'), 'application/xml')).toBe('<x/>');
  });

  it('returns null for an unsupported binary type', async () => {
    expect(await extractTextFromFile(Buffer.from([0, 1, 2]), 'image/png')).toBeNull();
  });
});

describe('indexFileContent', () => {
  it('does nothing for blank content', async () => {
    const db = new CannedDb();
    db.when(EMBED_INSERT, []);
    await indexFileContent(db.kysely, 'f1', '   ', providers());
    expect(embedCalls.length).toBe(0);
    expect(db.executed(EMBED_INSERT).length).toBe(0);
  });

  it('does nothing when no AI provider is configured', async () => {
    const db = new CannedDb();
    db.when(EMBED_INSERT, []);
    await indexFileContent(db.kysely, 'f1', 'real content', noProviders);
    expect(db.executed(EMBED_INSERT).length).toBe(0);
  });

  it('embeds the content and upserts into zvd_ai_embeddings', async () => {
    const db = new CannedDb();
    db.when(EMBED_INSERT, []);

    await indexFileContent(db.kysely, 'file-42', 'the quick brown fox', providers());

    expect(embedCalls).toEqual(['the quick brown fox']);
    const inserts = db.executed(EMBED_INSERT);
    expect(inserts.length).toBe(1);
    expect(inserts[0].parameters).toContain('file-42');
  });

  it('swallows an embed() failure without throwing', async () => {
    const db = new CannedDb();
    db.when(EMBED_INSERT, []);
    const failing = providers(async () => {
      throw new Error('provider down');
    });
    await expect(indexFileContent(db.kysely, 'f1', 'content', failing)).resolves.toBeUndefined();
    expect(db.executed(EMBED_INSERT).length).toBe(0);
  });
});

describe('scheduleFileIndexing', () => {
  it('skips non-indexable mime types', async () => {
    const db = new CannedDb();
    db.when(EMBED_INSERT, []);
    await scheduleFileIndexing(db.kysely, 'f1', Buffer.from([0, 1]), 'image/png', providers());
    await new Promise((r) => setTimeout(r, 20));
    expect(db.executed(EMBED_INSERT).length).toBe(0);
  });

  it('extracts + indexes an indexable text file', async () => {
    const db = new CannedDb();
    db.when(EMBED_INSERT, []);
    await scheduleFileIndexing(
      db.kysely,
      'file-7',
      Buffer.from('indexable body'),
      'text/plain',
      providers(),
    );
    // fire-and-forget chain — let it flush.
    await new Promise((r) => setTimeout(r, 30));
    expect(embedCalls).toEqual(['indexable body']);
    expect(db.executed(EMBED_INSERT).length).toBe(1);
  });

  it('logs schedule failures when text extraction rejects', async () => {
    const db = new CannedDb();
    db.when(EMBED_INSERT, []);
    const errors: string[] = [];
    const orig = console.error;
    console.error = (...a: unknown[]) => errors.push(a.join(' '));
    const evilBuf = {
      toString() {
        throw new Error('decode failed');
      },
    } as unknown as Buffer;
    try {
      await scheduleFileIndexing(db.kysely, 'file-bad', evilBuf, 'text/plain', providers());
      await new Promise((r) => setTimeout(r, 30));
    } finally {
      console.error = orig;
    }
    expect(errors.join('\n')).toMatch(/File indexing schedule failed \[file-bad\]/);
    expect(db.executed(EMBED_INSERT).length).toBe(0);
  });
});
