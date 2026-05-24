-- 001_initial.sql
--
-- Consolidated initial schema for the `finance/subscriptions` extension.
--
-- Squashed from the per-version migration files that lived in this
-- folder during alpha. The project is pre-1.0 and no extension has
-- shipped to production, so collapsing the history into one file is
-- safe — there is no installed base whose `zv_migrations` table
-- already records versions 002+. New deployments install the full
-- extension schema in a single migration; further schema changes
-- ship as `002_*.sql`, `003_*.sql`, ... going forward.
--
-- Source files (applied in this order):
--   • 001_init.sql
--   • 002_enterprise.sql

-- ── from 001_init.sql ──
-- Subscriptions extension schema

CREATE TABLE IF NOT EXISTS zvd_subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  interval TEXT NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly','quarterly','yearly')),
  trial_days INT NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_price_id TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zvd_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id TEXT,
  organization_id TEXT,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  plan_id UUID NOT NULL REFERENCES zvd_subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','cancelled','expired')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  trial_end TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_subscribers_plan ON zvd_subscribers(plan_id);
CREATE INDEX IF NOT EXISTS idx_zvd_subscribers_status ON zvd_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_zvd_subscribers_email ON zvd_subscribers(email);

CREATE TABLE IF NOT EXISTS zvd_subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES zvd_subscribers(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES zvd_subscription_plans(id),
  amount NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','paid','void','uncollectible')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  stripe_invoice_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zvd_sub_invoices_subscriber ON zvd_subscription_invoices(subscriber_id);

-- ── from 002_enterprise.sql ──
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

