/**
 * AI Embed Hook — auto-generate embeddings on create/update.
 *
 * Called non-blocking from data.ts after each write.
 * If collection has `ai_search_enabled = true`, generates embedding
 * and upserts it to zvd_ai_embeddings.
 */

import { sql } from 'kysely';
import { aiProviderManager } from './ai-provider.js';

// Database type from engine — kept loose since extensions don't import engine internals.
type Database = any;

const SYSTEM_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  '_deletedAt',
  'deleted_at',
]);

/**
 * Extract text to embed from a record.
 *
 * @param record          - the record data
 * @param field           - the specific field to embed (if configured)
 * @param excludedFields  - explicitly excluded fields (PII: cnp, salary, iban…)
 */
function extractText(
  record: Record<string, any>,
  field: string | null,
  excludedFields: Set<string>,
): string {
  if (field && record[field] != null) {
    // Single-field mode — exclusions don't apply (field was chosen explicitly)
    return String(record[field]);
  }
  // Full-record mode: concat all non-system, non-excluded string fields
  return Object.entries(record)
    .filter(
      ([k, v]) =>
        !SYSTEM_FIELDS.has(k) &&
        !excludedFields.has(k) &&
        typeof v === 'string' &&
        v.length > 0,
    )
    .map(([, v]) => v)
    .join(' ');
}

/**
 * The PII exclusion list, from a `TEXT[]` column.
 *
 * This is a privacy control, so it must not fail open. The previous form was
 * `Array.isArray(v) ? v : []` under a comment saying the value "may arrive as
 * array or JSON string" — which means the string case fell through to `[]`, no
 * exclusions at all, and a full-record embed would ship `cnp`, `salary` and
 * `iban` to the provider precisely on the collections where an admin had listed
 * them.
 *
 * The driver returns `TEXT[]` as a JS array, so the array branch is the real one.
 * The others are here so that if that ever changes, the outcome is a refusal
 * rather than a quiet leak: an unrecognised shape throws, the write it came from
 * still succeeds, and the caller logs which collection stopped indexing.
 */
function parseExcludedFields(raw: unknown, collection: string): Set<string> {
  if (raw == null) return new Set();
  if (Array.isArray(raw)) return new Set(raw.map(String));
  if (typeof raw === 'string') {
    const inner = raw.trim().replace(/^\{|\}$/g, '');
    if (inner === '') return new Set();
    // Postgres array literal: {a,b,"c d"}
    return new Set(
      inner.split(',').map((s) => s.trim().replace(/^"|"$/g, '')).filter(Boolean),
    );
  }
  throw new Error(
    `collection "${collection}": ai_embed_excluded_fields has an unexpected shape ` +
      `(${typeof raw}) — refusing to embed rather than ignore the exclusion list`,
  );
}

/**
 * Triggers embedding generation for a record.
 *
 * THROWS on failure, and the caller decides. Both callers treat an embedding as
 * worth attempting and never worth failing the write that triggered it, so both
 * log and drop — but they log, which is the difference between "AI Search is off
 * for this collection" and "AI Search is on and has been failing since install".
 *
 * `tenantId` is the tenant of the write that caused this embedding. It used to be
 * documented as mandatory because the hook ran on the global pool with no
 * `zveltio.current_tenant` GUC set; since the host moved to `emitAsync` and made
 * `ctx.db` resolve the request's tenant transaction (H-12), that is no longer so
 * — the GUC is set and the column DEFAULT would find it. Passing it is still
 * better: it states the tenant at the call site instead of depending on which
 * connection this happens to run on. `null` means "use the session's tenant".
 */
export async function triggerEmbedding(
  db: Database,
  collection: string,
  recordId: string,
  record: Record<string, any>,
  tenantId: string | null = null,
): Promise<void> {
  // Check if AI Search is enabled on the collection.
  //
  // Not caught: a broken lookup here used to become `null`, which reads as
  // "AI Search is off" and returns quietly. Every embedding on the instance would
  // stop for a reason nobody could see. The caller in engine/index.ts logs and
  // drops, which is the right place to decide that.
  const collMeta = await (db as any)
    .selectFrom('zvd_collections')
    .select([
      'ai_search_enabled',
      'ai_search_field',
      'ai_embed_excluded_fields',
    ])
    .where('name', '=', collection)
    .executeTakeFirst();

  if (!collMeta?.ai_search_enabled) return;

  const textField: string | null = collMeta.ai_search_field ?? null;
  const excludedFields = parseExcludedFields(collMeta.ai_embed_excluded_fields, collection);

  const rawText = extractText(record, textField, excludedFields);
  if (!rawText.trim()) return;

  const provider = aiProviderManager.getDefault();
  if (!provider?.embed) {
    // A collection with ai_search_enabled and no embedder is a configured
    // feature that does nothing. Silence here meant the operator saw an empty
    // `zvd_ai_embeddings` and no reason for it.
    throw new Error(
      `collection "${collection}" has ai_search_enabled, but no configured AI provider supports embeddings ` +
        `(use OpenAI or Ollama, or turn AI Search off for this collection)`,
    );
  }

  const textToEmbed = rawText.slice(0, 8000); // Truncate — most models have a token limit
  const { embedding, model } = await provider.embed(textToEmbed);
  const vectorLiteral = JSON.stringify(embedding);

  await sql`
    INSERT INTO zvd_ai_embeddings
      (collection, record_id, field, text_content, embedding, model, tenant_id, updated_at)
    VALUES (
      ${collection},
      ${recordId},
      ${textField ?? '_auto'},
      ${rawText.slice(0, 2000)},
      ${vectorLiteral}::vector,
      ${model},
      -- Mirrors the column DEFAULT rather than trusting the argument. An
      -- explicit NULL is not "no tenant" to FORCE RLS: the policy compares
      -- tenant_id against the GUC, NULL = anything is NULL, and the row is
      -- refused with a policy violation. A caller that omits the tenant should
      -- get the session's, not a rejected insert.
      COALESCE(
        ${tenantId}::uuid,
        NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid
      ),
      NOW()
    )
    -- tenant_id leads the conflict target, matching the unique key after
    -- migration 006. It has to move with the constraint or every upsert fails
    -- with "no unique or exclusion constraint matching the ON CONFLICT
    -- specification".
    ON CONFLICT (tenant_id, collection, record_id, field)
    DO UPDATE SET
      text_content = EXCLUDED.text_content,
      embedding    = EXCLUDED.embedding,
      model        = EXCLUDED.model,
      tenant_id    = EXCLUDED.tenant_id,
      updated_at   = NOW()
  `.execute(db);
}
