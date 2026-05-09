CREATE TABLE IF NOT EXISTS zv_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  -- fields: [{id, type, label, required, placeholder, options[], validation}]
  -- types: text, textarea, email, number, select, multiselect, checkbox, date, file
  target_collection TEXT,  -- if set, submissions write to this collection
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES zv_forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Upgrade: add form_id to existing table created by pre-extension schema
ALTER TABLE zv_form_submissions ADD COLUMN IF NOT EXISTS form_id UUID;
ALTER TABLE zv_form_submissions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE zv_form_submissions ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON zv_form_submissions(form_id, created_at DESC);
