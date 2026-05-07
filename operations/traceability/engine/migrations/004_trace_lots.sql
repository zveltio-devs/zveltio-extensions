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
