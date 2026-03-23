-- Public holidays table (Romanian calendar)
CREATE TABLE IF NOT EXISTS zvd_public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  year INT NOT NULL,
  UNIQUE (date)
);

-- Seed Romanian public holidays 2025
INSERT INTO zvd_public_holidays (date, name, year) VALUES
  ('2025-01-01', 'Anul Nou', 2025),
  ('2025-01-02', 'Ziua de după Anul Nou', 2025),
  ('2025-01-24', 'Ziua Unirii Principatelor', 2025),
  ('2025-04-18', 'Vinerea Mare', 2025),
  ('2025-04-20', 'Paștele ortodox', 2025),
  ('2025-04-21', 'A doua zi de Paști', 2025),
  ('2025-05-01', 'Ziua Muncii', 2025),
  ('2025-06-01', 'Ziua Copilului', 2025),
  ('2025-06-08', 'Rusalii', 2025),
  ('2025-06-09', 'A doua zi de Rusalii', 2025),
  ('2025-08-15', 'Adormirea Maicii Domnului', 2025),
  ('2025-11-30', 'Sf. Andrei', 2025),
  ('2025-12-01', 'Ziua Națională', 2025),
  ('2025-12-25', 'Crăciun', 2025),
  ('2025-12-26', 'A doua zi de Crăciun', 2025)
ON CONFLICT (date) DO NOTHING;

-- Leave carry-over rules
CREATE TABLE IF NOT EXISTS zvd_leave_carryover_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type_id UUID NOT NULL REFERENCES zvd_leave_types(id) ON DELETE CASCADE,
  max_carry_days NUMERIC(5,1) NOT NULL DEFAULT 0,
  expiry_months INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (leave_type_id)
);

-- Leave carry-over log
CREATE TABLE IF NOT EXISTS zvd_leave_carryover_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,
  leave_type_id UUID NOT NULL REFERENCES zvd_leave_types(id),
  from_year INT NOT NULL,
  to_year INT NOT NULL,
  days_carried NUMERIC(5,1) NOT NULL,
  expires_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add half-day support and overlap tracking to leave requests
ALTER TABLE zvd_leave_requests ADD COLUMN IF NOT EXISTS is_half_day BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zvd_leave_requests ADD COLUMN IF NOT EXISTS half_day_period TEXT CHECK (half_day_period IN ('am','pm'));
ALTER TABLE zvd_leave_requests ADD COLUMN IF NOT EXISTS cover_employee_id UUID;
ALTER TABLE zvd_leave_requests ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]';
-- Add carry-over tracking to balances
ALTER TABLE zvd_leave_balances ADD COLUMN IF NOT EXISTS carried_over_days NUMERIC(5,1) NOT NULL DEFAULT 0;
ALTER TABLE zvd_leave_balances ADD COLUMN IF NOT EXISTS carryover_expires_at DATE;
