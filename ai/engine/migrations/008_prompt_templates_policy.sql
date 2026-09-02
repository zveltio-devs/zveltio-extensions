-- 008_prompt_templates_policy.sql
--
-- `007_prompt_templates_tenant.sql` gave the table `tenant_id`, a default, a
-- backfill and an index — everything except the policy. It said so on purpose:
--
--   > No route changes accompany this. The extension's handlers use `ctx.db`,
--   > the request-scoped proxy, so the policy the host reconciler installs at
--   > boot filters reads on its own.
--
-- That is the one sentence in it that is wrong, and it is wrong in a way that
-- cannot be seen from this file. `reconcileExtensionTenantRLS` selects its work
-- with
--
--     SELECT tablename, policyname FROM pg_policies
--      WHERE policyname LIKE 'tenant\_isolation\_%'
--
-- — it ADOPTS tables that already declare a policy, so an extension's stated
-- intent is honoured and isolation is never invented for a catalogue that
-- deliberately has none. A table that has never had a policy is invisible to
-- it. So 007 handed the job to something whose entry condition it did not meet,
-- and the outcome is a table with `tenant_id` on every row and nothing reading
-- it: no policy means no filter, and `ctx.db` returns every company's rows.
--
-- Confirmed on a database built from current master: `relrowsecurity = false`,
-- zero policies.
--
-- This is the second table found in that exact state today. The first was
-- `zv_checklist_scoring_schemes` and its two siblings, where firm B could read
-- AND overwrite firm A's rows through five routes (workflow/checklists 006).
-- The shape is the same both times: the column was added, the enforcement was
-- delegated to something that could not act, and nothing checked.
--
-- What made both of them findable is now a gate rather than a reading:
-- `check-tenant-boundary` used to count tables carrying `tenant_id` and report
-- them as tenant-scoped without ever asking whether one was policed. It now
-- fails on a tenant-scoped table with no row level security unless the table is
-- declared, with a reason, in `quality-gates/tenant-boundary.json`.

ALTER TABLE zv_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_prompt_templates FORCE  ROW LEVEL SECURITY;

-- FORCE, because the engine connects as this table's owner and Postgres lets an
-- owner past its own policies without it.

DROP POLICY IF EXISTS tenant_isolation_zv_prompt_templates ON zv_prompt_templates;
CREATE POLICY tenant_isolation_zv_prompt_templates ON zv_prompt_templates
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- Same predicate as the eight tables `004_tenant_rls.sql` covers, so this joins
-- that set rather than becoming a second, slightly different rule.

-- No backfill: 007 already set every NULL row to the default tenant and gave the
-- column a GUC default, so every row carries a tenant before this file runs.
-- Verified in the catalog rather than assumed.

-- DOWN

DROP POLICY IF EXISTS tenant_isolation_zv_prompt_templates ON zv_prompt_templates;
ALTER TABLE zv_prompt_templates NO FORCE ROW LEVEL SECURITY;
ALTER TABLE zv_prompt_templates DISABLE ROW LEVEL SECURITY;
