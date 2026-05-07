-- Atomic sequences for invoice/credit note number generation.
-- Replaces the module-level counter that was unsafe across restarts and concurrent requests.
CREATE SEQUENCE IF NOT EXISTS zvd_invoice_seq START 1;
CREATE SEQUENCE IF NOT EXISTS zvd_credit_note_seq START 1;

-- Sync sequences to current table counts so existing numbers are not reused.
SELECT setval('zvd_invoice_seq', GREATEST((SELECT COUNT(*) FROM zvd_invoices), 1));
SELECT setval('zvd_credit_note_seq', GREATEST((SELECT COUNT(*) FROM zvd_credit_notes), 1));
