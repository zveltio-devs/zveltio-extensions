-- Recover the dashboard layouts that were stored as JSON string scalars.
--
-- `writeLayout` cast a stringified array with a single `::jsonb`. Under Bun.SQL,
-- which is what the engine runs, the driver already types that parameter as
-- json, so the cast does nothing and the column holds a STRING whose text
-- happens to be JSON:
--
--   jsonb_typeof(widgets) = 'string'      "[\"tasks\",\"revenue\"]"
--
-- `readLayout` then does `if (!Array.isArray(raw)) return null`, so every
-- personalised dashboard read back as "not personalised" and the user got the
-- default set. The save had reported success and the row was there the whole
-- time.
--
-- The route is fixed to write `::text::jsonb`, which makes new saves correct.
-- That alone would leave every EXISTING layout discarded until its owner
-- happened to rearrange their dashboard again — a silent, permanent-looking loss
-- of a setting they already made. This unwraps them.
--
-- WHY THIS IS A LOOP AND NOT ONE UPDATE
--
-- The first version of this file was a single statement:
--
--   UPDATE zv_dashboard_layouts SET widgets = (widgets #>> '{}')::jsonb
--    WHERE jsonb_typeof(widgets) = 'string'
--      AND jsonb_typeof((widgets #>> '{}')::jsonb) = 'array';
--
-- and it FAILED on the case its own comment said it handled. Postgres does not
-- guarantee that the `jsonb_typeof(... ::jsonb)` guard is evaluated only for
-- rows that passed the first condition, so one string that is not valid JSON
-- aborted the whole migration:
--
--   ERROR:  invalid input syntax for type json
--   DETAIL:  Token "not" is invalid.
--
-- and the damaged rows it was written to rescue were left exactly as they were.
-- Caught by seeding all three states — damaged, healthy, and a string that is
-- not JSON — before believing it.
--
-- `pg_input_is_valid` would express this in one statement, but it is PostgreSQL
-- 16 and later; a per-row handler works everywhere and states the intent as
-- plainly.
--
-- Only rows whose text parses to a JSON ARRAY are touched. Anything else is left
-- exactly as it is: it is not a layout this extension wrote, and guessing at it
-- would be worse than leaving it for someone to look at.
--
-- Idempotent, and a no-op on an install that never had the defect (a `pg`-based
-- deployment, or a fresh one) because no row there is of type `string`.

DO $$
DECLARE
  r         RECORD;
  parsed    JSONB;
  recovered BIGINT := 0;
  skipped   BIGINT := 0;
BEGIN
  FOR r IN SELECT id, widgets FROM zv_dashboard_layouts WHERE jsonb_typeof(widgets) = 'string'
  LOOP
    BEGIN
      parsed := (r.widgets #>> '{}')::jsonb;
    EXCEPTION WHEN others THEN
      skipped := skipped + 1;
      CONTINUE;
    END;

    IF jsonb_typeof(parsed) = 'array' THEN
      UPDATE zv_dashboard_layouts SET widgets = parsed WHERE id = r.id;
      recovered := recovered + 1;
    ELSE
      skipped := skipped + 1;
    END IF;
  END LOOP;

  IF recovered > 0 THEN
    RAISE NOTICE 'analytics/dashboard 003: recovered % dashboard layout(s) stored as a JSON string.', recovered;
  END IF;
  IF skipped > 0 THEN
    RAISE WARNING 'analytics/dashboard 003: % row(s) hold a JSON string that is not an array; left untouched.', skipped;
  END IF;
END $$;
