-- 012_credit_note_series.sql
--
-- Credit notes were numbered from `nextval('zvd_credit_note_seq')` — one
-- Postgres sequence for the whole instance. A sequence has no tenant, so two
-- companies on one install interleave and each is left with permanent holes in
-- its own register: the first takes CN-00001 and CN-00003, the second CN-00002.
-- A credit note adjusts an issued invoice and is a fiscal document under the
-- same continuity rule as the invoice itself (Cod fiscal art. 319 alin. (20)
-- lit. a)), so a hole in it is what an inspection asks about.
--
-- `zvd_document_series` already models exactly this, per tenant, and its
-- `doc_type` CHECK has always allowed 'credit_note'. Nothing created the row.
--
-- Same shape as the `invoice` seed in 005: carry the existing numbering
-- forward, above the highest number this tenant actually used, so nothing
-- repeats and the change is invisible to anyone mid-year.
INSERT INTO zvd_document_series (tenant_id, doc_type, series, next_number, padding, is_default)
SELECT cn.tenant_id,
       'credit_note',
       'CN',
       COALESCE(MAX(NULLIF(regexp_replace(cn.number, '\D', '', 'g'), ''))::BIGINT, 0) + 1,
       5,
       TRUE
  FROM zvd_credit_notes cn
 WHERE cn.number IS NOT NULL
 GROUP BY cn.tenant_id
ON CONFLICT (tenant_id, doc_type, series) DO NOTHING;

-- A tenant that has issued no credit note yet has no row above, and would meet
-- "No credit_note series configured" the first time it tried. Give every tenant
-- that already has an invoice series one, starting at 1.
INSERT INTO zvd_document_series (tenant_id, doc_type, series, next_number, padding, is_default)
SELECT DISTINCT s.tenant_id, 'credit_note', 'CN', 1, 5, TRUE
  FROM zvd_document_series s
 WHERE s.doc_type = 'invoice'
ON CONFLICT (tenant_id, doc_type, series) DO NOTHING;

-- `zvd_credit_note_seq` is deliberately NOT dropped: an install can still be
-- running a previously packed bundle that reads it, and a dropped sequence
-- turns that into a 500 rather than a stale number.

-- DOWN
DELETE FROM zvd_document_series WHERE doc_type = 'credit_note' AND series = 'CN';
