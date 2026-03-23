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

CREATE INDEX idx_quality_scores_collection ON zvd_quality_scores(collection, calculated_at DESC);
CREATE INDEX idx_quality_rules_collection ON zvd_quality_rules(collection);
