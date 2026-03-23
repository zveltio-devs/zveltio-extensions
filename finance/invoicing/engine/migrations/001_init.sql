-- Invoicing extension schema

CREATE TABLE IF NOT EXISTS zvd_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  client_id TEXT,
  client_type TEXT CHECK (client_type IN ('contact','organization')),
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  subtotal NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  notes TEXT,
  recurring_interval TEXT CHECK (recurring_interval IN ('monthly','quarterly','yearly')),
  next_issue_date DATE,
  paid_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zvd_invoices_status ON zvd_invoices(status);
CREATE INDEX idx_zvd_invoices_due_date ON zvd_invoices(due_date);
CREATE INDEX idx_zvd_invoices_client ON zvd_invoices(client_id);

CREATE TABLE IF NOT EXISTS zvd_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES zvd_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 19,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX idx_zvd_invoice_lines_invoice ON zvd_invoice_lines(invoice_id);
