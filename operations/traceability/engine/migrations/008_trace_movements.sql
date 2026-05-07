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
