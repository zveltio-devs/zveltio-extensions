-- GDPR data processing records (DPIA / Article 30)
CREATE TABLE IF NOT EXISTS zvd_gdpr_processing_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  legal_basis TEXT NOT NULL CHECK (legal_basis IN ('consent','contract','legal_obligation','vital_interests','public_task','legitimate_interests')),
  data_categories TEXT[] NOT NULL DEFAULT '{}',
  data_subjects TEXT[] NOT NULL DEFAULT '{}',
  retention_period_days INT,
  third_party_recipients TEXT[] NOT NULL DEFAULT '{}',
  technical_measures TEXT,
  organizational_measures TEXT,
  dpia_required BOOLEAN NOT NULL DEFAULT false,
  dpia_completed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consent records
CREATE TABLE IF NOT EXISTS zvd_gdpr_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  email TEXT,
  purpose TEXT NOT NULL,
  processing_record_id UUID REFERENCES zvd_gdpr_processing_records(id) ON DELETE SET NULL,
  granted BOOLEAN NOT NULL,
  ip TEXT,
  user_agent TEXT,
  source TEXT NOT NULL DEFAULT 'web',
  withdrawn_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subject access requests (SAR)
CREATE TABLE IF NOT EXISTS zvd_gdpr_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_email TEXT NOT NULL,
  requester_name TEXT NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('access','erasure','portability','rectification','restriction','objection')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','rejected','withdrawn')),
  due_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  assigned_to TEXT,
  resolution_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Data breach incidents
CREATE TABLE IF NOT EXISTS zvd_gdpr_breach_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  discovered_at TIMESTAMPTZ NOT NULL,
  affected_records_estimate INT,
  data_categories TEXT[] NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','contained','reported','closed')),
  dpa_reported_at TIMESTAMPTZ,
  affected_users_notified_at TIMESTAMPTZ,
  root_cause TEXT,
  remediation_steps TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_consents_user ON zvd_gdpr_consents(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_gdpr_consents_email ON zvd_gdpr_consents(email, purpose);
CREATE INDEX IF NOT EXISTS idx_gdpr_access_requests_status ON zvd_gdpr_access_requests(status, due_date);
