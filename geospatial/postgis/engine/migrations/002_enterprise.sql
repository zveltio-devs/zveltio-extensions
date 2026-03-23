-- Location history tracking (for moving assets/vehicles/users)
CREATE TABLE IF NOT EXISTS zv_geo_location_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,  -- 'user', 'asset', 'vehicle', or any collection name
  entity_id   TEXT NOT NULL,
  location    GEOGRAPHY(POINT, 4326) NOT NULL,
  accuracy_m  NUMERIC(8,2),
  altitude_m  NUMERIC(8,2),
  speed_kmh   NUMERIC(8,2),
  heading_deg NUMERIC(5,2),
  source      TEXT NOT NULL DEFAULT 'api',  -- 'api','gps','manual'
  metadata    JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Geofence entry/exit events
CREATE TABLE IF NOT EXISTS zv_geofence_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geofence_id UUID NOT NULL REFERENCES zv_geofences(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  event_type  TEXT NOT NULL CHECK (event_type IN ('enter','exit','dwell')),
  location    GEOGRAPHY(POINT, 4326),
  metadata    JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Geofence automation rules (trigger notifications/webhooks on enter/exit)
CREATE TABLE IF NOT EXISTS zv_geofence_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geofence_id UUID NOT NULL REFERENCES zv_geofences(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  trigger_on  TEXT NOT NULL CHECK (trigger_on IN ('enter','exit','both')),
  entity_type TEXT,  -- NULL = all entity types
  action_type TEXT NOT NULL DEFAULT 'webhook' CHECK (action_type IN ('webhook','notification','email')),
  action_config JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  triggered_count INT NOT NULL DEFAULT 0,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Saved routes / paths
CREATE TABLE IF NOT EXISTS zv_geo_routes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  waypoints   JSONB NOT NULL DEFAULT '[]',  -- [{lat, lng, name}]
  path        GEOGRAPHY(LINESTRING, 4326),
  distance_m  NUMERIC(12,2),
  metadata    JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geo_history_entity ON zv_geo_location_history(entity_type, entity_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_geo_history_location ON zv_geo_location_history USING gist(location);
CREATE INDEX IF NOT EXISTS idx_geofence_events_fence ON zv_geofence_events(geofence_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_geofence_events_entity ON zv_geofence_events(entity_type, entity_id, occurred_at DESC);
