-- Migration 003: link POS to canonical zvd_contacts and zvd_products.
--
-- Before alpha.67 POS maintained its own zvd_pos_customers and stored product_id
-- as TEXT (not FK). This migration:
--   1. Adds canonical_contact_id UUID to zvd_pos_customers, FK → zvd_contacts(id).
--      Existing zvd_pos_customers rows can be migrated by a future job; they
--      remain authoritative until linked.
--   2. Normalises zvd_pos_order_lines.product_id from TEXT to UUID and adds FK
--      → zvd_products(id) when inventory extension is installed.
--   3. Adds canonical_contact_id to zvd_pos_orders so an order can be linked
--      to a CRM contact directly (not just through pos_customers).
--
-- Soft contract: if CRM/Inventory extensions are NOT installed, the FKs are
-- skipped; POS still operates standalone.

-- Add warehouse_id to sessions so POS sales can be attributed to a warehouse
-- and trigger correct stock movements via the inventory service.
ALTER TABLE zvd_pos_sessions
  ADD COLUMN IF NOT EXISTS warehouse_id UUID;

ALTER TABLE zvd_pos_customers
  ADD COLUMN IF NOT EXISTS canonical_contact_id UUID;

CREATE INDEX IF NOT EXISTS idx_pos_customers_canonical ON zvd_pos_customers(canonical_contact_id);

ALTER TABLE zvd_pos_orders
  ADD COLUMN IF NOT EXISTS canonical_contact_id UUID;

CREATE INDEX IF NOT EXISTS idx_pos_orders_canonical ON zvd_pos_orders(canonical_contact_id);

-- Normalise product_id type from TEXT to UUID (when it is text).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zvd_pos_order_lines' AND column_name = 'product_id' AND data_type = 'text'
  ) THEN
    UPDATE zvd_pos_order_lines SET product_id = NULL WHERE product_id = '' OR product_id IS NULL;
    -- Best-effort cast — rows with non-UUID values get nulled out
    BEGIN
      ALTER TABLE zvd_pos_order_lines ALTER COLUMN product_id TYPE UUID USING NULLIF(product_id, '')::uuid;
    EXCEPTION WHEN invalid_text_representation THEN
      UPDATE zvd_pos_order_lines SET product_id = NULL
        WHERE product_id IS NOT NULL
          AND product_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
      ALTER TABLE zvd_pos_order_lines ALTER COLUMN product_id TYPE UUID USING NULLIF(product_id, '')::uuid;
    END;
  END IF;
END$$;

-- Attach FKs only if canonical owners (CRM, Inventory) are installed.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zvd_contacts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pos_customers_canonical_fk') THEN
      ALTER TABLE zvd_pos_customers
        ADD CONSTRAINT pos_customers_canonical_fk
        FOREIGN KEY (canonical_contact_id) REFERENCES zvd_contacts(id) ON DELETE SET NULL NOT VALID;
      ALTER TABLE zvd_pos_customers VALIDATE CONSTRAINT pos_customers_canonical_fk;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pos_orders_canonical_fk') THEN
      ALTER TABLE zvd_pos_orders
        ADD CONSTRAINT pos_orders_canonical_fk
        FOREIGN KEY (canonical_contact_id) REFERENCES zvd_contacts(id) ON DELETE SET NULL NOT VALID;
      ALTER TABLE zvd_pos_orders VALIDATE CONSTRAINT pos_orders_canonical_fk;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zvd_products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'pos_order_lines_product_fk') THEN
      ALTER TABLE zvd_pos_order_lines
        ADD CONSTRAINT pos_order_lines_product_fk
        FOREIGN KEY (product_id) REFERENCES zvd_products(id) ON DELETE SET NULL NOT VALID;
      ALTER TABLE zvd_pos_order_lines VALIDATE CONSTRAINT pos_order_lines_product_fk;
    END IF;
  END IF;
END$$;
