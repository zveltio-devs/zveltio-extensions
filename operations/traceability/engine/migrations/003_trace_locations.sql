-- Locations before lots so trace_lots can FK reference trace_locations
CREATE TABLE IF NOT EXISTS trace_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse VARCHAR(100) NOT NULL,
  row VARCHAR(20),
  shelf VARCHAR(20),
  description TEXT,
  temperature_zone VARCHAR CHECK (temperature_zone IN ('ambient','chilled','frozen'))
);
