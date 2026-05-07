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
