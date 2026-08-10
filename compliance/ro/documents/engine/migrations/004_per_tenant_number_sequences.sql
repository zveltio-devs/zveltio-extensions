-- The document register handed out invented numbers to every company but one.
--
-- `zv_ro_doc_number_sequences` was created with `type TEXT PRIMARY KEY`, back
-- when one row per document type was the whole story. Migration 002 later added
-- `tenant_id` and row-level security — and did not touch the constraint. The two
-- have disagreed ever since:
--
--   * the seven seeded rows all belong to the default tenant;
--   * a second company cannot insert its own, because PRIMARY KEY (type) is
--     already taken by a row RLS won't even let it see;
--   * so its `UPDATE … WHERE type = 'contract'` matches nothing.
--
-- Verified against a live instance: with the tenant GUC set to a second company,
-- the table shows 0 rows and the claim returns `UPDATE 0`.
--
-- The route read that empty result as "no sequence configured" and fell back to
-- `CONTRACT-1754800000000` — a millisecond timestamp. The point of a document
-- register is an unbroken, ordered series per company; a timestamp is not a
-- register number, and it arrived silently, looking enough like one to survive
-- until an inspection.
--
-- The primary key becomes (tenant_id, type), which is what the table has meant
-- since 002. Existing rows keep the default tenant and their counters, so no
-- number already issued changes.

ALTER TABLE zv_ro_doc_number_sequences
  ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE zv_ro_doc_number_sequences
  DROP CONSTRAINT IF EXISTS zv_ro_doc_number_sequences_pkey;

ALTER TABLE zv_ro_doc_number_sequences
  ADD CONSTRAINT zv_ro_doc_number_sequences_pkey PRIMARY KEY (tenant_id, type);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zveltio_rls') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON zv_ro_doc_number_sequences TO zveltio_rls;
  END IF;
END $$;
