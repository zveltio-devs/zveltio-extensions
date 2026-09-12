-- 008_lines_unwrap_string.sql
--
-- Repair the rows written by the `::jsonb` single-cast defect.
--
-- Under Bun.SQL (the production driver) a string parameter is typed as JSON,
-- so `${…}::jsonb` is a no-op and the value lands as a jsonb STRING SCALAR
-- holding the text of the array, not as the array. Two write paths did it:
-- the invoice.created auto-draft listener (every auto-drafted submission
-- since the feature shipped) and PATCH /:id updating `lines`. The engine
-- readers tolerate the damage (`typeof lines === 'string' ? JSON.parse …`),
-- which is why nothing ever looked broken — but any SQL that treats lines as
-- an array (`lines->0`, `jsonb_array_length`) saw NULL, and GET /:id answered
-- with a string where the contract says an array.
--
-- Shaped like analytics/dashboard's 003, for the reason recorded there: a
-- single UPDATE … WHERE jsonb_typeof(lines) = 'string' AND <cast succeeds> is
-- NOT safe, because Postgres does not guarantee the second condition is only
-- evaluated for rows that passed the first — one string that is not valid
-- JSON aborts the whole statement, leaving the damaged rows exactly as they
-- were. So: a per-row loop with an exception handler, skipping (and warning
-- on) anything that does not unwrap to an array. Idempotent: a second run
-- finds no string rows.

DO $$
DECLARE
  rec       RECORD;
  unwrapped JSONB;
  fixed     INT := 0;
  skipped   INT := 0;
BEGIN
  FOR rec IN
    SELECT id, lines FROM zv_efactura_invoices WHERE jsonb_typeof(lines) = 'string'
  LOOP
    BEGIN
      unwrapped := (rec.lines #>> '{}')::jsonb;
      IF jsonb_typeof(unwrapped) = 'array' THEN
        UPDATE zv_efactura_invoices SET lines = unwrapped WHERE id = rec.id;
        fixed := fixed + 1;
      ELSE
        skipped := skipped + 1;
        RAISE WARNING '[efactura 008] invoice %: lines is a string but not a JSON array — left as-is', rec.id;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      skipped := skipped + 1;
      RAISE WARNING '[efactura 008] invoice %: could not unwrap lines (%) — left as-is', rec.id, SQLERRM;
    END;
  END LOOP;
  IF fixed > 0 OR skipped > 0 THEN
    RAISE NOTICE '[efactura 008] unwrapped % invoice(s), skipped %', fixed, skipped;
  END IF;
END$$;
