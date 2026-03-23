-- Customer loyalty
CREATE TABLE IF NOT EXISTS zvd_pos_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  loyalty_points INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(18,2) NOT NULL DEFAULT 0,
  visit_count INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Held/parked orders
CREATE TABLE IF NOT EXISTS zvd_pos_held_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES zvd_pos_sessions(id),
  cashier_id UUID NOT NULL,
  label TEXT,
  lines JSONB NOT NULL DEFAULT '[]',
  customer_id UUID REFERENCES zvd_pos_customers(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cash movements (float in/out during shift)
CREATE TABLE IF NOT EXISTS zvd_pos_cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES zvd_pos_sessions(id),
  type TEXT NOT NULL CHECK (type IN ('float_in','float_out','drop','payout')),
  amount NUMERIC(18,2) NOT NULL,
  reason TEXT,
  cashier_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Loyalty points log
CREATE TABLE IF NOT EXISTS zvd_pos_loyalty_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES zvd_pos_customers(id),
  order_id UUID REFERENCES zvd_pos_orders(id),
  delta INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add to orders
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES zvd_pos_customers(id);
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS loyalty_points_earned INT NOT NULL DEFAULT 0;
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INT NOT NULL DEFAULT 0;
ALTER TABLE zvd_pos_orders ADD COLUMN IF NOT EXISTS loyalty_discount NUMERIC(18,2) NOT NULL DEFAULT 0;

-- Z-report table (end-of-day summary)
CREATE TABLE IF NOT EXISTS zvd_pos_z_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES zvd_pos_sessions(id) UNIQUE,
  total_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_refunds NUMERIC(18,2) NOT NULL DEFAULT 0,
  net_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  cash_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  card_sales NUMERIC(18,2) NOT NULL DEFAULT 0,
  order_count INT NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
