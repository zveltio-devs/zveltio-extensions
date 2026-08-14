-- `zvd_bank_imports.filename` is NOT NULL and no caller can satisfy it, so
-- recording a statement import fails on the constraint. MT940 import is this
-- extension's primary function; the path is dead on every install.
--
-- Made nullable rather than defaulted, because the name is genuinely absent on
-- two of the three ways an import arrives:
--
--   * `POST /accounts/:id/import/mt940` takes the statement as a STRING in the
--     request body, not an upload. There is no file.
--   * `POST /accounts/:id/import` takes a JSON array of transactions and a
--     `source` label. There is no file there either.
--
-- Inventing a placeholder — 'unknown.sta', the upload timestamp — would put a
-- filename in an audit column for an import that never had one. The handlers
-- accept an optional `filename` now, so a UI that DID upload a file records the
-- real name and the column means what it says.

ALTER TABLE zvd_bank_imports ALTER COLUMN filename DROP NOT NULL;

-- DOWN
-- Not reversible while rows exist without a filename, which is the normal case
-- for the two body-based import paths.
