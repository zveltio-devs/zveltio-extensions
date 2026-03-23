-- Point of Sale extension schema

CREATE TABLE IF NOT EXISTS zvd_pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_float NUMERIC(15,2) NOT NULL DEFAULT 0,
  closing_float NUMERIC(15,2),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  notes TEXT
);

CREATE INDEX idx_zvd_pos_sessions_cashier ON zvd_pos_sessions(cashier_id);
CREATE INDEX idx_zvd_pos_sessions_status ON zvd_pos_sessions(status);

CREATE TABLE IF NOT EXISTS zvd_pos_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES zvd_pos_sessions(id),
  order_number TEXT NOT NULL UNIQUE,
  customer_id TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','card','transfer','voucher')),
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','voided')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL
);

CREATE INDEX idx_zvd_pos_orders_session ON zvd_pos_orders(session_id);
CREATE INDEX idx_zvd_pos_orders_status ON zvd_pos_orders(status);
CREATE INDEX idx_zvd_pos_orders_created ON zvd_pos_orders(created_at);

CREATE TABLE IF NOT EXISTS zvd_pos_order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES zvd_pos_orders(id) ON DELETE CASCADE,
  product_id TEXT,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL
);

CREATE INDEX idx_zvd_pos_lines_order ON zvd_pos_order_lines(order_id);
