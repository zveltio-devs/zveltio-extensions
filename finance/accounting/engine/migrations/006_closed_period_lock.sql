-- A closed fiscal year has to actually close.
--
-- `/fiscal-years/:id/close` refused only if draft entries already existed in the
-- range, then set `status = 'closed'`. Nothing afterwards consulted that flag.
-- `POST /journal` looks for a fiscal year with `status = 'open'` covering the
-- entry date and, finding none, inserted the entry anyway with
-- `fiscal_year_id = NULL` and the original date.
--
-- So: the 2025 books are closed and filed. In June 2026 someone posts a
-- 2025-12-31 entry. It lands in the ledger, appears in every report that filters
-- by date, and is invisible to every report that filters by `fiscal_year_id`,
-- because it is NULL. The statutory accounts silently diverge from what was
-- filed with the authorities. Preventing exactly that is the only reason period
-- close exists.
--
-- A trigger rather than four route checks, which is what the audit recommended
-- and is right: `POST /journal`, `/journal/:id/post`, `/journal/:id/void` and
-- `/recurring/:id/run` all write here, and a fifth writer is one feature away.
-- A route can forget; a trigger cannot.
--
-- SECURITY INVOKER (the default), deliberately: the function then runs under the
-- caller's role and RLS applies inside it, so it sees only the calling tenant's
-- fiscal years. A SECURITY DEFINER version would let one company's closed year
-- block another company's posting.
--
-- UPDATE is covered as well as INSERT: posting and voiding both move an existing
-- row, and an entry that could not be created into a closed period must not be
-- able to arrive there by being edited either.

CREATE OR REPLACE FUNCTION zvd_accounting_refuse_closed_period()
RETURNS trigger AS $$
DECLARE
  closed_year record;
BEGIN
  SELECT id, year INTO closed_year
  FROM zvd_fiscal_years
  WHERE NEW.date BETWEEN start_date AND end_date
    AND status = 'closed'
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'fiscal year % is closed; entry dated % cannot be written to it',
      closed_year.year, NEW.date
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zvd_journal_entries_closed_period ON zvd_journal_entries;
CREATE TRIGGER zvd_journal_entries_closed_period
  BEFORE INSERT OR UPDATE OF date, status ON zvd_journal_entries
  FOR EACH ROW EXECUTE FUNCTION zvd_accounting_refuse_closed_period();

-- DOWN
DROP TRIGGER IF EXISTS zvd_journal_entries_closed_period ON zvd_journal_entries;
DROP FUNCTION IF EXISTS zvd_accounting_refuse_closed_period();
