-- Who created the template.
--
-- The create handler has always written `created_by` and the column was never
-- there, so creating a template failed outright. Every sibling table in this
-- codebase records its author; this one was simply missed.
ALTER TABLE zv_document_templates ADD COLUMN IF NOT EXISTS created_by TEXT;
