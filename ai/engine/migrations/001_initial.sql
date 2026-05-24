-- 001_initial.sql
--
-- Consolidated initial schema for the `ai` extension.
--
-- Squashed from the per-version migration files that lived in this
-- folder during alpha. The project is pre-1.0 and no extension has
-- shipped to production, so collapsing the history into one file is
-- safe — there is no installed base whose `zv_migrations` table
-- already records versions 002+. New deployments install the full
-- extension schema in a single migration; further schema changes
-- ship as `002_*.sql`, `003_*.sql`, ... going forward.
--
-- Source files (applied in this order):
--   • 001_ai_init.sql
--   • 002_embeddings.sql
--   • 003_search_config.sql
--   • 004_decision_step.sql
--   • 005_task_trigger.sql
--   • 006_query.sql
--   • 007_embed_excluded.sql
--   • 008_memory.sql
--   • 009_embeddings_tenant_isolation.sql

-- ── from 001_ai_init.sql ──
-- Migration 011: AI providers, prompt templates, chat sessions, RAG documents

-- AI provider configurations (DB-stored, editable via Studio)
CREATE TABLE IF NOT EXISTS zv_ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,   -- 'openai', 'anthropic', 'ollama', 'custom'
  label TEXT NOT NULL,
  api_key TEXT,                -- encrypted in production
  base_url TEXT,
  default_model TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prompt templates
CREATE TABLE IF NOT EXISTS zv_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  system_prompt TEXT NOT NULL,
  user_template TEXT,          -- Handlebars-like {{variable}} placeholders
  variables JSONB DEFAULT '[]', -- [{ name, description, required }]
  category TEXT DEFAULT 'general',
  provider TEXT,               -- preferred provider, null = any
  model TEXT,                  -- preferred model, null = default
  temperature NUMERIC(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2048,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zv_prompt_templates_category ON zv_prompt_templates(category);

-- AI chat sessions
CREATE TABLE IF NOT EXISTS zv_ai_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'default',
  model TEXT,
  context TEXT,                -- system message / persona
  messages JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zv_ai_chats_user ON zv_ai_chats(user_id, created_at DESC);

-- RAG document chunks (for semantic search)
CREATE TABLE IF NOT EXISTS zv_rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  source_url TEXT,
  source_type TEXT DEFAULT 'manual',  -- 'manual', 'url', 'file', 'collection'
  collection TEXT,
  record_id TEXT,
  namespace TEXT DEFAULT 'default',
  metadata JSONB DEFAULT '{}',
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zv_rag_documents_namespace ON zv_rag_documents(namespace);
CREATE INDEX IF NOT EXISTS idx_zv_rag_documents_source ON zv_rag_documents(source_type, collection);

-- Default prompt templates
INSERT INTO zv_prompt_templates (name, description, system_prompt, user_template, category)
VALUES
  (
    'sql_helper',
    'Generates SQL queries from natural language',
    'You are a PostgreSQL expert. Generate safe, read-only SQL queries. Return only the SQL, no explanations.',
    'Write a SQL query to: {{request}}',
    'developer'
  ),
  (
    'content_writer',
    'Writes content based on a brief',
    'You are a professional content writer. Write clear, engaging content following the instructions.',
    'Write {{type}} about: {{topic}}\n\nTone: {{tone}}\nLength: {{length}} words',
    'content'
  ),
  (
    'summarizer',
    'Summarizes long text',
    'You are a text summarizer. Create concise, accurate summaries preserving key information.',
    'Summarize the following text in {{length}} words:\n\n{{text}}',
    'general'
  )
ON CONFLICT (name) DO NOTHING;

-- ── from 002_embeddings.sql ──
-- 032_ai_embeddings.sql
-- pgvector + embeddings table for AI Search

-- Enable pgvector extension (requires PostgreSQL with pgvector installed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings table per record per field
CREATE TABLE IF NOT EXISTS zvd_ai_embeddings (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  collection   TEXT        NOT NULL,
  record_id    TEXT        NOT NULL,
  field        TEXT        NOT NULL DEFAULT '_auto',  -- field embedded or '_auto' = all
  text_content TEXT        NOT NULL DEFAULT '',       -- text that generated the embedding
  embedding    vector(1536),                          -- OpenAI text-embedding-3-small dimension
  model        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (collection, record_id, field)
);

CREATE INDEX IF NOT EXISTS idx_zvd_ai_embeddings_lookup
  ON zvd_ai_embeddings (collection, record_id);

-- Cosine similarity index (IVFFlat — requires at least 1 row in table to be useful)
-- Created with lists=100; adjust to rows/1000 in production
CREATE INDEX IF NOT EXISTS idx_zvd_ai_embeddings_ivfflat
  ON zvd_ai_embeddings USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- AI Search columns on zvd_collections
ALTER TABLE zvd_collections ADD COLUMN IF NOT EXISTS ai_search_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zvd_collections ADD COLUMN IF NOT EXISTS ai_search_field   TEXT    DEFAULT NULL;

COMMENT ON COLUMN zvd_collections.ai_search_enabled IS 'Enable auto-embedding on create/update';
COMMENT ON COLUMN zvd_collections.ai_search_field   IS 'Field to embed; NULL = concat all text fields';

-- ── from 003_search_config.sql ──
-- 033_ai_search_config.sql
-- Per-collection AI Search configuration table.
-- Enables auto-embedding on create/update for selected fields.

CREATE TABLE IF NOT EXISTS zvd_ai_search_config (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  collection  TEXT        NOT NULL,
  fields      TEXT[]      NOT NULL DEFAULT '{}',  -- fields to index: ['title', 'description']
  namespace   TEXT        NOT NULL DEFAULT 'default',
  is_enabled  BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection, namespace)
);

COMMENT ON TABLE zvd_ai_search_config IS
  'Per-collection configuration for automatic AI embedding generation.';
COMMENT ON COLUMN zvd_ai_search_config.fields IS
  'Array of field names to concatenate for embedding. Empty = all text fields.';

-- ── from 004_decision_step.sql ──
-- 034_ai_decision_step.sql
-- Documents the ai_decision step type added to the flow executor.
-- Note: zvd_flow_steps is defined in the flows extension, not the core engine.
-- This migration is intentionally a no-op; the ai_decision type is enforced in code.

SELECT 1;

-- ── from 005_task_trigger.sql ──
-- Migration 036: Add 'ai_task' as valid trigger type for zv_flows
-- Idempotent: drops and re-adds constraint

ALTER TABLE zv_flows
  DROP CONSTRAINT IF EXISTS zv_flows_trigger_type_check;

ALTER TABLE zv_flows
  ADD CONSTRAINT zv_flows_trigger_type_check
  CHECK (trigger_type IN ('manual', 'on_create', 'on_update', 'on_delete', 'cron', 'webhook', 'ai_task'));

-- ── from 006_query.sql ──
-- 044_ai_query.sql
-- AI Query history and saved queries (Text-to-SQL)

CREATE TABLE IF NOT EXISTS zv_ai_queries (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  prompt        TEXT        NOT NULL,
  generated_sql TEXT,
  result_count  INT,
  execution_ms  INT,
  ai_analysis   TEXT,
  chart_config  JSONB,
  is_saved      BOOLEAN     NOT NULL DEFAULT false,
  title         TEXT,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_queries_user ON zv_ai_queries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_queries_saved ON zv_ai_queries(user_id) WHERE is_saved = true;

-- ── from 007_embed_excluded.sql ──
-- 050_ai_embed_excluded_fields.sql
-- Adds per-collection field-level PII control for AI embeddings.
--
-- Problem: when ai_search_field is NULL, triggerEmbedding concatenates ALL
-- string fields, potentially sending PII (CNP, salary, address…) to the AI
-- provider. This column lets admins explicitly exclude sensitive fields while
-- keeping the "embed everything" convenience for non-sensitive collections.
--
-- Usage: set ai_embed_excluded_fields = ARRAY['cnp','salary','phone'] on the
-- collection. Fields in this list are stripped before text is sent for embedding.

ALTER TABLE zvd_collections
  ADD COLUMN IF NOT EXISTS ai_embed_excluded_fields TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN zvd_collections.ai_embed_excluded_fields IS
  'Field names excluded from AI embedding (PII/sensitive data control). '
  'Applied when ai_search_field is NULL (full-record embedding mode). '
  'Example: ARRAY[''cnp'',''salary'',''iban'']';

-- ── from 008_memory.sql ──
-- Migration 052: AI Memory — per-user key-value context store for ZveltioAI

CREATE TABLE IF NOT EXISTS zv_ai_memory (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  context_key  TEXT        NOT NULL,
  content      TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, context_key)
);

CREATE INDEX IF NOT EXISTS idx_zv_ai_memory_user ON zv_ai_memory(user_id);

-- ── from 009_embeddings_tenant_isolation.sql ──
-- 009_embeddings_tenant_isolation.sql
--
-- Multi-tenant isolation for AI embeddings.
--
-- The original `zvd_ai_embeddings` table from 002_embeddings.sql is keyed
-- on (collection, record_id, field) with NO tenant scoping. In a
-- multi-tenant deployment that means:
--
--   - Tenant A's `contacts` embeddings sit in the same table as Tenant B's
--     `contacts` embeddings.
--   - `POST /ext/ai/search { collection: 'contacts' }` filters only by
--     `collection`, so a user in Tenant A receives semantic-search hits
--     from Tenant B's records — including the `text_content` column,
--     which literally contains the source row's text (names, emails,
--     contract clauses, …).
--
-- This migration:
--   1. Adds a nullable `tenant_id` column that defaults to whatever the
--      session's `zveltio.current_tenant` GUC is at INSERT time, so
--      existing INSERTs in ai.ts and ai-embed-hook.ts pick up the value
--      automatically when run inside the tenant transaction.
--   2. Backs the column with an index so per-tenant queries don't scan
--      the whole table.
--   3. Enables + FORCE ROW LEVEL SECURITY with a policy comparing
--      `tenant_id` against `current_setting('zveltio.current_tenant')`.
--      FORCE matters: without it the engine connects as table owner and
--      Postgres lets the owner bypass policies. With it, even a
--      poorly-written route that forgets to filter by tenant cannot
--      return cross-tenant rows.
--
-- Single-tenant deployments (no tenantMiddleware → no SET LOCAL) keep
-- working because rows then have `tenant_id IS NULL` and the policy
-- below also allows NULL when the GUC is empty.

ALTER TABLE zvd_ai_embeddings
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Backfill: in pre-existing single-tenant deployments tenant_id stays NULL.
-- The default for new rows pulls from the session GUC so application code
-- doesn't have to know about the column.
ALTER TABLE zvd_ai_embeddings
  ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zvd_ai_embeddings_tenant
  ON zvd_ai_embeddings (tenant_id, collection);

ALTER TABLE zvd_ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_ai_embeddings FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_ai_embeddings ON zvd_ai_embeddings;
CREATE POLICY tenant_isolation_ai_embeddings ON zvd_ai_embeddings
  USING (
    -- Single-tenant mode (no GUC): the policy must allow NULL rows so
    -- legacy data is still readable; multi-tenant mode requires the GUC
    -- to match the row's tenant_id.
    NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
    OR tenant_id IS NULL
    OR tenant_id::text = current_setting('zveltio.current_tenant', true)
  )
  WITH CHECK (
    NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
    OR tenant_id IS NULL
    OR tenant_id::text = current_setting('zveltio.current_tenant', true)
  );

-- Loud warning if pre-existing rows have NULL tenant_id in a deployment
-- that has any populated tenant. Operator should backfill.
DO $$
DECLARE
  null_count BIGINT;
  has_tenants BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO null_count FROM zvd_ai_embeddings WHERE tenant_id IS NULL;
  SELECT EXISTS(SELECT 1 FROM zv_tenants) INTO has_tenants;
  IF null_count > 0 AND has_tenants THEN
    RAISE WARNING
      '[ai-embeddings] % rows have tenant_id IS NULL but the engine has provisioned tenants. '
      'These embeddings are visible to ALL tenants. Backfill with: '
      'UPDATE zvd_ai_embeddings SET tenant_id = ''<correct-tenant-id>'' WHERE tenant_id IS NULL',
      null_count;
  END IF;
END $$;

-- DOWN

-- ── DOWN from 009_embeddings_tenant_isolation.sql ──
DROP POLICY IF EXISTS tenant_isolation_ai_embeddings ON zvd_ai_embeddings;
ALTER TABLE zvd_ai_embeddings NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_ai_embeddings DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_zvd_ai_embeddings_tenant;
ALTER TABLE zvd_ai_embeddings DROP COLUMN IF EXISTS tenant_id;

-- ── DOWN from 008_memory.sql ──
DROP INDEX IF EXISTS idx_zv_ai_memory_user;
DROP TABLE IF EXISTS zv_ai_memory;

-- ── DOWN from 007_embed_excluded.sql ──
-- ALTER TABLE zvd_collections DROP COLUMN IF EXISTS ai_embed_excluded_fields;

-- ── DOWN from 006_query.sql ──
DROP INDEX IF EXISTS idx_ai_queries_saved;
DROP INDEX IF EXISTS idx_ai_queries_user;
DROP TABLE IF EXISTS zv_ai_queries;

-- ── DOWN from 005_task_trigger.sql ──
ALTER TABLE zv_flows DROP CONSTRAINT IF EXISTS zv_flows_trigger_type_check;
ALTER TABLE zv_flows
  ADD CONSTRAINT zv_flows_trigger_type_check
  CHECK (trigger_type IN ('manual', 'on_create', 'on_update', 'on_delete', 'cron', 'webhook'));

-- ── DOWN from 004_decision_step.sql ──
SELECT 1;

-- ── DOWN from 003_search_config.sql ──
DROP TABLE IF EXISTS zvd_ai_search_config;

-- ── DOWN from 002_embeddings.sql ──
ALTER TABLE zvd_collections DROP COLUMN IF EXISTS ai_search_field;
ALTER TABLE zvd_collections DROP COLUMN IF EXISTS ai_search_enabled;
DROP INDEX IF EXISTS idx_zvd_ai_embeddings_ivfflat;
DROP INDEX IF EXISTS idx_zvd_ai_embeddings_lookup;
DROP TABLE IF EXISTS zvd_ai_embeddings;

-- ── DOWN from 001_ai_init.sql ──
DROP INDEX IF EXISTS idx_zv_rag_documents_source;
DROP INDEX IF EXISTS idx_zv_rag_documents_namespace;
DROP TABLE IF EXISTS zv_rag_documents;
DROP INDEX IF EXISTS idx_zv_ai_chats_user;
DROP TABLE IF EXISTS zv_ai_chats;
DROP INDEX IF EXISTS idx_zv_prompt_templates_category;
DROP TABLE IF EXISTS zv_prompt_templates;
DROP TABLE IF EXISTS zv_ai_providers;
