-- Migration: 003_ai_memory_columns
--
-- Adds the three columns on zv_ai_memory that lib/zveltio-ai/engine.ts
-- has been reading + writing all along, but which the original
-- 001_initial.sql never created. Surfaced by the schema-drift checker
-- (scripts/schema-drift-check.ts in the engine repo).
--
-- Affected paths:
--   - `importance` is used to rank user memory at AI assistant boot:
--     `.select(['context_key','content','importance'])
--      .orderBy('importance','desc')`
--     Without the column, the SELECT 500s; the surrounding try/catch
--     swallowed it so memory was always empty even when populated.
--
--   - `source` was set to 'user' on every insert to mark the origin
--     of the memory entry (chat-derived vs admin-seeded).
--
--   - `embedding` is the pgvector column powering semantic recall.
--     `WHERE embedding IS NOT NULL ORDER BY embedding <=> :q` was a
--     dead query path because the column didn't exist.

ALTER TABLE zv_ai_memory ADD COLUMN IF NOT EXISTS importance INTEGER NOT NULL DEFAULT 5;
ALTER TABLE zv_ai_memory ADD COLUMN IF NOT EXISTS source     TEXT    NOT NULL DEFAULT 'user';

-- Embedding column only added when pgvector is available. Most installs
-- have it for the existing zvd_ai_embeddings table; if not, the
-- IF NOT EXISTS guard + the DO block prevent the migration from
-- failing on environments without pgvector.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    EXECUTE 'ALTER TABLE zv_ai_memory ADD COLUMN IF NOT EXISTS embedding vector(1536)';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_zv_ai_memory_importance ON zv_ai_memory(user_id, importance DESC);
