-- 001_initial.sql
--
-- content/media extension — value-add layer over the core engine's
-- media tables (zv_media_files, zv_media_folders, zv_media_tags,
-- zv_media_file_tags ship with `packages/engine/src/db/migrations/sql/
-- 001_initial.sql`).
--
-- Previously this file re-declared the core media tables with subtly
-- different column names (original_filename / size_bytes / uploaded_by
-- vs the core's original_name / size / created_by). `CREATE TABLE IF
-- NOT EXISTS` then silently dropped the duplicate — but the codegen +
-- runtime queries diverged on which schema was authoritative, hitting
-- "column does not exist" errors at enable time. alpha.118 strips the
-- duplicates and keeps only what this extension actually adds.

-- Schema enrichment: core engine creates zv_media_folders without
-- updated_at / description / cover_image_id / tenant_id columns that
-- the content/media routes expect. Add them as nullable here.
ALTER TABLE zv_media_folders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE zv_media_folders ADD COLUMN IF NOT EXISTS cover_image_id UUID;
ALTER TABLE zv_media_folders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Per-user favorites (core engine doesn't have this)
CREATE TABLE IF NOT EXISTS zv_media_favorites (
  user_id TEXT NOT NULL,
  file_id UUID NOT NULL REFERENCES zv_media_files(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, file_id)
);

-- AI-generated media metadata
CREATE TABLE IF NOT EXISTS zv_media_ai_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES zv_media_files(id) ON DELETE CASCADE UNIQUE,
  ai_labels TEXT[] NOT NULL DEFAULT '{}',
  ai_description TEXT,
  dominant_color TEXT,
  ocr_text TEXT,
  nsfw_score NUMERIC(4,3),
  is_nsfw BOOLEAN NOT NULL DEFAULT false,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media collections (curated albums/galleries)
CREATE TABLE IF NOT EXISTS zv_media_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cover_file_id UUID REFERENCES zv_media_files(id) ON DELETE SET NULL,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_media_collection_files (
  collection_id UUID NOT NULL REFERENCES zv_media_collections(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES zv_media_files(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  added_by TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (collection_id, file_id)
);

-- NOTE: storage quotas are owned by storage/cloud extension (zv_storage_quotas)

-- CDN cache invalidation log
CREATE TABLE IF NOT EXISTS zv_media_cdn_invalidations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_ids TEXT[] NOT NULL DEFAULT '{}',
  paths TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  provider TEXT NOT NULL DEFAULT 'cloudfront',
  invalidation_id TEXT,
  error TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_media_collections_public ON zv_media_collections(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_media_col_files_coll ON zv_media_collection_files(collection_id, sort_order);
