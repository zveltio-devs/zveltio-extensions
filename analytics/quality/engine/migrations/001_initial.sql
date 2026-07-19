-- 001_initial.sql
--
-- Consolidated initial schema for the `analytics/quality` extension.
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

-- ── from 002_enterprise.sql ──
-- Quality rules (custom validation expectations)
CREATE TABLE IF NOT EXISTS zvd_quality_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  field_name TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('not_null','unique','pattern','range','reference','custom')),
  rule_config JSONB NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info','warning','error','critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quality score history (trend tracking)
CREATE TABLE IF NOT EXISTS zvd_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  scan_id UUID NOT NULL REFERENCES zv_quality_scans(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  total_records INT NOT NULL DEFAULT 0,
  critical_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  warning_count INT NOT NULL DEFAULT 0,
  info_count INT NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SLA targets (expected quality thresholds)
CREATE TABLE IF NOT EXISTS zvd_quality_sla_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL UNIQUE,
  min_score INT NOT NULL DEFAULT 80 CHECK (min_score BETWEEN 0 AND 100),
  max_critical_issues INT NOT NULL DEFAULT 0,
  max_error_issues INT NOT NULL DEFAULT 5,
  alert_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Remediation actions (fix suggestions)
CREATE TABLE IF NOT EXISTS zvd_quality_remediations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES zv_quality_issues(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('set_default','delete_record','manual_review','auto_fix')),
  description TEXT NOT NULL,
  applied_at TIMESTAMPTZ,
  applied_by TEXT,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_scores_collection ON zvd_quality_scores(collection, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_quality_rules_collection ON zvd_quality_rules(collection);


-- Schema enrichment (same pattern as content/media 001): the CORE engine also
-- creates zv_quality_scans / zv_quality_issues (packages/engine 001_initial.sql),
-- so the CREATEs above are skipped there and the core shape lacks columns these
-- routes use. Add them defensively.
ALTER TABLE zv_quality_scans ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE zv_quality_issues ADD COLUMN IF NOT EXISTS dismissed_by TEXT;
ALTER TABLE zv_quality_issues ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;
