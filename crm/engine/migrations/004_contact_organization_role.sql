-- `zvd_contact_organizations` was missing the two columns its own code reads.
--
-- `routes.ts` joins `pco.role` and filters `pco.is_primary = TRUE` on both read
-- paths, and `linkContactOrganization` inserts both. The comment above that
-- function states the table "has been in the schema since the first migration,
-- carrying `role` and `is_primary`". It has not: 001_initial creates only
-- `contact_id`, `organization_id`, `created_at`.
--
-- So `GET /ext/crm/contacts` answered 500 with `column pco.is_primary does not
-- exist`, and creating a contact with an organization did the same. The whole
-- contacts surface was down on every install, while the code read as though the
-- relation had always been there.
--
-- Adding the columns rather than removing the references: the relation is the
-- point. Without it `company` stays a free-text string on the contact, which is
-- exactly the flat-address-book behaviour the code comment describes wanting to
-- leave behind.

ALTER TABLE zvd_contact_organizations
  ADD COLUMN IF NOT EXISTS role       TEXT,
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT FALSE;

-- "Primary" has to mean exactly one, because the list view picks a single
-- organization to show per contact. The route demotes the others before
-- promoting one, which holds for a single caller and not for two at once —
-- so the invariant is written down here instead of being a convention.
--
-- Scoped by tenant as well: the same contact id cannot appear under two
-- tenants, but the predicate is spelled out so the index cannot become a
-- cross-tenant constraint if that ever changes.
CREATE UNIQUE INDEX IF NOT EXISTS idx_zvd_contact_organizations_one_primary
  ON zvd_contact_organizations (tenant_id, contact_id)
  WHERE is_primary;

-- DOWN
DROP INDEX IF EXISTS idx_zvd_contact_organizations_one_primary;
ALTER TABLE zvd_contact_organizations
  DROP COLUMN IF EXISTS is_primary,
  DROP COLUMN IF EXISTS role;
