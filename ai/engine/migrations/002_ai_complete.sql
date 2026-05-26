-- Migration: 002_ai_complete
--
-- Fixes four schema gaps in the AI extension that were latent because
-- the routes use a local `reqDb(c): any` helper (no type-checking) and
-- almost every read/write wraps with `.catch(() => …)` returning empty,
-- so missing tables surfaced as "empty UI" instead of crashloops.
--
-- Tables added:
--
--   zv_ai_features        — admin feature-flag gating for AI capabilities
--                           (chat / search / generate / decide).
--                           /api/ai/admin/features* was returning [] silently.
--
--   zv_ai_usage           — per-call usage tracking (tokens + latency)
--                           used for billing reports + provider analytics.
--                           Every /api/ai/chat and /api/ai/embed INSERTed
--                           into this and the INSERT silently failed.
--
--   zv_ai_conversations   — chat session metadata (per-user threads).
--   zv_ai_messages        — individual chat messages (rows ordered by
--                           created_at within a conversation).
--
--                           lib/zveltio-ai/engine.ts called
--                           getConversationHistory() which always
--                           returned []. persistConversation() silently
--                           threw — every chat was one-shot with no
--                           memory across calls. routes/zveltio-ai.ts
--                           uses the same backing tables under the
--                           alias `zv_ai_chat_history` — the route is
--                           changed in code to use `zv_ai_messages`
--                           directly so both paths share storage.

CREATE TABLE IF NOT EXISTS zv_ai_features (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key   TEXT        NOT NULL UNIQUE,           -- e.g. 'chat', 'search', 'generate', 'decide'
  display_name  TEXT        NOT NULL,
  description   TEXT,
  is_enabled    BOOLEAN     NOT NULL DEFAULT true,
  config        JSONB       NOT NULL DEFAULT '{}',     -- per-feature settings
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the standard features so the admin UI lists something on first install.
INSERT INTO zv_ai_features (feature_key, display_name, description, is_enabled) VALUES
  ('chat',     'Conversational chat', 'LLM-backed multi-turn chat assistant', true),
  ('search',   'Semantic search',     'pgvector embedding search across collections', true),
  ('generate', 'Generative actions',  'AI-assisted record generation and bulk fill', true),
  ('decide',   'Decision step',       'AI decision branch in automation flows', true),
  ('embed',    'Embeddings',          'Background embedding generation for RAG', true)
ON CONFLICT (feature_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS zv_ai_usage (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT        NOT NULL,                -- e.g. 'openai', 'anthropic'
  model           TEXT        NOT NULL,                -- e.g. 'gpt-4o-mini'
  operation       TEXT        NOT NULL CHECK (operation IN ('chat', 'embed', 'query', 'generate', 'decide')),
  prompt_tokens   INTEGER     NOT NULL DEFAULT 0,
  response_tokens INTEGER     NOT NULL DEFAULT 0,
  latency_ms      INTEGER     NOT NULL DEFAULT 0,
  user_id         TEXT        REFERENCES "user"(id) ON DELETE SET NULL,
  tenant_id       UUID,                                -- nullable; set by hook if available
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON zv_ai_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user       ON zv_ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider   ON zv_ai_usage(provider, operation, created_at DESC);

CREATE TABLE IF NOT EXISTS zv_ai_conversations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title       TEXT,
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conv_user ON zv_ai_conversations(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS zv_ai_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES zv_ai_conversations(id) ON DELETE CASCADE,
  user_id         TEXT        REFERENCES "user"(id) ON DELETE SET NULL,
  role            TEXT        NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content         TEXT        NOT NULL,
  metadata        JSONB       NOT NULL DEFAULT '{}',   -- model, tokens, tool calls, etc.
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_msg_conv ON zv_ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_msg_user ON zv_ai_messages(user_id, created_at DESC);
