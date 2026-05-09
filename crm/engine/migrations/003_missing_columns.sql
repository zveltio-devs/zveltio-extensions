-- CRM extension — fix schema mismatches between routes.ts and 001_init.sql

-- zvd_contacts: add columns queried / inserted by routes
ALTER TABLE zvd_contacts
  ADD COLUMN IF NOT EXISTS job_title   TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url  TEXT,
  ADD COLUMN IF NOT EXISTS source      TEXT,
  ADD COLUMN IF NOT EXISTS metadata    JSONB NOT NULL DEFAULT '{}';

-- Contact ↔ Organization many-to-many join table (used in GET /contacts/:id and GET /organizations/:id)
CREATE TABLE IF NOT EXISTS zvd_contact_organizations (
  contact_id      UUID NOT NULL REFERENCES zvd_contacts(id)      ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES zvd_organizations(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (contact_id, organization_id)
);

-- zvd_organizations: add columns queried / inserted by routes
ALTER TABLE zvd_organizations
  ADD COLUMN IF NOT EXISTS legal_name       TEXT,
  ADD COLUMN IF NOT EXISTS tax_id           TEXT,
  ADD COLUMN IF NOT EXISTS registration_no  TEXT,
  ADD COLUMN IF NOT EXISTS type             TEXT NOT NULL DEFAULT 'company',
  ADD COLUMN IF NOT EXISTS logo_url         TEXT,
  ADD COLUMN IF NOT EXISTS is_active        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS email            TEXT,
  ADD COLUMN IF NOT EXISTS metadata         JSONB NOT NULL DEFAULT '{}';

-- zvd_transactions: name was NOT NULL in the old core schema — relax it, but only if
-- the column exists (on pre-extension installs name may not exist at all).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'zvd_transactions' AND column_name = 'name'
  ) THEN
    ALTER TABLE zvd_transactions ALTER COLUMN name DROP NOT NULL;
  END IF;
END $$;

-- Remove old status CHECK (open/won/lost/on_hold) so routes can use draft/pending/completed/cancelled/refunded
ALTER TABLE zvd_transactions DROP CONSTRAINT IF EXISTS zvd_transactions_status_check;

-- zvd_transactions: add columns queried / inserted by routes
ALTER TABLE zvd_transactions
  ADD COLUMN IF NOT EXISTS type         TEXT NOT NULL DEFAULT 'invoice',
  ADD COLUMN IF NOT EXISTS number       TEXT,
  ADD COLUMN IF NOT EXISTS tax_amount   NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date     DATE,
  ADD COLUMN IF NOT EXISTS paid_date    DATE,
  ADD COLUMN IF NOT EXISTS line_items   JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS reference    TEXT,
  ADD COLUMN IF NOT EXISTS metadata     JSONB NOT NULL DEFAULT '{}';
