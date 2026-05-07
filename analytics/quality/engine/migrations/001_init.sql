-- Data quality scans
CREATE TABLE IF NOT EXISTS zv_quality_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  scan_type TEXT NOT NULL DEFAULT 'full' CHECK (scan_type IN ('full','nulls','duplicates','patterns','ranges')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  total_records INT NOT NULL DEFAULT 0,
  issues_found INT NOT NULL DEFAULT 0,
  error TEXT,
  triggered_by TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quality issues found during scans
CREATE TABLE IF NOT EXISTS zv_quality_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES zv_quality_scans(id) ON DELETE CASCADE,
  collection TEXT NOT NULL,
  record_id TEXT,
  field_name TEXT,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','error','critical')),
  description TEXT NOT NULL,
  value_sample TEXT,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_by TEXT,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_scans_collection ON zv_quality_scans(collection);
CREATE INDEX IF NOT EXISTS idx_quality_issues_scan ON zv_quality_issues(scan_id);
CREATE INDEX IF NOT EXISTS idx_quality_issues_collection ON zv_quality_issues(collection);
