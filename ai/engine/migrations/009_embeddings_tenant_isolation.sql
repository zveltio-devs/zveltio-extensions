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
DROP POLICY IF EXISTS tenant_isolation_ai_embeddings ON zvd_ai_embeddings;
ALTER TABLE zvd_ai_embeddings NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zvd_ai_embeddings DISABLE ROW LEVEL SECURITY;
DROP INDEX IF EXISTS idx_zvd_ai_embeddings_tenant;
ALTER TABLE zvd_ai_embeddings DROP COLUMN IF EXISTS tenant_id;
