-- 001_initial.sql
--
-- Consolidated initial schema for the `billing` extension.
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
--   • 001_billing.sql
--   • 002_webhook_idempotency.sql

-- ── from 001_billing.sql ──
CREATE TABLE IF NOT EXISTS zv_billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stripe_price_id TEXT,
  limits JSONB NOT NULL DEFAULT '{}',  -- {api_calls: 10000, storage_mb: 1000, records: 50000}
  price_cents INTEGER NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'month',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS zv_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT,
  event_type TEXT NOT NULL,  -- 'api_call', 'storage_write', 'record_created', 'webhook_delivery'
  collection TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant ON zv_usage_events(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON zv_usage_events(event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS zv_billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT,
  plan_id UUID REFERENCES zv_billing_plans(id),
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── from 002_webhook_idempotency.sql ──
-- Webhook idempotency for Stripe event redelivery.
--
-- Stripe retries failed webhook deliveries with the same `event.id`
-- (and the SDK explicitly recommends client-side dedupe). Without this
-- table, every retry re-applied the state transition: a subscription
-- could land in `canceled` and then back in `active` if the
-- payment_succeeded retry arrived after the actual cancel, etc.

CREATE TABLE IF NOT EXISTS zv_billing_webhook_events (
  event_id    TEXT PRIMARY KEY,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Retention: a Stripe event id is unique per event, so the dedupe table
-- only needs to survive Stripe's retry window (~3 days). The garbage
-- collector can purge anything older than 30 days to keep the table
-- bounded; the constraint that matters is the PRIMARY KEY uniqueness.
CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_received_at
  ON zv_billing_webhook_events(received_at DESC);

-- DOWN

-- ── DOWN from 002_webhook_idempotency.sql ──
DROP INDEX IF EXISTS idx_billing_webhook_events_received_at;
DROP TABLE IF EXISTS zv_billing_webhook_events;
