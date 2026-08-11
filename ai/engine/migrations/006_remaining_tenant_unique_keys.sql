-- The two unique keys 005 missed.
--
-- 005 widened `zv_ai_features.feature_key`, `zv_ai_providers.name` and
-- `zvd_ai_search_config(collection, namespace)`. It left two behind, and the
-- detector it was written from — a unique constraint on a table that HAS
-- `tenant_id`, where `tenant_id` is not among the constrained columns — still
-- returns both:
--
--   SELECT c.conname, pg_get_constraintdef(c.oid)
--     FROM pg_constraint c JOIN pg_class t ON t.oid = c.conrelid
--    WHERE c.contype = 'u'
--      AND EXISTS (SELECT 1 FROM pg_attribute a
--                   WHERE a.attrelid = t.oid AND a.attname = 'tenant_id')
--      AND NOT EXISTS (SELECT 1 FROM pg_attribute a
--                       WHERE a.attrelid = t.oid AND a.attname = 'tenant_id'
--                         AND a.attnum = ANY(c.conkey));
--
-- Both were reproduced on a live database before this was written, and both fail
-- in the way that is hardest to act on, because FORCE RLS hides the row that
-- caused the conflict.
--
-- zvd_ai_embeddings (collection, record_id, field)
--   Company A indexes ('contacts', 'rec-1', 'content'). Company B indexes the
--   same triple and gets
--
--     ERROR: new row violates row-level security policy (USING expression)
--            for table "zvd_ai_embeddings"
--
--   while `SELECT count(*)` in company B's session returns 0. An RLS error about
--   a row that, to that company, does not exist.
--
--   Reachable directly, not only in theory: `POST /ext/ai/embed` takes
--   `record_id` as a free-form string from the request body. The automatic
--   embedding hook passes real record uuids, which is why this never showed up
--   there.
--
-- zv_ai_memory (user_id, context_key)
--   One person who belongs to two companies. Storing the assistant's memory key
--   'prefs' in the first one blocks the second:
--
--     ERROR: duplicate key value violates unique constraint
--            "zv_ai_memory_user_id_context_key_key"
--
--   A user's memory of working at company A is not the same fact as their memory
--   of working at company B, and the key should not be shared between them.
--
-- Widening is strictly more permissive: every dataset valid under the narrow key
-- stays valid under the wider one, so this cannot fail on an existing install.
-- Rows written before the column existed are backfilled to the default tenant,
-- which is where they came from.
--
-- The `ON CONFLICT` clauses move with the constraints. There are two, both in
-- this extension: `routes/ai.ts` (POST /embed) and `lib/ai-embed-hook.ts`. An
-- inference-style `ON CONFLICT (a, b, c)` needs a unique index on exactly those
-- columns, so leaving either one behind turns every upsert into
-- "there is no unique or exclusion constraint matching the ON CONFLICT
-- specification".

-- ── zvd_ai_embeddings ───────────────────────────────────────────────────────

UPDATE zvd_ai_embeddings SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
 WHERE tenant_id IS NULL;

ALTER TABLE zvd_ai_embeddings
  DROP CONSTRAINT IF EXISTS zvd_ai_embeddings_collection_record_id_field_key;

ALTER TABLE zvd_ai_embeddings
  ADD CONSTRAINT zvd_ai_embeddings_collection_record_id_field_key
  UNIQUE (tenant_id, collection, record_id, field);

-- ── zv_ai_memory ────────────────────────────────────────────────────────────

UPDATE zv_ai_memory SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
 WHERE tenant_id IS NULL;

ALTER TABLE zv_ai_memory
  DROP CONSTRAINT IF EXISTS zv_ai_memory_user_id_context_key_key;

ALTER TABLE zv_ai_memory
  ADD CONSTRAINT zv_ai_memory_user_id_context_key_key
  UNIQUE (tenant_id, user_id, context_key);

-- ── DOWN ────────────────────────────────────────────────────────────────────
-- Narrowing back can fail on data that is legal under the wide key, which is the
-- point of the change. Left commented, as the reverse of a widening always is.
--
-- ALTER TABLE zvd_ai_embeddings DROP CONSTRAINT IF EXISTS zvd_ai_embeddings_collection_record_id_field_key;
-- ALTER TABLE zvd_ai_embeddings ADD CONSTRAINT zvd_ai_embeddings_collection_record_id_field_key
--   UNIQUE (collection, record_id, field);
-- ALTER TABLE zv_ai_memory DROP CONSTRAINT IF EXISTS zv_ai_memory_user_id_context_key_key;
-- ALTER TABLE zv_ai_memory ADD CONSTRAINT zv_ai_memory_user_id_context_key_key
--   UNIQUE (user_id, context_key);
