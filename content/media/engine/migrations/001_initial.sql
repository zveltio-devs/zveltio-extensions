-- 001_initial.sql
--
-- Consolidated initial schema for the `content/media` extension.
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
-- Media / File Management
CREATE TABLE IF NOT EXISTS zv_media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES zv_media_folders(id) ON DELETE CASCADE,
  description TEXT,
  cover_image_id UUID,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS zv_media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES zv_media_folders(id) ON DELETE SET NULL,
  original_filename TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  duration_seconds NUMERIC(10,3),
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  alt_text TEXT,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS zv_media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#888888',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_media_file_tags (
  file_id UUID NOT NULL REFERENCES zv_media_files(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES zv_media_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (file_id, tag_id)
);

CREATE TABLE IF NOT EXISTS zv_media_favorites (
  user_id TEXT NOT NULL,
  file_id UUID NOT NULL REFERENCES zv_media_files(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_media_files_folder ON zv_media_files(folder_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_files_mime ON zv_media_files(mimetype) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded ON zv_media_files(uploaded_by) WHERE deleted_at IS NULL;

-- ── from 002_enterprise.sql ──
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

