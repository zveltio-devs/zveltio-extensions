-- Draft review comments
CREATE TABLE IF NOT EXISTS zv_draft_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES zv_content_drafts(id) ON DELETE CASCADE,
  field_path TEXT,
  comment TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'suggestion' CHECK (type IN ('suggestion','required','info')),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Draft snapshots for diff/comparison
CREATE TABLE IF NOT EXISTS zv_draft_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES zv_content_drafts(id) ON DELETE CASCADE,
  snapshot_data JSONB NOT NULL DEFAULT '{}',
  version INT NOT NULL,
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (draft_id, version)
);

-- Bulk publish jobs
CREATE TABLE IF NOT EXISTS zv_draft_publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_ids UUID[] NOT NULL,
  collection TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  published_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Add extra columns to drafts
ALTER TABLE zv_content_drafts ADD COLUMN IF NOT EXISTS word_count INT;
ALTER TABLE zv_content_drafts ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE zv_content_drafts ADD COLUMN IF NOT EXISTS reviewer_note TEXT;

CREATE INDEX IF NOT EXISTS idx_draft_comments_draft ON zv_draft_review_comments(draft_id);
CREATE INDEX IF NOT EXISTS idx_draft_snapshots_draft ON zv_draft_snapshots(draft_id);
