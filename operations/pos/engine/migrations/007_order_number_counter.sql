-- POS could not record a sale. The handler's INSERT omitted `order_number`,
-- which is `NOT NULL`, so every checkout failed on the constraint — the till
-- was unusable on any install, from the first migration onward.
--
-- This adds the counter the handler needs to produce one.
--
-- Per tenant, not a Postgres sequence. Migration 005 already scoped the unique
-- constraint to `(tenant_id, order_number)`, and the invoicing extension spells
-- out the reason in its own numbering helper: one sequence for the whole
-- instance has no tenant, so two companies sharing an install interleave — the
-- first takes 1, 3, 7 and the second 2, 4, 5 — and each is left with permanent
-- holes in its own receipt numbering. A hole is what an inspection asks about.
--
-- The counter is claimed with `UPDATE … RETURNING` in one statement, so two
-- tills ringing up at the same moment cannot read the same value: the second
-- waits on the row lock and gets the number after it.

CREATE TABLE IF NOT EXISTS zvd_pos_order_counters (
  tenant_id   UUID PRIMARY KEY,
  next_number BIGINT NOT NULL DEFAULT 1,
  prefix      TEXT   NOT NULL DEFAULT 'POS',
  padding     INT    NOT NULL DEFAULT 6,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Same shape as every other table in this extension (migration 002): the GUC
-- supplies the tenant, with the single-tenant default for installs that never
-- provisioned one.
ALTER TABLE zvd_pos_order_counters
  ALTER COLUMN tenant_id SET DEFAULT COALESCE(
    NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );

ALTER TABLE zvd_pos_order_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE zvd_pos_order_counters FORCE ROW LEVEL SECURITY;

-- `zveltio_tenant_scope_ok` rather than a raw `current_setting` comparison,
-- matching migration 002. The engine provides it; it is what makes the
-- single-tenant and provisioned cases read the same in every policy.
DROP POLICY IF EXISTS tenant_isolation_zvd_pos_order_counters ON zvd_pos_order_counters;
CREATE POLICY tenant_isolation_zvd_pos_order_counters ON zvd_pos_order_counters
  USING (zveltio_tenant_scope_ok(tenant_id))
  WITH CHECK (zveltio_tenant_scope_ok(tenant_id));

-- DOWN
DROP TABLE IF EXISTS zvd_pos_order_counters;
