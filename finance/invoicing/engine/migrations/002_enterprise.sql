-- Partial payments tracking
CREATE TABLE IF NOT EXISTS zvd_invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES zvd_invoices(id) ON DELETE CASCADE,
  amount NUMERIC(18,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'transfer' CHECK (payment_method IN ('cash','card','transfer','check','other')),
  reference TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit notes (reverse invoices)
CREATE TABLE IF NOT EXISTS zvd_credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  original_invoice_id UUID REFERENCES zvd_invoices(id),
  client_id UUID,
  client_name TEXT NOT NULL,
  client_email TEXT,
  reason TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  currency TEXT NOT NULL DEFAULT 'RON',
  subtotal NUMERIC(18,2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','applied')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_credit_note_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID NOT NULL REFERENCES zvd_credit_notes(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,4) NOT NULL DEFAULT 1,
  unit_price NUMERIC(18,4) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  total NUMERIC(18,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

-- Payment reminders
CREATE TABLE IF NOT EXISTS zvd_payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES zvd_invoices(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reminder_type TEXT NOT NULL DEFAULT 'gentle' CHECK (reminder_type IN ('gentle','firm','final')),
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email','sms','manual')),
  notes TEXT
);

-- Add columns to invoices
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS amount_due NUMERIC(18,2);
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS footer_notes TEXT;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_invoices ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0;
