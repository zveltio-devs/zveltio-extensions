-- 001_initial.sql
--
-- Consolidated initial schema for the `operations/inventory` extension.
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

-- ── from 001_init.sql ──
-- Inventory extension schema

CREATE TABLE IF NOT EXISTS zvd_warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT NOT NULL DEFAULT 'piece' CHECK (unit IN ('piece','kg','liter','box','meter','hour','other')),
  cost_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  reorder_point NUMERIC(10,3) NOT NULL DEFAULT 0,
  reorder_qty NUMERIC(10,3) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  image_url TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_products_sku ON zvd_products(sku);
CREATE INDEX IF NOT EXISTS idx_zvd_products_barcode ON zvd_products(barcode);
CREATE INDEX IF NOT EXISTS idx_zvd_products_category ON zvd_products(category);

CREATE TABLE IF NOT EXISTS zvd_stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES zvd_products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES zvd_warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 0,
  reserved_qty NUMERIC(10,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_zvd_stock_product ON zvd_stock_levels(product_id);
CREATE INDEX IF NOT EXISTS idx_zvd_stock_warehouse ON zvd_stock_levels(warehouse_id);

CREATE TABLE IF NOT EXISTS zvd_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES zvd_products(id),
  warehouse_id UUID NOT NULL REFERENCES zvd_warehouses(id),
  type TEXT NOT NULL CHECK (type IN ('in','out','transfer','adjustment')),
  quantity NUMERIC(10,3) NOT NULL,
  reference TEXT,
  note TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_movements_product ON zvd_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_zvd_movements_warehouse ON zvd_stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_zvd_movements_created ON zvd_stock_movements(created_at);

-- ── from 002_enterprise.sql ──
-- Suppliers
CREATE TABLE IF NOT EXISTS zvd_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms INT DEFAULT 30,
  currency TEXT DEFAULT 'RON',
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS zvd_purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES zvd_suppliers(id),
  warehouse_id UUID REFERENCES zvd_warehouses(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','partial','received','cancelled')),
  expected_date DATE,
  received_date DATE,
  currency TEXT NOT NULL DEFAULT 'RON',
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_purchase_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES zvd_purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES zvd_products(id),
  quantity_ordered NUMERIC(10,4) NOT NULL,
  quantity_received NUMERIC(10,4) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(18,4) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Batch/Lot tracking
CREATE TABLE IF NOT EXISTS zvd_product_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES zvd_products(id),
  warehouse_id UUID NOT NULL REFERENCES zvd_warehouses(id),
  batch_number TEXT NOT NULL,
  lot_number TEXT,
  quantity NUMERIC(10,4) NOT NULL DEFAULT 0,
  expiry_date DATE,
  manufactured_date DATE,
  unit_cost NUMERIC(18,4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id, batch_number)
);

-- Product variants
CREATE TABLE IF NOT EXISTS zvd_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES zvd_products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}',
  unit_price NUMERIC(18,4),
  unit_cost NUMERIC(18,4),
  barcode TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add weighted-avg cost to products
ALTER TABLE zvd_products ADD COLUMN IF NOT EXISTS avg_cost NUMERIC(18,4) DEFAULT 0;
ALTER TABLE zvd_products ADD COLUMN IF NOT EXISTS total_value NUMERIC(18,2) DEFAULT 0;
ALTER TABLE zvd_stock_movements ADD COLUMN IF NOT EXISTS avg_cost_after NUMERIC(18,4);
ALTER TABLE zvd_stock_movements ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES zvd_product_batches(id);
ALTER TABLE zvd_stock_movements ADD COLUMN IF NOT EXISTS po_line_id UUID REFERENCES zvd_purchase_order_lines(id);

