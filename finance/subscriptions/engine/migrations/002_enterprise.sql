-- Usage-based billing
CREATE TABLE IF NOT EXISTS zvd_subscription_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES zvd_subscribers(id),
  metric_name TEXT NOT NULL,
  quantity NUMERIC(18,4) NOT NULL,
  unit_price NUMERIC(18,4) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  billing_period_start DATE,
  billing_period_end DATE,
  is_billed BOOLEAN NOT NULL DEFAULT false
);

-- Dunning schedule (retry failed payments)
CREATE TABLE IF NOT EXISTS zvd_dunning_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES zvd_subscribers(id),
  invoice_id UUID REFERENCES zvd_subscription_invoices(id),
  attempt_number INT NOT NULL DEFAULT 1,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','skipped')),
  next_attempt_at TIMESTAMPTZ,
  notes TEXT
);

-- Plan change history
CREATE TABLE IF NOT EXISTS zvd_plan_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES zvd_subscribers(id),
  from_plan_id UUID REFERENCES zvd_subscription_plans(id),
  to_plan_id UUID NOT NULL REFERENCES zvd_subscription_plans(id),
  effective_date DATE NOT NULL,
  proration_amount NUMERIC(18,2) DEFAULT 0,
  reason TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add to plans
ALTER TABLE zvd_subscription_plans ADD COLUMN IF NOT EXISTS usage_billing BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zvd_subscription_plans ADD COLUMN IF NOT EXISTS usage_metric TEXT;
ALTER TABLE zvd_subscription_plans ADD COLUMN IF NOT EXISTS usage_unit_price NUMERIC(18,4) DEFAULT 0;
ALTER TABLE zvd_subscription_plans ADD COLUMN IF NOT EXISTS max_usage NUMERIC(18,4);

-- Add to subscribers
ALTER TABLE zvd_subscribers ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ;
ALTER TABLE zvd_subscribers ADD COLUMN IF NOT EXISTS paused_until DATE;
ALTER TABLE zvd_subscribers ADD COLUMN IF NOT EXISTS dunning_count INT NOT NULL DEFAULT 0;
ALTER TABLE zvd_subscribers ADD COLUMN IF NOT EXISTS payment_failure_at TIMESTAMPTZ;

-- Add to subscription invoices
ALTER TABLE zvd_subscription_invoices ADD COLUMN IF NOT EXISTS usage_amount NUMERIC(18,2) NOT NULL DEFAULT 0;
ALTER TABLE zvd_subscription_invoices ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18,2);
