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
