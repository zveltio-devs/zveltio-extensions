-- 001_initial.sql
--
-- Consolidated initial schema for the `ecommerce/store` extension.
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
--   • 003_canonical_link.sql

-- ── from 001_init.sql ──
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

CREATE INDEX IF NOT EXISTS idx_zvd_ec_products_status ON zvd_ec_products(status);
CREATE INDEX IF NOT EXISTS idx_zvd_ec_products_category ON zvd_ec_products(category_id);
CREATE INDEX IF NOT EXISTS idx_zvd_ec_products_slug ON zvd_ec_products(slug);

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

CREATE INDEX IF NOT EXISTS idx_zvd_ec_customers_email ON zvd_ec_customers(email);

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

CREATE INDEX IF NOT EXISTS idx_zvd_ec_orders_status ON zvd_ec_orders(status);
CREATE INDEX IF NOT EXISTS idx_zvd_ec_orders_customer ON zvd_ec_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_zvd_ec_orders_created ON zvd_ec_orders(created_at);

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

CREATE INDEX IF NOT EXISTS idx_zvd_ec_order_items_order ON zvd_ec_order_items(order_id);

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

-- ── from 002_enterprise.sql ──
CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

-- ── from 003_canonical_link.sql ──
-- Migration 003: link ecommerce/store to canonical zvd_products and zvd_contacts.
--
-- Before alpha.67 ecommerce/store maintained zvd_ec_products as a separate catalog
-- from operations/inventory's zvd_products. This migration bridges them:
--
--   1. zvd_ec_products gains canonical_product_id UUID → zvd_products(id).
--      The ec_products row becomes the storefront-specific overlay (slug, SEO,
--      images, descriptions); the canonical product owns sku, name, price.
--   2. zvd_ec_orders gains canonical_contact_id UUID → zvd_contacts(id), so an
--      order can be tied to a CRM contact.
--   3. zvd_ec_order_items.product_id stays as ec_product reference but inherits
--      stock movements through ec_products.canonical_product_id.

ALTER TABLE zvd_ec_products
  ADD COLUMN IF NOT EXISTS canonical_product_id UUID;

CREATE INDEX IF NOT EXISTS idx_ec_products_canonical ON zvd_ec_products(canonical_product_id);

ALTER TABLE zvd_ec_orders
  ADD COLUMN IF NOT EXISTS canonical_contact_id UUID;

CREATE INDEX IF NOT EXISTS idx_ec_orders_canonical ON zvd_ec_orders(canonical_contact_id);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zvd_products') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ec_products_canonical_fk') THEN
      ALTER TABLE zvd_ec_products
        ADD CONSTRAINT ec_products_canonical_fk
        FOREIGN KEY (canonical_product_id) REFERENCES zvd_products(id) ON DELETE SET NULL NOT VALID;
      ALTER TABLE zvd_ec_products VALIDATE CONSTRAINT ec_products_canonical_fk;
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zvd_contacts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ec_orders_canonical_fk') THEN
      ALTER TABLE zvd_ec_orders
        ADD CONSTRAINT ec_orders_canonical_fk
        FOREIGN KEY (canonical_contact_id) REFERENCES zvd_contacts(id) ON DELETE SET NULL NOT VALID;
      ALTER TABLE zvd_ec_orders VALIDATE CONSTRAINT ec_orders_canonical_fk;
    END IF;
  END IF;
END$$;

