-- Product variants (size, color, etc.)
CREATE TABLE IF NOT EXISTS zvd_ec_product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES zvd_ec_products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}',
  price NUMERIC(15,2),
  compare_price NUMERIC(15,2),
  cost NUMERIC(15,2),
  stock_qty INT NOT NULL DEFAULT 0,
  weight NUMERIC(10,3),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_ec_variants_product ON zvd_ec_product_variants(product_id);

-- Shipping zones
CREATE TABLE IF NOT EXISTS zvd_ec_shipping_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  countries TEXT[] NOT NULL DEFAULT '{}',
  regions TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shipping rates per zone
CREATE TABLE IF NOT EXISTS zvd_ec_shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zvd_ec_shipping_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'flat' CHECK (type IN ('flat','weight','free_above')),
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_weight NUMERIC(10,3),
  max_weight NUMERIC(10,3),
  free_above_amount NUMERIC(15,2),
  estimated_days_min INT,
  estimated_days_max INT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Tax rules by region
CREATE TABLE IF NOT EXISTS zvd_ec_tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'RO',
  region TEXT,
  rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','physical','digital')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country, region, applies_to)
);

INSERT INTO zvd_ec_tax_rules (name, country, rate, applies_to) VALUES ('TVA Standard RO', 'RO', 19, 'all') ON CONFLICT DO NOTHING;
INSERT INTO zvd_ec_tax_rules (name, country, rate, applies_to) VALUES ('TVA Redus RO', 'RO', 9, 'physical') ON CONFLICT DO NOTHING;

-- Abandoned carts
CREATE TABLE IF NOT EXISTS zvd_ec_abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  customer_email TEXT,
  customer_name TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  recovery_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  recovered_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product reviews
CREATE TABLE IF NOT EXISTS zvd_ec_product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES zvd_ec_products(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES zvd_ec_customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  order_id UUID REFERENCES zvd_ec_orders(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_ec_reviews_product ON zvd_ec_product_reviews(product_id);

-- Add columns to products and orders
ALTER TABLE zvd_ec_products ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2);
ALTER TABLE zvd_ec_products ADD COLUMN IF NOT EXISTS review_count INT NOT NULL DEFAULT 0;
ALTER TABLE zvd_ec_products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE zvd_ec_products ADD COLUMN IF NOT EXISTS digital_file_url TEXT;
ALTER TABLE zvd_ec_orders ADD COLUMN IF NOT EXISTS coupon_code TEXT;
ALTER TABLE zvd_ec_orders ADD COLUMN IF NOT EXISTS shipping_zone_id UUID REFERENCES zvd_ec_shipping_zones(id);
ALTER TABLE zvd_ec_orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE zvd_ec_order_items ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES zvd_ec_product_variants(id);
