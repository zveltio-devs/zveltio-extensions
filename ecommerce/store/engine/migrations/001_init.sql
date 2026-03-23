-- eCommerce extension schema

CREATE TABLE IF NOT EXISTS zvd_ec_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES zvd_ec_categories(id) ON DELETE SET NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_ec_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  category_id UUID REFERENCES zvd_ec_categories(id) ON DELETE SET NULL,
  price NUMERIC(15,2) NOT NULL DEFAULT 0,
  compare_price NUMERIC(15,2),
  cost NUMERIC(15,2),
  currency TEXT NOT NULL DEFAULT 'RON',
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  stock_qty INT NOT NULL DEFAULT 0,
  track_stock BOOLEAN NOT NULL DEFAULT true,
  allow_backorder BOOLEAN NOT NULL DEFAULT false,
  weight NUMERIC(10,3),
  images JSONB NOT NULL DEFAULT '[]',
  attributes JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zvd_ec_products_status ON zvd_ec_products(status);
CREATE INDEX idx_zvd_ec_products_category ON zvd_ec_products(category_id);
CREATE INDEX idx_zvd_ec_products_slug ON zvd_ec_products(slug);

CREATE TABLE IF NOT EXISTS zvd_ec_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  billing_address JSONB NOT NULL DEFAULT '{}',
  shipping_address JSONB NOT NULL DEFAULT '{}',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zvd_ec_customers_email ON zvd_ec_customers(email);

CREATE TABLE IF NOT EXISTS zvd_ec_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES zvd_ec_customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled','refunded')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid','refunded','partial')),
  payment_method TEXT,
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  shipping_cost NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RON',
  billing_address JSONB NOT NULL DEFAULT '{}',
  shipping_address JSONB NOT NULL DEFAULT '{}',
  shipping_tracking TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zvd_ec_orders_status ON zvd_ec_orders(status);
CREATE INDEX idx_zvd_ec_orders_customer ON zvd_ec_orders(customer_id);
CREATE INDEX idx_zvd_ec_orders_created ON zvd_ec_orders(created_at);

CREATE TABLE IF NOT EXISTS zvd_ec_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES zvd_ec_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES zvd_ec_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INT NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  discount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL
);

CREATE INDEX idx_zvd_ec_order_items_order ON zvd_ec_order_items(order_id);

CREATE TABLE IF NOT EXISTS zvd_ec_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'percent' CHECK (type IN ('percent','fixed')),
  value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(15,2),
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
