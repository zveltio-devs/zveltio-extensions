-- Expenses extension schema

CREATE TABLE IF NOT EXISTS zvd_expense_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','paid')),
  submitted_at TIMESTAMPTZ,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RON',
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zvd_expense_reports_employee ON zvd_expense_reports(employee_id);
CREATE INDEX idx_zvd_expense_reports_status ON zvd_expense_reports(status);

CREATE TABLE IF NOT EXISTS zvd_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES zvd_expense_reports(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('travel','meals','accommodation','supplies','software','fuel','entertainment','other')),
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RON',
  receipt_url TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zvd_expenses_report ON zvd_expenses(report_id);
CREATE INDEX idx_zvd_expenses_category ON zvd_expenses(category);
