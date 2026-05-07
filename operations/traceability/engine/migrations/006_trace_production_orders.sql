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
