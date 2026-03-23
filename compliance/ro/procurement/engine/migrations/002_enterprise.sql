-- Supplier contracts
CREATE TABLE IF NOT EXISTS zv_ro_contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number          TEXT NOT NULL UNIQUE,
  supplier_id     UUID REFERENCES zv_ro_suppliers(id),
  supplier_name   TEXT NOT NULL,
  supplier_cui    TEXT NOT NULL,
  title           TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'services' CHECK (type IN ('services','goods','works','framework')),
  value           NUMERIC(14,2),
  currency        TEXT NOT NULL DEFAULT 'RON',
  start_date      DATE,
  end_date        DATE,
  auto_renew      BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','expired','cancelled','terminated')),
  file_url        TEXT,
  notes           TEXT,
  created_by      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goods reception notes (NIR)
CREATE TABLE IF NOT EXISTS zv_ro_reception_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number          TEXT NOT NULL UNIQUE,
  order_id        UUID REFERENCES zv_ro_purchase_orders(id),
  supplier_id     UUID REFERENCES zv_ro_suppliers(id),
  supplier_name   TEXT NOT NULL,
  date            DATE NOT NULL,
  items           JSONB NOT NULL DEFAULT '[]',
  total_value     NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency        TEXT NOT NULL DEFAULT 'RON',
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','confirmed','disputed')),
  discrepancies   TEXT,
  confirmed_by    TEXT,
  confirmed_at    TIMESTAMPTZ,
  created_by      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supplier performance evaluations
CREATE TABLE IF NOT EXISTS zv_ro_supplier_evaluations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id     UUID NOT NULL REFERENCES zv_ro_suppliers(id),
  period          TEXT NOT NULL, -- e.g. '2024-Q1'
  quality_score   INT NOT NULL CHECK (quality_score BETWEEN 1 AND 5),
  delivery_score  INT NOT NULL CHECK (delivery_score BETWEEN 1 AND 5),
  price_score     INT NOT NULL CHECK (price_score BETWEEN 1 AND 5),
  overall_score   NUMERIC(3,2) GENERATED ALWAYS AS ((quality_score + delivery_score + price_score) / 3.0) STORED,
  notes           TEXT,
  evaluated_by    TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (supplier_id, period)
);

ALTER TABLE zv_ro_purchase_orders ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES zv_ro_contracts(id) ON DELETE SET NULL;
ALTER TABLE zv_ro_purchase_orders ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent'));
ALTER TABLE zv_ro_purchase_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE zv_ro_purchase_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_contracts_supplier ON zv_ro_contracts(supplier_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON zv_ro_contracts(status, end_date);
CREATE INDEX IF NOT EXISTS idx_reception_notes_order ON zv_ro_reception_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_supplier_eval ON zv_ro_supplier_evaluations(supplier_id, period);
