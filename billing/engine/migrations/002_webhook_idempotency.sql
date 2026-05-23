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
DROP INDEX IF EXISTS idx_billing_webhook_events_received_at;
DROP TABLE IF EXISTS zv_billing_webhook_events;
