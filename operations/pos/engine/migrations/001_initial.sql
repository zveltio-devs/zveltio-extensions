-- 001_initial.sql
--
-- Consolidated initial schema for the `operations/pos` extension.
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
--   • 001_init.sql
--   • 002_enterprise.sql
--   • 003_canonical_link.sql

-- ── from 001_init.sql ──
-- Point of Sale extension schema

CREATE TABLE IF NOT EXISTS zvd_pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_float NUMERIC(15,2) NOT NULL DEFAULT 0,
  closing_float NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_zvd_pos_sessions_cashier ON zvd_pos_sessions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_zvd_pos_sessions_status ON zvd_pos_sessions(status);

CREATE TABLE IF NOT EXISTS zvd_pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES zvd_pos_sessions(id),
  order_number TEXT NOT NULL UNIQUE,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','card','transfer','voucher')),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','voided')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zvd_pos_orders_session ON zvd_pos_orders(session_id);
CREATE INDEX IF NOT EXISTS idx_zvd_pos_orders_status ON zvd_pos_orders(status);
CREATE INDEX IF NOT EXISTS idx_zvd_pos_orders_created ON zvd_pos_orders(created_at);

CREATE TABLE IF NOT EXISTS zvd_pos_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES zvd_pos_orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_zvd_pos_lines_order ON zvd_pos_order_lines(order_id);

-- ── from 002_enterprise.sql ──
-- Customer loyalty
CREATE TABLE IF NOT EXISTS zvd_pos_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  loyalty_points INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(18,2) NOT NULL DEFAULT 0,
  visit_count INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Held/parked orders
CREATE TABLE IF NOT EXISTS zvd_pos_held_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES zvd_pos_sessions(id),
  cashier_id UUID NOT NULL,
  label TEXT,
  lines JSONB NOT NULL DEFAULT '[]',
  customer_id UUID REFERENCES zvd_pos_customers(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cash movements (float in/out during shift)
CREATE TABLE IF NOT EXISTS zvd_pos_cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES zvd_pos_sessions(id),
  type TEXT NOT NULL CHECK (type IN ('float_in','float_out','drop','payout')),
  amount NUMERIC(18,2) NOT NULL,
  reason TEXT,
  cashier_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loyalty points log
CREATE TABLE IF NOT EXISTS zvd_pos_loyalty_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES zvd_pos_customers(id),
  order_id UUID REFERENCES zvd_pos_orders(id),
  delta INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add to orders
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES zvd_pos_customers(id);
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS loyalty_points_earned INT NOT NULL DEFAULT 0;
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INT NOT NULL DEFAULT 0;
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS loyalty_discount NUMERIC(18,2) NOT NULL DEFAULT 0;

-- Z-report table (end-of-day summary)
CREATE TABLE IF NOT EXISTS zvd_pos_z_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES zvd_pos_sessions(id) UNIQUE,
  total_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_refunds NUMERIC(18,2) NOT NULL DEFAULT 0,
  net_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  cash_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  card_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── from 003_canonical_link.sql ──
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

