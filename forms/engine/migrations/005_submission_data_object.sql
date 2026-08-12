-- Submission answers were stored as a jsonb STRING SCALAR, not an object.
--
-- The insert bound `JSON.stringify(cleanData)` to a jsonb column, and a JS
-- string bound to jsonb arrives AS a jsonb value — so the whole serialized
-- document landed as one scalar. `jsonb_typeof(data)` read back "string".
--
-- Nothing SQL-side could look inside a submission: no `data->>'field'`, no
-- filtering or reporting on an answer. Every reader had to JSON.parse it first,
-- and a page rendering `data` directly would have walked the string character
-- by character instead of listing answers.
--
-- The insert now goes through `::text::jsonb`. This repairs what was already
-- written, so submissions collected before the fix stay readable by the same
-- reader as the ones after it.
--
-- `#>> '{}'` extracts a jsonb scalar as text; re-casting that text yields the
-- object the string was always spelling. Rows already stored as objects are
-- skipped, so this is safe to re-run and safe where the defect never occurred.

UPDATE zv_form_submissions
   SET data = (data #>> '{}')::jsonb
 WHERE jsonb_typeof(data) = 'string'
   AND (data #>> '{}') LIKE '{%}';

-- DOWN
-- Not reversed. Turning correct objects back into string scalars would
-- re-break the readers this exists to unblock, and nothing distinguishes a row
-- this migration converted from one written correctly afterwards.
SELECT 1;
