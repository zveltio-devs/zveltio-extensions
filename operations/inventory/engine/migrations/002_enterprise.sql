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
