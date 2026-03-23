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
  mime_type TEXT NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_media_files_mime ON zv_media_files(mime_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_media_files_uploaded ON zv_media_files(uploaded_by) WHERE deleted_at IS NULL;
