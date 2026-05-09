-- Migration 005: invoicing.client_id → FK to zvd_contacts(id)
--
-- Rationale: invoicing previously stored client_id as TEXT/UUID without a foreign
-- key, so an invoice could reference a non-existent contact. After alpha.67 the
-- CRM extension is the canonical owner of zvd_contacts; this migration establishes
-- referential integrity.
--
-- Safety:
--   - Both columns are already UUID (002_enterprise) or TEXT (001_init); we
--     normalise to UUID and add the FK with ON DELETE SET NULL so deleting a
--     contact preserves historical invoices but disconnects them.
--   - The FK is added with NOT VALID, then VALIDATE CONSTRAINT separately, so
--     the table is not blocked while existing rows are checked.
--   - Adds an index for the FK to keep joins fast.
--
-- Rollback: ALTER TABLE zvd_invoices DROP CONSTRAINT zvd_invoices_client_fk;

DO $$
BEGIN
  -- Normalise client_id type to UUID if currently TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zvd_invoices'
      AND column_name = 'client_id'
      AND data_type = 'text'
  ) THEN
    -- Drop NULL/empty strings so the cast doesn't fail
    UPDATE zvd_invoices SET client_id = NULL WHERE client_id = '' OR client_id IS NULL;
    ALTER TABLE zvd_invoices ALTER COLUMN client_id TYPE UUID USING client_id::uuid;
  END IF;
END$$;

-- Only attach the FK if zvd_contacts exists. If CRM is not installed, skip silently —
-- invoicing still works, but referential integrity is unenforced until CRM is added.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zvd_contacts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'zvd_invoices' AND constraint_name = 'zvd_invoices_client_fk'
    ) THEN
      ALTER TABLE zvd_invoices
        ADD CONSTRAINT zvd_invoices_client_fk
        FOREIGN KEY (client_id) REFERENCES zvd_contacts(id) ON DELETE SET NULL NOT VALID;

      -- Validate after add — if existing data violates, this fails loudly and
      -- the user is informed rather than silently corrupting data.
      ALTER TABLE zvd_invoices VALIDATE CONSTRAINT zvd_invoices_client_fk;
    END IF;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_zvd_invoices_client_fk ON zvd_invoices(client_id);
