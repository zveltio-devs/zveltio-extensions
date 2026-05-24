-- 001_initial.sql
--
-- Consolidated initial schema for the `operations/traceability` extension.
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
--   • 001_trace_suppliers.sql
--   • 002_trace_items.sql
--   • 003_trace_locations.sql
--   • 004_trace_lots.sql
--   • 005_trace_recipes.sql
--   • 006_trace_production_orders.sql
--   • 007_trace_lot_consumptions.sql
--   • 008_trace_movements.sql
--   • 009_trace_recalls.sql
--   • 010_trace_dispatches.sql

-- ── from 001_trace_suppliers.sql ──
CREATE TABLE IF NOT EXISTS trace_suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  cui VARCHAR(20),
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── from 002_trace_items.sql ──
CREATE TABLE IF NOT EXISTS trace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('raw', 'semi', 'finished')),
  category VARCHAR(100),
  default_unit VARCHAR NOT NULL CHECK (default_unit IN ('kg','g','l','ml','buc','cutie','sac','palet')),
  allergens JSONB DEFAULT '[]',
  shelf_life_days INTEGER,
  storage_conditions TEXT,
  gtin VARCHAR(14),
  min_stock_alert NUMERIC(10,3),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trace_items_code ON trace_items(code);
CREATE INDEX IF NOT EXISTS idx_trace_items_type ON trace_items(type);

-- ── from 003_trace_locations.sql ──
-- Locations before lots so trace_lots can FK reference trace_locations
CREATE TABLE IF NOT EXISTS trace_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse VARCHAR(100) NOT NULL,
  row VARCHAR(20),
  shelf VARCHAR(20),
  description TEXT,
  temperature_zone VARCHAR CHECK (temperature_zone IN ('ambient','chilled','frozen'))
);

-- ── from 004_trace_lots.sql ──
CREATE TABLE IF NOT EXISTS trace_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES trace_items(id),
  lot_type VARCHAR NOT NULL CHECK (lot_type IN ('inbound','internal','outbound')),
  lot_number VARCHAR(100) NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'quarantine' CHECK (status IN ('quarantine','available','exhausted','recalled','returned')),
  quantity_initial NUMERIC(12,3) NOT NULL,
  quantity_remaining NUMERIC(12,3) NOT NULL,
  unit VARCHAR NOT NULL CHECK (unit IN ('kg','g','l','ml','buc','cutie','sac','palet')),
  supplier_id UUID REFERENCES trace_suppliers(id),
  supplier_lot_ref VARCHAR(100),
  best_before_date DATE,
  production_date DATE,
  reception_date DATE,
  invoice_ref VARCHAR(100),
  document_ids JSONB DEFAULT '[]',
  location_id UUID REFERENCES trace_locations(id),
  location_notes TEXT,
  parent_lot_ids JSONB DEFAULT '[]',
  sscc VARCHAR(18),
  gtin_scanned VARCHAR(14),
  received_by UUID,
  released_by UUID,
  released_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lots_item ON trace_lots(item_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON trace_lots(status);
CREATE INDEX IF NOT EXISTS idx_lots_expiry ON trace_lots(best_before_date);
CREATE INDEX IF NOT EXISTS idx_lots_lot_number ON trace_lots(lot_number);

-- ── from 005_trace_recipes.sql ──
CREATE TABLE IF NOT EXISTS trace_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  output_item_id UUID NOT NULL REFERENCES trace_items(id),
  name VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  output_quantity NUMERIC(12,3) NOT NULL,
  output_unit VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trace_recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES trace_recipes(id),
  item_id UUID NOT NULL REFERENCES trace_items(id),
  quantity_per_unit NUMERIC(12,4) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  is_critical_allergen BOOLEAN DEFAULT false,
  notes TEXT
);

-- ── from 006_trace_production_orders.sql ──
CREATE TABLE IF NOT EXISTS trace_production_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  recipe_id UUID REFERENCES trace_recipes(id),
  output_lot_id UUID REFERENCES trace_lots(id),
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_progress','completed','cancelled')),
  planned_quantity NUMERIC(12,3),
  actual_quantity NUMERIC(12,3),
  unit VARCHAR(20),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  operator_id UUID,
  haccp_checks JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_production_orders_status ON trace_production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_recipe ON trace_production_orders(recipe_id);

-- ── from 007_trace_lot_consumptions.sql ──
CREATE TABLE IF NOT EXISTS trace_lot_consumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  production_order_id UUID NOT NULL REFERENCES trace_production_orders(id),
  lot_id UUID NOT NULL REFERENCES trace_lots(id),
  quantity_used NUMERIC(12,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  scanned_by UUID,
  scanned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consumptions_order ON trace_lot_consumptions(production_order_id);
CREATE INDEX IF NOT EXISTS idx_consumptions_lot ON trace_lot_consumptions(lot_id);

-- ── from 008_trace_movements.sql ──
CREATE TABLE IF NOT EXISTS trace_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES trace_lots(id),
  type VARCHAR NOT NULL CHECK (type IN ('reception','consumption','dispatch','waste','return','transfer','adjustment')),
  quantity NUMERIC(12,3) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  reference_type VARCHAR(50),
  reference_id UUID,
  reference_number VARCHAR(100),
  from_location_id UUID REFERENCES trace_locations(id),
  to_location_id UUID REFERENCES trace_locations(id),
  customer_id UUID,
  notes TEXT,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movements_lot ON trace_movements(lot_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON trace_movements(type);
CREATE INDEX IF NOT EXISTS idx_movements_date ON trace_movements(performed_at);

-- ── from 009_trace_recalls.sql ──
CREATE TABLE IF NOT EXISTS trace_recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES trace_lots(id),
  scope VARCHAR NOT NULL CHECK (scope IN ('internal','market_withdrawal','consumer_recall')),
  reason TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','cancelled')),
  initiated_by UUID,
  initiated_at TIMESTAMPTZ DEFAULT now(),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  affected_downstream_lots JSONB DEFAULT '[]',
  notification_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recalls_status ON trace_recalls(status);
CREATE INDEX IF NOT EXISTS idx_recalls_lot ON trace_recalls(lot_id);

-- ── from 010_trace_dispatches.sql ──
-- Pending/confirmed dispatches — created automatically when an invoice with lot_id
-- in line metadata is detected via the event bus (invoice:created → record.created).
-- Also supports manual (direct) dispatches without an invoice.
CREATE TABLE IF NOT EXISTS trace_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- invoice link (null for direct dispatches)
  invoice_id UUID,
  invoice_number VARCHAR(100),
  invoice_line_id UUID,

  -- customer
  customer_id UUID,
  customer_name VARCHAR(255),

  -- what is being dispatched
  lot_id UUID REFERENCES trace_lots(id),
  item_name_from_invoice VARCHAR(255),
  quantity_invoiced NUMERIC(12,3),
  quantity_dispatched NUMERIC(12,3),        -- filled at confirmation
  unit VARCHAR(20) NOT NULL DEFAULT 'buc',

  -- lifecycle
  status VARCHAR NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_dispatches_status ON trace_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_dispatches_lot ON trace_dispatches(lot_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_invoice ON trace_dispatches(invoice_id);

