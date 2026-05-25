-- 002_tenant_rls.sql
--
-- Multi-tenant isolation for communications/mail. Same pattern as
-- crm/engine/migrations/002_tenant_rls.sql (PR #1 template).
-- See docs/AUDIT-2026-05-24.md §6.1 for the rationale; this file is
-- the result of the mechanical rollout across all remaining extensions.
--
-- Pattern:
--   1. ADD COLUMN tenant_id UUID with session-GUC DEFAULT so app code
--      writes inside the tenant transaction tag rows automatically.
--   2. (tenant_id) index per table.
--   3. ENABLE + FORCE ROW LEVEL SECURITY. FORCE matters: without it
--      the engine connects as table owner and Postgres lets the owner
--      bypass policies → RLS becomes advisory.
--   4. tenant_isolation_<table> policy: USING/WITH CHECK accepts the
--      row iff (a) GUC unset → single-tenant fallback, (b) row
--      tenant_id IS NULL (legacy data, single-tenant only), or
--      (c) row tenant_id matches the GUC.
--   5. RAISE WARNING per table on pre-existing NULL-tenant_id rows
--      when the deployment has provisioned tenants.

ALTER TABLE zv_mail_accounts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_mail_attachments ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_mail_contacts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_mail_drafts ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_mail_filters ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_mail_folders ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_mail_identities ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_mail_messages ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_mail_pgp_keys ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE zv_mail_signatures ADD COLUMN IF NOT EXISTS tenant_id UUID;

ALTER TABLE zv_mail_accounts ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_mail_attachments ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_mail_contacts ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_mail_drafts ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_mail_filters ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_mail_folders ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_mail_identities ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_mail_messages ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_mail_pgp_keys ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;
ALTER TABLE zv_mail_signatures ALTER COLUMN tenant_id SET DEFAULT NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid;

CREATE INDEX IF NOT EXISTS idx_zv_mail_accounts_tenant ON zv_mail_accounts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_mail_attachments_tenant ON zv_mail_attachments (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_mail_contacts_tenant ON zv_mail_contacts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_mail_drafts_tenant ON zv_mail_drafts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_mail_filters_tenant ON zv_mail_filters (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_mail_folders_tenant ON zv_mail_folders (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_mail_identities_tenant ON zv_mail_identities (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_mail_messages_tenant ON zv_mail_messages (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_mail_pgp_keys_tenant ON zv_mail_pgp_keys (tenant_id);
CREATE INDEX IF NOT EXISTS idx_zv_mail_signatures_tenant ON zv_mail_signatures (tenant_id);

ALTER TABLE zv_mail_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_accounts FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_mail_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_attachments FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_mail_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_contacts FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_mail_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_drafts FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_mail_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_filters FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_mail_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_folders FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_mail_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_identities FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_mail_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_messages FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_mail_pgp_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_pgp_keys FORCE  ROW LEVEL SECURITY;
ALTER TABLE zv_mail_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE zv_mail_signatures FORCE  ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zv_mail_accounts',
    'zv_mail_attachments',
    'zv_mail_contacts',
    'zv_mail_drafts',
    'zv_mail_filters',
    'zv_mail_folders',
    'zv_mail_identities',
    'zv_mail_messages',
    'zv_mail_pgp_keys',
    'zv_mail_signatures'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format($pol$
      CREATE POLICY tenant_isolation_%I ON %I
      USING (
        NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
        OR tenant_id IS NULL
        OR tenant_id::text = current_setting('zveltio.current_tenant', true)
      )
      WITH CHECK (
        NULLIF(current_setting('zveltio.current_tenant', true), '') IS NULL
        OR tenant_id IS NULL
        OR tenant_id::text = current_setting('zveltio.current_tenant', true)
      )
    $pol$, tbl, tbl);
  END LOOP;
END $$;

DO $$
DECLARE
  has_tenants BOOLEAN;
  null_count BIGINT;
  rec RECORD;
BEGIN
  SELECT EXISTS(SELECT 1 FROM zv_tenants) INTO has_tenants;
  IF NOT has_tenants THEN RETURN; END IF;

  FOR rec IN
    SELECT unnest(ARRAY[
    'zv_mail_accounts',
    'zv_mail_attachments',
    'zv_mail_contacts',
    'zv_mail_drafts',
    'zv_mail_filters',
    'zv_mail_folders',
    'zv_mail_identities',
    'zv_mail_messages',
    'zv_mail_pgp_keys',
    'zv_mail_signatures'
    ]) AS t
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', rec.t) INTO null_count;
    IF null_count > 0 THEN
      RAISE WARNING
        '[communications/mail tenant_id] % rows in % have tenant_id IS NULL but the engine has provisioned tenants. '
        'These rows are visible to ALL tenants. Backfill with: '
        'UPDATE % SET tenant_id = ''<correct-tenant-id>'' WHERE tenant_id IS NULL',
        null_count, rec.t, rec.t;
    END IF;
  END LOOP;
END $$;

-- DOWN
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'zv_mail_accounts',
    'zv_mail_attachments',
    'zv_mail_contacts',
    'zv_mail_drafts',
    'zv_mail_filters',
    'zv_mail_folders',
    'zv_mail_identities',
    'zv_mail_messages',
    'zv_mail_pgp_keys',
    'zv_mail_signatures'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_%I ON %I', tbl, tbl);
    EXECUTE format('ALTER TABLE %I NO FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP INDEX IF EXISTS idx_%I_tenant', tbl);
    EXECUTE format('ALTER TABLE %I DROP COLUMN IF EXISTS tenant_id', tbl);
  END LOOP;
END $$;
