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
