-- Generic metadata column on invoice lines — allows other extensions to store
-- extension-specific data (e.g. lot_id for traceability) without coupling invoicing.
ALTER TABLE zvd_invoice_lines ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}';
ALTER TABLE zvd_invoice_lines ADD COLUMN IF NOT EXISTS unit VARCHAR(20);
