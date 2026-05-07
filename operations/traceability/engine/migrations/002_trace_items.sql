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
