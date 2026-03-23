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
  useful_life_months INT NOT NULL DEFAULT 60,
  depreciation_method TEXT NOT NULL DEFAULT 'straight_line' CHECK (depreciation_method IN ('straight_line','declining_balance','none')),
  accumulated_depreciation NUMERIC(15,2) NOT NULL DEFAULT 0,
  current_book_value NUMERIC(15,2) NOT NULL,
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

CREATE INDEX idx_zvd_assets_category ON zvd_assets(category);
CREATE INDEX idx_zvd_assets_status ON zvd_assets(status);

CREATE TABLE IF NOT EXISTS zvd_asset_depreciation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES zvd_assets(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  book_value_after NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (asset_id, period)
);

CREATE INDEX idx_zvd_asset_depreciation_asset ON zvd_asset_depreciation(asset_id);

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

CREATE INDEX idx_zvd_asset_maintenance_asset ON zvd_asset_maintenance(asset_id);
CREATE INDEX idx_zvd_asset_maintenance_status ON zvd_asset_maintenance(status);
CREATE INDEX idx_zvd_asset_maintenance_date ON zvd_asset_maintenance(scheduled_date);
