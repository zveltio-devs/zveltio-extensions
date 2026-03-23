-- Supported locales
CREATE TABLE IF NOT EXISTS zvd_locales (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Translation keys
CREATE TABLE IF NOT EXISTS zvd_translation_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key           TEXT NOT NULL UNIQUE,
  context       TEXT,
  default_value TEXT,
  description   TEXT,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Translated values per locale
CREATE TABLE IF NOT EXISTS zvd_translations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id                UUID NOT NULL REFERENCES zvd_translation_keys(id) ON DELETE CASCADE,
  locale                TEXT NOT NULL REFERENCES zvd_locales(code) ON DELETE CASCADE,
  value                 TEXT NOT NULL,
  is_machine_translated BOOLEAN NOT NULL DEFAULT false,
  reviewed              BOOLEAN NOT NULL DEFAULT false,
  updated_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (key_id, locale)
);

CREATE INDEX IF NOT EXISTS idx_translations_key ON zvd_translations(key_id);
CREATE INDEX IF NOT EXISTS idx_translations_locale ON zvd_translations(locale);

-- Seed default locales
INSERT INTO zvd_locales (code, name, is_default) VALUES
  ('en', 'English', true),
  ('ro', 'Română', false)
ON CONFLICT DO NOTHING;
