-- Starea în care ajunge un decont rambursat integral nu era permisă.
--
-- `zvd_expense_reports_status_check` accepta `draft, submitted, approved,
-- rejected, paid`. Codul scrie `reimbursed` — la fel și cele 12 locuri din
-- interfață, la fel și `/stats`. Nimic, nicăieri, nu scrie vreodată `paid`.
--
-- Deci rambursarea integrală, care e cazul normal, eșua cu 23514 și răspundea
-- 500. Cea parțială mergea, fiindcă acolo statusul rămâne `approved` — motiv
-- pentru care defectul putea trece neobservat la o probă superficială.
--
-- Măsurat pe bază virgină: decont depus, aprobat, rambursat integral → 500,
-- `new row for relation "zvd_expense_reports" violates check constraint`.
--
-- Iar `/stats` numără de la bun început `COUNT(*) FILTER (WHERE status =
-- 'reimbursed')` — un contor pe o stare pe care constrângerea o făcea
-- imposibilă. Era zero prin construcție.
--
-- `paid` rămâne acceptat: nu-l scrie nimeni, dar o îngustare pe o instalare
-- despre care nu știu nimic e un risc fără câștig.

ALTER TABLE zvd_expense_reports DROP CONSTRAINT IF EXISTS zvd_expense_reports_status_check;
ALTER TABLE zvd_expense_reports
  ADD CONSTRAINT zvd_expense_reports_status_check
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid', 'reimbursed'));

-- DOWN
ALTER TABLE zvd_expense_reports DROP CONSTRAINT IF EXISTS zvd_expense_reports_status_check;
ALTER TABLE zvd_expense_reports
  ADD CONSTRAINT zvd_expense_reports_status_check
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'paid'));
