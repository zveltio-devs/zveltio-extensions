-- CRM pipeline stages
CREATE TABLE IF NOT EXISTS zvd_crm_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#888888',
  sort_order INT NOT NULL DEFAULT 0,
  probability_pct INT NOT NULL DEFAULT 0 CHECK (probability_pct BETWEEN 0 AND 100),
  is_won BOOLEAN NOT NULL DEFAULT false,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRM custom fields
CREATE TABLE IF NOT EXISTS zvd_crm_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact','organization','transaction')),
  name TEXT NOT NULL,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text','number','date','boolean','select','multiselect','url','email','phone')),
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entity_type, name)
);

-- CRM activities timeline
CREATE TABLE IF NOT EXISTS zvd_crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact','organization','transaction')),
  entity_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call','email','meeting','note','task','stage_change','deal_created','deal_won','deal_lost')),
  title TEXT NOT NULL,
  body TEXT,
  outcome TEXT,
  duration_minutes INT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRM email sequences
CREATE TABLE IF NOT EXISTS zvd_crm_email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lead scoring rules
CREATE TABLE IF NOT EXISTS zvd_crm_lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL,
  score INT NOT NULL DEFAULT 0,
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (contact_id)
);

-- Wire the FK from transactions.pipeline_stage_id (created in 001) to pipeline stages (created above)
DO $$ BEGIN
  ALTER TABLE zvd_transactions ADD CONSTRAINT fk_txn_pipeline_stage
    FOREIGN KEY (pipeline_stage_id) REFERENCES zvd_crm_pipeline_stages(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_crm_activities_entity ON zvd_crm_activities(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_lead_scores_score ON zvd_crm_lead_scores(score DESC);
