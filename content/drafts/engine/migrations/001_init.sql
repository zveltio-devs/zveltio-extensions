-- Draft content management
CREATE TABLE IF NOT EXISTS zv_content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  record_id UUID NOT NULL,
  draft_data JSONB NOT NULL DEFAULT '{}',
  base_version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','rejected','published')),
  notes TEXT,
  scheduled_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_collection_publish_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL UNIQUE,
  require_review BOOLEAN NOT NULL DEFAULT false,
  allow_self_publish BOOLEAN NOT NULL DEFAULT true,
  notify_roles TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_publish_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES zv_content_drafts(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','failed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_collection_record ON zv_content_drafts(collection, record_id);
CREATE INDEX IF NOT EXISTS idx_drafts_status ON zv_content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_publish_schedule_pending ON zv_publish_schedule(scheduled_at) WHERE status = 'pending';
