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

CREATE INDEX idx_zvd_products_sku ON zvd_products(sku);
CREATE INDEX idx_zvd_products_barcode ON zvd_products(barcode);
CREATE INDEX idx_zvd_products_category ON zvd_products(category);

CREATE TABLE IF NOT EXISTS zvd_stock_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES zvd_products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES zvd_warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 0,
  reserved_qty NUMERIC(10,3) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, warehouse_id)
);

CREATE INDEX idx_zvd_stock_product ON zvd_stock_levels(product_id);
CREATE INDEX idx_zvd_stock_warehouse ON zvd_stock_levels(warehouse_id);

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

CREATE INDEX idx_zvd_movements_product ON zvd_stock_movements(product_id);
CREATE INDEX idx_zvd_movements_warehouse ON zvd_stock_movements(warehouse_id);
CREATE INDEX idx_zvd_movements_created ON zvd_stock_movements(created_at);
