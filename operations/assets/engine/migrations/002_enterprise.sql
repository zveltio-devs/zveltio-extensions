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
ALTER TABLE zvd_assets ADD COLUMN IF NOT EXISTS accumulated_depreciation NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_assets ADD COLUMN IF NOT EXISTS depreciation_account_id UUID;
ALTER TABLE zvd_assets ADD COLUMN IF NOT EXISTS accumulated_dep_account_id UUID;
