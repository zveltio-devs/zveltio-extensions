-- 001_initial.sql — analytics/dashboard
--
-- Stores dashboard layouts for the role-aware, per-user home.
--   scope='role' , owner=<role name>  → the default layout IT sets for a role
--   scope='user' , owner=<user id>    → a user's personal layout, on top of role
--
-- `widgets` is an ordered JSON array of widget ids. The permission ceiling is
-- enforced in the routes, never here.

CREATE TABLE IF NOT EXISTS zv_dashboard_layouts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope      TEXT NOT NULL CHECK (scope IN ('role','user')),
  owner      TEXT NOT NULL,
  widgets    JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zv_dashboard_layouts_lookup
  ON zv_dashboard_layouts (scope, owner);
