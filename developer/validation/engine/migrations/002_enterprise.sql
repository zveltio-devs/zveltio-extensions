-- Test cases for validation rules
CREATE TABLE IF NOT EXISTS zvd_validation_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL, -- soft ref to zv_validation_rules (core engine table)
  label TEXT NOT NULL,
  input_value TEXT NOT NULL,
  expected_result BOOLEAN NOT NULL,
  last_run_result BOOLEAN,
  last_run_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_validation_test_cases_rule ON zvd_validation_test_cases(rule_id);

-- Rule groups (combine multiple rules)
CREATE TABLE IF NOT EXISTS zvd_validation_rule_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  collection TEXT NOT NULL,
  field_name TEXT NOT NULL,
  description TEXT,
  logic TEXT NOT NULL DEFAULT 'AND' CHECK (logic IN ('AND','OR')),
  rule_ids UUID[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bulk import log
CREATE TABLE IF NOT EXISTS zvd_validation_import_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  imported_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
