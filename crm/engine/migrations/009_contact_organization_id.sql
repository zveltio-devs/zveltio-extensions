-- The contact ↔ organization link becomes an ordinary collection, keyed by `id`.
--
-- The data API writes and reads records by `id` (`dynamicUpdate` is
-- `WHERE id = $1`, revisions are keyed by it), and stamps `updated_at`,
-- `created_by` and `updated_by`. The junction had none of them: its key was
-- (contact_id, organization_id), so CRM linked a contact with raw SQL through
-- `ctx.db`, around the collection permission, revisions and flows. The engine's
-- own junctions (`DDLManager.createJunctionTable`) are already `id`-keyed.
--
-- The pair stays unique: a contact is in an organization once.
--
-- squawk's adding-field-with-default: `gen_random_uuid()` is volatile, so the
-- ADD COLUMN rewrites the table under ACCESS EXCLUSIVE — one row per
-- contact-organization link, the wait bounded by the runner's lock_timeout.
-- Deliberate: the alternative (add it nullable, then UPDATE a backfill) goes
-- through this table's FORCE row-level security, which on the owner role
-- without a tenant GUC sees only part of the rows, and the primary key would
-- then fail on the rest. The column default fills every row, RLS or not.

-- squawk-ignore-file adding-field-with-default

ALTER TABLE zvd_contact_organizations
  ADD COLUMN IF NOT EXISTS id         UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS created_by TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'zvd_contact_organizations'::regclass AND conname = 'zvd_contact_organizations_pair_key'
  ) THEN
    ALTER TABLE zvd_contact_organizations DROP CONSTRAINT IF EXISTS zvd_contact_organizations_pkey;
    ALTER TABLE zvd_contact_organizations
      ADD CONSTRAINT zvd_contact_organizations_pkey PRIMARY KEY (id),
      ADD CONSTRAINT zvd_contact_organizations_pair_key UNIQUE (contact_id, organization_id);
  END IF;
END $$;

-- DOWN
ALTER TABLE zvd_contact_organizations DROP CONSTRAINT IF EXISTS zvd_contact_organizations_pair_key;
ALTER TABLE zvd_contact_organizations DROP CONSTRAINT IF EXISTS zvd_contact_organizations_pkey;
ALTER TABLE zvd_contact_organizations ADD CONSTRAINT zvd_contact_organizations_pkey PRIMARY KEY (contact_id, organization_id);
ALTER TABLE zvd_contact_organizations
  DROP COLUMN IF EXISTS updated_by,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS id;
