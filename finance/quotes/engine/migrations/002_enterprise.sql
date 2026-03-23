-- Quote revisions
CREATE TABLE IF NOT EXISTS zvd_quote_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES zvd_quotes(id) ON DELETE CASCADE,
  revision_number INT NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  change_note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public access tokens for client-facing quote view
CREATE TABLE IF NOT EXISTS zvd_quote_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES zvd_quotes(id) ON DELETE CASCADE UNIQUE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Internal approval workflow
CREATE TABLE IF NOT EXISTS zvd_quote_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES zvd_quotes(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'))
);

-- Add revision tracking to quotes
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS revision INT NOT NULL DEFAULT 1;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT NULL CHECK (approval_status IS NULL OR approval_status IN ('pending','approved','rejected'));
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS footer_notes TEXT;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE zvd_quotes ADD COLUMN IF NOT EXISTS public_token TEXT;
