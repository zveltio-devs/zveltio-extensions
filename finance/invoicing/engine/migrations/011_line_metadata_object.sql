-- Invoice line metadata was written as a jsonb STRING SCALAR, not an object.
--
-- `${JSON.stringify(...)}::jsonb` looks like it parses the document. It does
-- not: the driver already sends the parameter as a jsonb value, so the cast is
-- a no-op and the whole serialized string lands as one scalar. Reading it back
-- gives `jsonb_typeof(metadata) = 'string'`.
--
-- The two JavaScript readers in this extension never noticed, because both do
-- `typeof x === 'string' ? JSON.parse(x) : x` and quietly compensate. A SQL
-- reader cannot. `operations/traceability` listens for record.created and looks
-- for invoice lines carrying `metadata->>'lot_id'` so it can raise a pending
-- dispatch; against a string scalar that operator yields NULL, the query
-- matched nothing, and the invoice-to-dispatch handover never fired once. The
-- dispatch routes that act on a pending row — assign-lot, confirm, cancel —
-- had no way to be reached.
--
-- The insert is fixed to `::text::jsonb`. This repairs what was already
-- written, so history becomes visible to the same reader rather than only new
-- invoices.
--
-- `#>> '{}'` extracts a jsonb scalar as text; re-casting that text yields the
-- object the string was always spelling. Rows that are already objects are
-- left alone, so the migration is safe to re-run and safe on an install that
-- never had the defect.

UPDATE zvd_invoice_lines
   SET metadata = (metadata #>> '{}')::jsonb
 WHERE jsonb_typeof(metadata) = 'string'
   AND (metadata #>> '{}') LIKE '{%}';

-- DOWN
-- Deliberately not reversed. Turning correct objects back into string scalars
-- would re-break the reader this migration exists to unblock, and nothing can
-- distinguish a row this migration converted from one written correctly after
-- the fix.
SELECT 1;
