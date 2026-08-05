-- 004_tenant_rls.sql
--
-- Multi-tenant isolation for the AI extension. Follows the canonical template
-- in crm/engine/migrations/002_tenant_rls.sql.
--
-- WHY THIS ARRIVED LAST
--   `zvd_ai_embeddings` was isolated early (001_initial.sql) because it holds
--   copies of user records. Everything else the extension writes — chats,
--   conversations, messages, memory, saved queries, provider config, usage —
--   was left without a tenant column at all, so no policy could scope it and
--   nothing at the database layer separated one tenant's AI history from
--   another's. An external audit flagged the missing RLS; the route handlers
--   filter conversations by `user_id`, so the gap was not directly reachable
--   through them, but it left a single forgotten WHERE clause between a bug and
--   a cross-tenant leak. One such helper existed and is fixed separately.
--
-- WHAT `zv_ai_providers` MEANS HERE
--   Provider rows carry encrypted API keys. Scoping them per tenant is the
--   point: without it, a tenant that configures its own OpenAI key shares it
--   with every other tenant on the instance, and usage lands on whoever's
--   account was configured first.
--
-- SINGLE-TENANT DEPLOYMENTS ARE UNAFFECTED
--   The column DEFAULT resolves to the default tenant when no GUC is set, and
--   `zveltio_tenant_scope_ok` compares against the same value, so a
--   single-tenant install sees every row exactly as before.

-- ── 1. tenant_id column + GUC-backed DEFAULT ────────────────────────────────

ALTER TABLE zv_ai_chats          ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ai_conversations  ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ai_features       ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ai_memory         ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ai_messages       ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ai_providers      ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_ai_queries        ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zvd_ai_search_config ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- zv_ai_usage already declares the column (002_ai_complete.sql); it never had
-- a DEFAULT, so rows written outside an explicit assignment landed NULL.

ALTER TABLE zv_ai_chats          ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
ALTER TABLE zv_ai_conversations  ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
ALTER TABLE zv_ai_features       ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
ALTER TABLE zv_ai_memory         ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
ALTER TABLE zv_ai_messages       ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
ALTER TABLE zv_ai_providers      ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
ALTER TABLE zv_ai_queries        ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
ALTER TABLE zv_ai_usage          ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);
ALTER TABLE zvd_ai_search_config ALTER COLUMN tenant_id SET DEFAULT COALESCE(NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid, '00000000-0000-0000-0000-000000000001'::uuid);

-- ── 2. Backfill existing rows ───────────────────────────────────────────────
--
-- Pre-existing rows predate multi-tenancy in this extension, so they belong to
-- the default tenant. Leaving them NULL would make them invisible under the
-- policy — an upgrade that silently empties an operator's AI history.

UPDATE zv_ai_chats          SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE zv_ai_conversations  SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE zv_ai_features       SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE zv_ai_memory         SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE zv_ai_messages       SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE zv_ai_providers      SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE zv_ai_queries        SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE zv_ai_usage          SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;
UPDATE zvd_ai_search_config SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid WHERE tenant_id IS NULL;

-- ── 3. Indexes for per-tenant filtering ─────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_zv_ai_chats_tenant          ON zv_ai_chats          (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zv_ai_conversations_tenant  ON zv_ai_conversations  (tenant_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_zv_ai_features_tenant       ON zv_ai_features       (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_ai_memory_tenant         ON zv_ai_memory         (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_ai_messages_tenant       ON zv_ai_messages       (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zv_ai_providers_tenant      ON zv_ai_providers      (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_ai_queries_tenant        ON zv_ai_queries        (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zv_ai_usage_tenant          ON zv_ai_usage          (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_zvd_ai_search_config_tenant ON zvd_ai_search_config (tenant_id);

-- ── 4. ENABLE + FORCE row level security ────────────────────────────────────
--
-- FORCE matters: without it the engine connects as table owner and Postgres
-- lets the owner bypass policies, which makes RLS advisory rather than binding.

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zv_ai_chats',
    'zv_ai_conversations',
    'zv_ai_features',
    'zv_ai_memory',
    'zv_ai_messages',
    'zv_ai_providers',
    'zv_ai_queries',
    'zv_ai_usage',
    'zvd_ai_search_config'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation_%I ON %I
      USING (zveltio_tenant_scope_ok(tenant_id))
      WITH CHECK (zveltio_tenant_scope_ok(tenant_id))
    $pol$, tbl, tbl);
  END LOOP;
END $$;

-- ── 5. Loud warning if any row is still unscoped ────────────────────────────

DO $$
DECLARE
  orphans BIGINT;
  tenants BIGINT;
BEGIN
  SELECT COUNT(*) INTO tenants FROM zv_tenants;
  SELECT
    (SELECT COUNT(*) FROM zv_ai_conversations WHERE tenant_id IS NULL) +
    (SELECT COUNT(*) FROM zv_ai_messages      WHERE tenant_id IS NULL) +
    (SELECT COUNT(*) FROM zv_ai_providers     WHERE tenant_id IS NULL)
  INTO orphans;

  IF orphans > 0 AND tenants > 1 THEN
    RAISE WARNING 'ai/004_tenant_rls: % AI row(s) have no tenant_id on a multi-tenant deployment. They are invisible under the new policy until assigned.', orphans;
  END IF;
END $$;
