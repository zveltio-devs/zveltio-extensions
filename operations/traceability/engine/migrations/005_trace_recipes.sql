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
