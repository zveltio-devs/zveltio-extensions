-- Prompt templates belong to a company, like every other table this extension owns.
--
-- `004_tenant_rls.sql` gave `tenant_id` to eight of this extension's tables and
-- `005_tenant_scoped_unique_keys.sql` widened their unique keys. `zv_prompt_templates`
-- was in neither. The same campaign, the same shape, one table left out.
--
-- What that omission means today, found while classifying the tenancy boundary:
--
--   * The rows are visible to every company on the instance. There is no
--     `tenant_id`, so the host's RLS reconciler has no column to bind a policy to.
--   * The write route is gated by `checkPermission(user.id, 'admin', '*')`, which a
--     `tenant_admin` passes — the domain comes from AsyncLocalStorage. So company A's
--     administrator creates rows the whole instance reads.
--   * `name` is UNIQUE across the instance, so company A can take a name company B
--     can then never use — and RLS would hide the conflicting row, leaving B with a
--     duplicate-key error naming a template it cannot see. That is exactly the
--     failure `005` was written to remove from the other tables.
--
-- No route changes accompany this. The extension's handlers use `ctx.db`, the
-- request-scoped proxy, so the policy the host reconciler installs at boot filters
-- reads on its own, and the column default below supplies `tenant_id` on insert.

ALTER TABLE zv_prompt_templates ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zv_prompt_templates
  ALTER COLUMN tenant_id SET DEFAULT COALESCE(
    NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );

-- Existing rows go to the default company. On a single-company instance that is
-- every row and nothing changes; on a shared one it is the honest answer, because
-- the row carries no record of who created it beyond `created_by`, and a user may
-- belong to several companies.
UPDATE zv_prompt_templates
   SET tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
 WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_zv_prompt_templates_tenant
  ON zv_prompt_templates (tenant_id, created_at DESC);

-- The unique key, widened. `(tenant_id, name)` lets each company keep its own
-- naming without seeing or blocking anybody else's.
ALTER TABLE zv_prompt_templates DROP CONSTRAINT IF EXISTS zv_prompt_templates_name_key;
ALTER TABLE zv_prompt_templates ADD CONSTRAINT zv_prompt_templates_name_key UNIQUE (tenant_id, name);

DO $$
DECLARE
  orphans BIGINT;
  tenants BIGINT;
BEGIN
  SELECT COUNT(*) INTO tenants FROM zv_tenants;
  SELECT COUNT(*) INTO orphans FROM zv_prompt_templates WHERE tenant_id IS NULL;
  IF orphans > 0 AND tenants > 1 THEN
    RAISE WARNING 'ai/007_prompt_templates_tenant: % prompt template(s) have no tenant_id on a multi-tenant deployment. They are invisible under the new policy until assigned.', orphans;
  END IF;
END $$;
