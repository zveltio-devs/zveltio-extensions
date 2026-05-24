-- 001_initial.sql
--
-- Consolidated initial schema for the `crm` extension.
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
--   • 003_missing_columns.sql

-- ── from 001_init.sql ──
-- CRM extension — contacts, organizations, transactions (deals)

CREATE TABLE IF NOT EXISTS zvd_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  organization_id UUID,
  owner_id TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade: add columns missing from pre-extension zvd_contacts schema
ALTER TABLE zvd_contacts ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE zvd_contacts ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE zvd_contacts ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE zvd_contacts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE zvd_contacts ADD COLUMN IF NOT EXISTS created_by TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner ON zvd_contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON zvd_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON zvd_contacts(email);

CREATE TABLE IF NOT EXISTS zvd_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  address TEXT,
  owner_id TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade: add columns missing from pre-extension zvd_organizations schema
ALTER TABLE zvd_organizations ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE zvd_organizations ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE zvd_organizations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE zvd_organizations ADD COLUMN IF NOT EXISTS created_by TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_orgs_owner ON zvd_organizations(owner_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_crm_contact_org') THEN
    ALTER TABLE zvd_contacts ADD CONSTRAINT fk_crm_contact_org
      FOREIGN KEY (organization_id) REFERENCES zvd_organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS zvd_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_id UUID REFERENCES zvd_contacts(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES zvd_organizations(id) ON DELETE SET NULL,
  owner_id TEXT,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RON',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','won','lost','on_hold')),
  pipeline_stage_id UUID,
  stage_changed_at TIMESTAMPTZ,
  expected_close_date DATE,
  lead_score INT NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade: add columns missing from pre-extension zvd_transactions schema
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS pipeline_stage_id UUID;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS lead_score INT NOT NULL DEFAULT 0;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE zvd_transactions ADD COLUMN IF NOT EXISTS created_by TEXT;

CREATE INDEX IF NOT EXISTS idx_crm_txn_owner ON zvd_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_txn_contact ON zvd_transactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_txn_status ON zvd_transactions(status);

-- ── from 002_enterprise.sql ──
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

-- ── from 003_missing_columns.sql ──
-- CRM extension — fix schema mismatches between routes.ts and 001_init.sql

-- zvd_contacts: add columns queried / inserted by routes
ALTER TABLE zvd_contacts
  ADD COLUMN IF NOT EXISTS job_title   TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS source      TEXT,
  ADD COLUMN IF NOT EXISTS metadata    JSONB NOT NULL DEFAULT '{}';

-- Contact ↔ Organization many-to-many join table (used in GET /contacts/:id and GET /organizations/:id)
CREATE TABLE IF NOT EXISTS zvd_contact_organizations (
  contact_id      UUID NOT NULL REFERENCES zvd_contacts(id)      ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES zvd_organizations(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (contact_id, organization_id)
);

-- zvd_organizations: add columns queried / inserted by routes
ALTER TABLE zvd_organizations
  ADD COLUMN IF NOT EXISTS legal_name       TEXT,
  ADD COLUMN IF NOT EXISTS tax_id           TEXT,
  ADD COLUMN IF NOT EXISTS registration_no  TEXT,
  ADD COLUMN IF NOT EXISTS type             TEXT NOT NULL DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS logo_url         TEXT,
  ADD COLUMN IF NOT EXISTS is_active        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email            TEXT,
  ADD COLUMN IF NOT EXISTS metadata         JSONB NOT NULL DEFAULT '{}';

-- zvd_transactions: name was NOT NULL in the old core schema — relax it, but only if
-- the column exists (on pre-extension installs name may not exist at all).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zvd_transactions' AND column_name = 'name'
  ) THEN
    ALTER TABLE zvd_transactions ALTER COLUMN name DROP NOT NULL;
  END IF;
END $$;

-- Remove old status CHECK (open/won/lost/on_hold) so routes can use draft/pending/completed/cancelled/refunded
ALTER TABLE zvd_transactions DROP CONSTRAINT IF EXISTS zvd_transactions_status_check;

-- zvd_transactions: add columns queried / inserted by routes
ALTER TABLE zvd_transactions
  ADD COLUMN IF NOT EXISTS type         TEXT NOT NULL DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS number       TEXT,
  ADD COLUMN IF NOT EXISTS tax_amount   NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date     DATE,
  ADD COLUMN IF NOT EXISTS paid_date    DATE,
  ADD COLUMN IF NOT EXISTS line_items   JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS reference    TEXT,
  ADD COLUMN IF NOT EXISTS metadata     JSONB NOT NULL DEFAULT '{}';

