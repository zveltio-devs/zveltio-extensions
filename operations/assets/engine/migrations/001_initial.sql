-- 001_initial.sql
--
-- Consolidated initial schema for the `operations/assets` extension.
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
-- Fixed Assets extension schema

CREATE TABLE IF NOT EXISTS zvd_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'equipment' CHECK (category IN ('building','equipment','vehicle','furniture','software','land','other')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disposed','in_maintenance')),
  purchase_date DATE NOT NULL,
  purchase_cost NUMERIC(15,2) NOT NULL,
  residual_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  useful_life_years INT NOT NULL DEFAULT 5,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line','declining_balance','none')),
  accumulated_depreciation NUMERIC(18,2) NOT NULL DEFAULT 0,
  current_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  location TEXT,
  serial_number TEXT,
  supplier TEXT,
  warranty_expiry DATE,
  image_url TEXT,
  disposed_at DATE,
  disposal_value NUMERIC(15,2),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_assets_category ON zvd_assets(category);
CREATE INDEX IF NOT EXISTS idx_zvd_assets_status ON zvd_assets(status);

CREATE TABLE IF NOT EXISTS zvd_asset_depreciation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES zvd_assets(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  book_value_after NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, period)
);

CREATE INDEX IF NOT EXISTS idx_zvd_asset_depreciation_asset ON zvd_asset_depreciation(asset_id);

CREATE TABLE IF NOT EXISTS zvd_asset_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES zvd_assets(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'scheduled' CHECK (type IN ('scheduled','repair','inspection')),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  cost NUMERIC(15,2),
  description TEXT NOT NULL,
  performed_by TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','overdue')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_asset_maintenance_asset ON zvd_asset_maintenance(asset_id);
CREATE INDEX IF NOT EXISTS idx_zvd_asset_maintenance_status ON zvd_asset_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_zvd_asset_maintenance_date ON zvd_asset_maintenance(scheduled_date);

-- ── from 002_enterprise.sql ──
-- Insurance policies
CREATE TABLE IF NOT EXISTS zvd_asset_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES zvd_assets(id) ON DELETE CASCADE,
  policy_number TEXT NOT NULL,
  insurer TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'property',
  insured_value NUMERIC(18,2) NOT NULL,
  premium NUMERIC(18,2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asset revaluations
CREATE TABLE IF NOT EXISTS zvd_asset_revaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES zvd_assets(id) ON DELETE CASCADE,
  revaluation_date DATE NOT NULL,
  previous_value NUMERIC(18,2) NOT NULL,
  new_value NUMERIC(18,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'market' CHECK (method IN ('market','cost','expert_opinion')),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asset transfers between locations
CREATE TABLE IF NOT EXISTS zvd_asset_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES zvd_assets(id),
  from_location TEXT,
  to_location TEXT NOT NULL,
  transfer_date DATE NOT NULL,
  reason TEXT,
  transferred_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link depreciation to accounting journal entries
ALTER TABLE zvd_asset_depreciation ADD COLUMN IF NOT EXISTS journal_entry_id UUID;
ALTER TABLE zvd_asset_depreciation ADD COLUMN IF NOT EXISTS is_posted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zvd_assets ADD COLUMN IF NOT EXISTS depreciation_account_id UUID;
ALTER TABLE zvd_assets ADD COLUMN IF NOT EXISTS accumulated_dep_account_id UUID;


-- Defensive enrichment for tables created by a pre-fix version of this file
-- (routes use current_value / useful_life_years).
ALTER TABLE zvd_assets ADD COLUMN IF NOT EXISTS current_value NUMERIC(15,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_assets ADD COLUMN IF NOT EXISTS useful_life_years INT NOT NULL DEFAULT 5;
ALTER TABLE zvd_assets ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;
