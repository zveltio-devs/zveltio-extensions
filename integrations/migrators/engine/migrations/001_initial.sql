-- 001_initial.sql — integrations/migrators
--
-- SaaS data migrators (HubSpot / Notion / Airtable → Zveltio collections).
-- Connections hold the source API token ENCRYPTED (AES-256-GCM with
-- FIELD_ENCRYPTION_KEY, same practice as the engine's mail/AI key storage);
-- runs are the audit trail of every import.

CREATE TABLE IF NOT EXISTS zv_migrator_connections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source     TEXT NOT NULL CHECK (source IN ('hubspot','notion','airtable')),
  name       TEXT NOT NULL,
  token_enc  TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_migrator_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id     UUID REFERENCES zv_migrator_connections(id) ON DELETE SET NULL,
  source            TEXT NOT NULL,
  source_object     TEXT NOT NULL,
  target_collection TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed')),
  total_rows        INT NOT NULL DEFAULT 0,
  imported_rows     INT NOT NULL DEFAULT 0,
  error             TEXT,
  created_by        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);
