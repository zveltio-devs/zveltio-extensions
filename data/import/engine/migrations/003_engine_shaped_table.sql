-- 003_engine_shaped_table.sql
--
-- `zv_import_logs` has two creators and they disagree about column names.
--
-- Import was a core feature before it became an extension. The engine's
-- `001_initial.sql` still creates the table, with `file_format` and
-- `error_rows`; this extension's `001_initial.sql` creates the same table with
-- `format` and `failed_rows`. Both creates are conditional, so whichever
-- migration runs first decides the shape — and the engine's core migrations run
-- at boot, before any extension's.
--
-- So on every fresh install the table is the engine's, and this extension's
-- INSERT names two columns that are not there. Measured on a virgin database
-- with the extension enabled: `POST /ext/data/import/:collection` answers 500,
-- `column "format" of relation "zv_import_logs" does not exist`. Every import,
-- on every new instance.
--
-- It survived because nothing here runs on a fresh database: the engine still
-- serves `/api/import` over the same table with the same names it created, and
-- an instance that has been upgraded for months has the columns from whichever
-- side got there first.
--
-- Adding rather than renaming, and additive on purpose. A rename would be
-- destructive on the engine-shaped table, and this has to be correct on BOTH
-- shapes: the one the engine made, and the one this extension makes when the
-- engine's copy of import is finally removed. The conditional ADD makes it a
-- no-op on the extension's own shape.
--
-- The duplicate concepts (`file_format` beside `format`, `error_rows` beside
-- `failed_rows`) belong to the engine's dead route, which no caller reaches.
-- They go when it goes.

ALTER TABLE zv_import_logs
  ADD COLUMN IF NOT EXISTS format      TEXT NOT NULL DEFAULT 'csv',
  ADD COLUMN IF NOT EXISTS failed_rows INTEGER NOT NULL DEFAULT 0;

-- The same disagreement, in the status vocabulary rather than the column names.
--
-- A job in flight is `running` here and `processing` in the engine's table, so
-- the first thing this extension does to a job it just created — mark it
-- started — violated the engine's constraint. That is why an import failed at
-- the very first statement and never touched a row.
--
-- The union of both vocabularies, so neither side is broken by the other. The
-- names collapse to one when the engine's copy of import goes.
ALTER TABLE zv_import_logs DROP CONSTRAINT IF EXISTS zv_import_logs_status_check;
ALTER TABLE zv_import_logs
  ADD CONSTRAINT zv_import_logs_status_check
  CHECK (status IN ('pending', 'running', 'processing', 'completed', 'failed', 'partial'));
