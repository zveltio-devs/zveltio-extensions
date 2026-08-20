-- Two columns the create handler has always written and the table never had.
--
-- `routes.ts` inserts ten columns; four of them did not exist, so creating a
-- document template answered 500 on every install — the extension's primary
-- function. Two of the four are name mismatches for columns that DO exist
-- (`content` is `html_body`, `style_config` is `pdf_options`) and are fixed in
-- the handler. These two are genuinely missing.
--
-- Not folded into the nearest existing column, which is what a quick reading
-- suggests:
--
--   `template_type` is the templating language ('html', 'handlebars', …), not
--   `category`, which is a free-text grouping label an author picks. Putting
--   the language in the grouping field would make both useless.
--
--   `output_format` is what to render TO ('pdf', 'docx', …), not `pdf_options`,
--   which is the JSONB of page size and margins handed to the PDF renderer.
--
-- Defaults match the zod schema's, so rows created before this migration read
-- back the same as ones created after.

ALTER TABLE zv_document_templates
  ADD COLUMN IF NOT EXISTS template_type TEXT NOT NULL DEFAULT 'html',
  ADD COLUMN IF NOT EXISTS output_format TEXT NOT NULL DEFAULT 'pdf';

-- DOWN
ALTER TABLE zv_document_templates
  DROP COLUMN IF EXISTS output_format,
  DROP COLUMN IF EXISTS template_type;
