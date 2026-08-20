-- Debits must equal credits, and the database has to be the one saying so.
--
-- The only balance check lived in JavaScript, on `POST /journal`:
--
--     if (Math.abs(totalDebit - totalCredit) > 0.001) return 400;
--
-- No CHECK constraint, no trigger, and — decisively — `POST /journal/:id/post`
-- never re-checked. So anything that writes these tables without going through
-- that one handler can produce a permanently unbalanced ledger: a future
-- extension, a fix-up script, the void path, a support engineer with psql. In
-- double-entry bookkeeping "the books balance" is not a validation rule, it is
-- the definition of the record being a ledger at all.
--
-- There is a second way in, and it needs no other writer. `debit` and `credit`
-- are `z.number()` with no scale limit while the columns are NUMERIC(15,2), so
-- two lines of 10.005 sum to 20.01 in JavaScript, pass the gate against a credit
-- of 20.01, and are then rounded by PostgreSQL to 10.01 each — stored as 20.02
-- against 20.01. The check passed on numbers that were never written. The route
-- now refuses more than two decimals; this is the half that holds regardless.
--
-- Enforced at POSTING, not at insert. A draft is a working document and may be
-- unbalanced while somebody is building it; posting is the irreversible act that
-- turns it into evidence. That is also exactly where the audit found the gap.
--
-- The line trigger is DEFERRABLE INITIALLY DEFERRED so it evaluates at COMMIT:
-- lines are inserted one statement at a time, and an immediate check would fail
-- on the first row of a balanced entry.
--
-- Existing unbalanced entries are NOT rewritten. There is no correct value to
-- guess, and inventing one would be a worse thing to do to a ledger than leaving
-- it visibly wrong. They are reported once, by count, and any attempt to touch
-- them from now on has to fix them.

CREATE OR REPLACE FUNCTION zvd_accounting_entry_balances(entry uuid)
RETURNS boolean AS $$
  SELECT COALESCE(ABS(SUM(debit) - SUM(credit)), 0) < 0.005
  FROM zvd_journal_lines WHERE entry_id = entry;
$$ LANGUAGE sql STABLE;

-- Posting an unbalanced entry.
CREATE OR REPLACE FUNCTION zvd_accounting_refuse_unbalanced_post()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'posted' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'posted') THEN
    IF NOT zvd_accounting_entry_balances(NEW.id) THEN
      RAISE EXCEPTION 'journal entry % does not balance; debits and credits must be equal to post it', NEW.id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zvd_journal_entries_balanced ON zvd_journal_entries;
CREATE TRIGGER zvd_journal_entries_balanced
  BEFORE INSERT OR UPDATE OF status ON zvd_journal_entries
  FOR EACH ROW EXECUTE FUNCTION zvd_accounting_refuse_unbalanced_post();

-- Editing the lines of an entry that is already posted.
CREATE OR REPLACE FUNCTION zvd_accounting_refuse_unbalanced_lines()
RETURNS trigger AS $$
DECLARE
  entry uuid := COALESCE(NEW.entry_id, OLD.entry_id);
  entry_status text;
BEGIN
  SELECT status INTO entry_status FROM zvd_journal_entries WHERE id = entry;
  -- The entry may be gone (a cascade delete); nothing to balance.
  IF entry_status IS NULL OR entry_status <> 'posted' THEN
    RETURN NULL;
  END IF;
  IF NOT zvd_accounting_entry_balances(entry) THEN
    RAISE EXCEPTION 'journal entry % would no longer balance', entry
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zvd_journal_lines_balanced ON zvd_journal_lines;
CREATE CONSTRAINT TRIGGER zvd_journal_lines_balanced
  AFTER INSERT OR UPDATE OR DELETE ON zvd_journal_lines
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION zvd_accounting_refuse_unbalanced_lines();

DO $$
DECLARE n integer;
BEGIN
  SELECT COUNT(*) INTO n FROM zvd_journal_entries e
   WHERE e.status = 'posted' AND NOT zvd_accounting_entry_balances(e.id);
  IF n > 0 THEN
    RAISE WARNING '[accounting] % posted journal entr(ies) do not balance. They are left as they are — a ledger with a visible error is better than one with an invented correction — but any further edit to them will now be refused until they are fixed.', n;
  END IF;
END
$$;

-- DOWN
DROP TRIGGER IF EXISTS zvd_journal_lines_balanced ON zvd_journal_lines;
DROP TRIGGER IF EXISTS zvd_journal_entries_balanced ON zvd_journal_entries;
DROP FUNCTION IF EXISTS zvd_accounting_refuse_unbalanced_lines();
DROP FUNCTION IF EXISTS zvd_accounting_refuse_unbalanced_post();
DROP FUNCTION IF EXISTS zvd_accounting_entry_balances(uuid);
