/**
 * document-indexer.ts — text/html and text/csv schedule paths.
 *
 * Ported from the engine with the module; the provider fake is passed in rather
 * than mocked into the module graph (see document-indexer.test.ts for why).
 */

import { beforeEach, describe, expect, it } from 'bun:test';
import { scheduleFileIndexing } from '../lib/document-indexer.js';
import { CannedDb } from './fixtures/canned-db.js';

const EMBED_INSERT = /insert into zvd_ai_embeddings/i;

let embedCalls: string[];

const providers = {
  getDefault: () => ({
    embed: async (t: string) => {
      embedCalls.push(t);
      return { embedding: [0.1], model: 'fake' };
    },
  }),
};

beforeEach(() => {
  embedCalls = [];
});

describe('scheduleFileIndexing — additional indexable mimes', () => {
  it('indexes text/html uploads', async () => {
    const db = new CannedDb();
    db.when(EMBED_INSERT, []);
    await scheduleFileIndexing(
      db.kysely,
      'html-1',
      Buffer.from('<p>hello</p>'),
      'text/html',
      providers,
    );
    await new Promise((r) => setTimeout(r, 30));
    expect(embedCalls).toEqual(['<p>hello</p>']);
    expect(db.executed(EMBED_INSERT).length).toBe(1);
  });

  it('indexes text/csv uploads', async () => {
    const db = new CannedDb();
    db.when(EMBED_INSERT, []);
    await scheduleFileIndexing(db.kysely, 'csv-1', Buffer.from('a,b\n1,2'), 'text/csv', providers);
    await new Promise((r) => setTimeout(r, 30));
    expect(embedCalls).toEqual(['a,b\n1,2']);
    expect(db.executed(EMBED_INSERT).length).toBe(1);
  });
});
