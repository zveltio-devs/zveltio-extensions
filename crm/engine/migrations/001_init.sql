-- CRM extension — contacts, organizations, transactions (deals)

CREATE TABLE IF NOT EXISTS zvd_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  organization_id UUID,
  owner_id TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_owner ON zvd_contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON zvd_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON zvd_contacts(email);

CREATE TABLE IF NOT EXISTS zvd_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  phone TEXT,
  address TEXT,
  owner_id TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_orgs_owner ON zvd_organizations(owner_id);

ALTER TABLE zvd_contacts
  ADD CONSTRAINT fk_crm_contact_org
  FOREIGN KEY (organization_id) REFERENCES zvd_organizations(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS zvd_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_id UUID REFERENCES zvd_contacts(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES zvd_organizations(id) ON DELETE SET NULL,
  owner_id TEXT,
  amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RON',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','won','lost','on_hold')),
  pipeline_stage_id UUID,
  stage_changed_at TIMESTAMPTZ,
  expected_close_date DATE,
  lead_score INT NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_txn_owner ON zvd_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_txn_contact ON zvd_transactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_txn_status ON zvd_transactions(status);
