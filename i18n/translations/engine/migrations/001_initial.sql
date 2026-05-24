-- 001_initial.sql
--
-- Consolidated initial schema for the `i18n/translations` extension.
--
-- Squashed from the per-version migration files that lived in this
-- folder during alpha. The project is pre-1.0 and no extension has
-- shipped to production, so collapsing the history into one file is
-- safe — there is no installed base whose `zv_migrations` table
-- already records versions 002+. New deployments install the full
-- extension schema in a single migration; further schema changes
-- ship as `002_*.sql`, `003_*.sql`, ... going forward.
--
-- Source files (applied in this order):
--   • 001_init.sql
--   • 002_enterprise.sql

-- ── from 001_init.sql ──
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

-- ── from 002_enterprise.sql ──
-- Translation import/export jobs
CREATE TABLE IF NOT EXISTS zvd_translation_import_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format        TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json','csv','po','xliff')),
  locale        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  keys_total    INT NOT NULL DEFAULT 0,
  keys_imported INT NOT NULL DEFAULT 0,
  keys_skipped  INT NOT NULL DEFAULT 0,
  error         TEXT,
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ
);

-- Translation memory (approved segments for reuse)
CREATE TABLE IF NOT EXISTS zvd_translation_memory (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text   TEXT NOT NULL,
  target_text   TEXT NOT NULL,
  locale        TEXT NOT NULL,
  context       TEXT,
  quality_score INT NOT NULL DEFAULT 100 CHECK (quality_score BETWEEN 0 AND 100),
  usage_count   INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_text, locale)
);

-- Translation glossary terms
CREATE TABLE IF NOT EXISTS zvd_translation_glossary (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term        TEXT NOT NULL,
  locale      TEXT NOT NULL,
  translation TEXT NOT NULL,
  definition  TEXT,
  forbidden   BOOLEAN NOT NULL DEFAULT false,  -- terms that must NOT be used
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (term, locale)
);

ALTER TABLE zvd_translation_keys ADD COLUMN IF NOT EXISTS max_length INT;
ALTER TABLE zvd_translation_keys ADD COLUMN IF NOT EXISTS is_pluralized BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zvd_translation_keys ADD COLUMN IF NOT EXISTS screenshot_url TEXT;

ALTER TABLE zvd_translations ADD COLUMN IF NOT EXISTS char_count INT GENERATED ALWAYS AS (char_length(value)) STORED;
ALTER TABLE zvd_translations ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE zvd_translations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_translation_memory_locale ON zvd_translation_memory(locale, quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_translation_glossary_locale ON zvd_translation_glossary(locale, term);

