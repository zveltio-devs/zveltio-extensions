import { sql } from 'kysely';
import { aiProviderManager } from './ai-provider.js';

/**
 * Text extraction and embedding for uploaded files.
 *
 * This lived in the engine (`lib/cloud/document-indexer.ts`) and reached the AI
 * provider through `serviceRegistry.get('ai.providers')` — the host asking an
 * extension for the capability it needs to do the work. It writes
 * `zvd_ai_embeddings`, which this extension's `migrations/001_initial.sql`
 * creates, so the code belongs on this side of the fence with the table.
 *
 * `storage/cloud` carried a third copy of the same three functions, with its
 * providers injected by the caller and no caller anywhere. That one is deleted.
 *
 * Published as `ai.extractText` / `ai.indexFile` for other extensions
 * (`content/media` is the one consumer); callers inside this extension import
 * it directly.
 *
 * `providers` defaults to this extension's own manager and exists so the tests
 * can hand over a fake. It is a parameter rather than a `mock.module` in the
 * tests for a measured reason: mocking `./ai-provider.js` is process-global in
 * `bun test`, and it broke the four `initAIProviders — stored keys` cases in
 * `ai-provider.test.ts` when the whole suite ran in one process.
 */

// biome-ignore lint/suspicious/noExplicitAny: extension db handle, as elsewhere in this extension
type Database = any;

/** The slice of the provider manager this module uses. */
type Providers = {
  getDefault(): {
    embed?: (text: string) => Promise<{ embedding: number[]; model: string }>;
  } | null;
};

const INDEXABLE_MIMES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'application/json',
  'application/xml',
  'application/pdf',
];

/**
 * Indexes the content of an uploaded file.
 * Fire-and-forget — called async after upload.
 * Stores embedding in zvd_ai_embeddings with collection='_media'.
 */
export async function indexFileContent(
  db: Database,
  fileId: string,
  content: string,
  providers: Providers = aiProviderManager,
): Promise<void> {
  if (!content.trim()) return;

  const provider = providers.getDefault();
  if (!provider?.embed) return;

  try {
    const textToEmbed = content.slice(0, 8000);
    const { embedding, model } = await provider.embed(textToEmbed);

    await sql`
      INSERT INTO zvd_ai_embeddings
        (collection, record_id, field, text_content, embedding, model, updated_at)
      VALUES (
        '_media',
        ${fileId},
        'content',
        ${textToEmbed.slice(0, 2000)},
        ${JSON.stringify(embedding)}::vector,
        ${model},
        NOW()
      )
      ON CONFLICT (collection, record_id, field)
      DO UPDATE SET
        text_content = EXCLUDED.text_content,
        embedding = EXCLUDED.embedding,
        model = EXCLUDED.model,
        updated_at = NOW()
    `.execute(db);
  } catch (err) {
    console.error(`Cloud indexing failed [${fileId}]:`, err);
  }
}

/**
 * Extracts text from uploaded files.
 * Supports: text/*, JSON, CSV.
 * PDF requires pdf-parse (optional).
 */
export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  ) {
    return buffer.toString('utf-8');
  }

  if (mimeType === 'application/pdf') {
    try {
      // @ts-ignore — pdf-parse is an optional peer dependency
      const pdfParse = await import('pdf-parse').catch(() => null);
      if (pdfParse) {
        const data = await pdfParse.default(buffer);
        return data.text;
      }
    } catch {
      console.warn('PDF text extraction failed — install pdf-parse for PDF indexing');
    }
  }

  return null;
}

/**
 * Indexing hook: called from media upload route.
 */
export async function scheduleFileIndexing(
  db: Database,
  fileId: string,
  buffer: Buffer,
  mimeType: string,
  providers: Providers = aiProviderManager,
): Promise<void> {
  if (!INDEXABLE_MIMES.some((m) => mimeType.startsWith(m.split('/')[0]) || mimeType === m)) return;

  extractTextFromFile(buffer, mimeType)
    .then(async (text) => {
      if (text) await indexFileContent(db, fileId, text, providers);
    })
    .catch((err) => {
      console.error(`File indexing schedule failed [${fileId}]:`, err);
    });
}
