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
