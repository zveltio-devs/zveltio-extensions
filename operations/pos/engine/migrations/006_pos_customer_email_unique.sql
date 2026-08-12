-- Creating a customer from the till has never worked.
--
-- The route upserts on the e-mail address:
--
--   INSERT INTO zvd_pos_customers (…) ON CONFLICT (email) DO UPDATE …
--
-- and no unique constraint on `email` was ever created, so Postgres answers
--
--   ERROR: there is no unique or exclusion constraint matching the
--          ON CONFLICT specification
--
-- to every single call. Not an edge case and not a race: the statement cannot
-- execute at all. Found by sweeping every ON CONFLICT clause against the
-- constraints that actually exist, while widening the keys that predate
-- multi-tenancy — this one turned out to have no key to widen.
--
-- The constraint is written the way the rest of that sweep leaves things:
-- keyed on the company as well, because two companies sharing an instance must
-- each be able to have a customer at the same address.
--
-- `email` is optional at the till, and a unique constraint treats NULLs as
-- distinct, so walk-in customers with no address recorded are unaffected.

ALTER TABLE zvd_pos_customers
  DROP CONSTRAINT IF EXISTS zvd_pos_customers_tenant_email_key;

ALTER TABLE zvd_pos_customers
  ADD CONSTRAINT zvd_pos_customers_tenant_email_key UNIQUE (tenant_id, email);
