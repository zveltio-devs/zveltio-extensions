-- Configurable scoring for checklists.
--
-- A score is worth putting on a screen only if someone can say what it means.
-- The data-quality score removed today failed that test: a formula written into
-- the code produced a number nobody could defend, and it turned out to describe
-- collection size more than data quality. Here the shape is the same but the
-- authority is different — a person configures the weights and can therefore
-- explain the result to an auditor.
--
-- Three tables, and each one exists for a reason worth stating.
--
-- SCHEMES, not "a score". A template can carry several: an inspection checklist
-- can be measured for safety AND for completeness, and the same item can matter
-- enormously to one and not at all to the other. That is why weights hang off
-- the scheme rather than off the item — one weight per item would collapse this
-- back into a single opinion.
--
-- WEIGHTS keyed on the TEMPLATE item, because that is what the person editing
-- the scheme sees. Which forces the third thing:
--
-- `zv_checklist_items.template_item_id`. Instance items are copies, and until
-- now the only thing tying a copy to its origin was the label. Scoring by label
-- would break the first time somebody fixed a typo in a template — silently, and
-- in the direction that flatters the score. The link is explicit now. It is
-- nullable because a checklist can be built ad hoc with no template at all, and
-- those simply have nothing to score.
--
-- SCORES stored with a snapshot of the scheme that produced them. This is the
-- part that gets skipped: if weights change next year, last year's audit must
-- still read the way it read. Recomputing from current configuration would
-- quietly rewrite history, so the result carries the inputs it was computed
-- from.
--
-- One method to begin with, `weighted_completion`: the weight of the checked
-- items over the weight of all items in the scheme. More methods when somebody
-- asks for one — a scoring feature is how a product grows a rules engine nobody
-- decided to build.

ALTER TABLE zv_checklist_items
  ADD COLUMN IF NOT EXISTS template_item_id UUID;

CREATE INDEX IF NOT EXISTS idx_checklist_items_template_item
  ON zv_checklist_items (template_item_id)
  WHERE template_item_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS zv_checklist_scoring_schemes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id    UUID NOT NULL REFERENCES zv_checklist_templates(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  description    TEXT,
  -- Only `weighted_completion` today. The column exists so a second method does
  -- not need a migration to distinguish itself from the first.
  method         TEXT NOT NULL DEFAULT 'weighted_completion'
                 CHECK (method IN ('weighted_completion')),
  -- NULL means the scheme reports a number and does not judge it.
  pass_threshold NUMERIC(5, 2) CHECK (pass_threshold IS NULL OR (pass_threshold >= 0 AND pass_threshold <= 100)),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_by     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id      UUID NOT NULL DEFAULT COALESCE(
    NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  )
);

-- Per company, per template: two firms may each have a "Safety" scheme.
CREATE UNIQUE INDEX IF NOT EXISTS uq_checklist_scheme_name
  ON zv_checklist_scoring_schemes (tenant_id, template_id, name);

CREATE TABLE IF NOT EXISTS zv_checklist_scheme_weights (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_id        UUID NOT NULL REFERENCES zv_checklist_scoring_schemes(id) ON DELETE CASCADE,
  template_item_id UUID NOT NULL REFERENCES zv_checklist_template_items(id) ON DELETE CASCADE,
  -- 0 excludes an item from this scheme without deleting the row, which is how
  -- "counts for safety, not for completeness" is expressed.
  weight           NUMERIC(8, 2) NOT NULL DEFAULT 1 CHECK (weight >= 0),
  tenant_id        UUID NOT NULL DEFAULT COALESCE(
    NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  UNIQUE (scheme_id, template_item_id)
);

CREATE TABLE IF NOT EXISTS zv_checklist_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id  UUID NOT NULL REFERENCES zv_checklists(id) ON DELETE CASCADE,
  scheme_id     UUID REFERENCES zv_checklist_scoring_schemes(id) ON DELETE SET NULL,
  -- Kept even if the scheme is later renamed or deleted: a result has to stay
  -- readable on its own.
  scheme_name   TEXT NOT NULL,
  method        TEXT NOT NULL,
  score         NUMERIC(5, 2) NOT NULL,
  passed        BOOLEAN,
  -- The inputs, so the number can be re-derived by hand years later: every item
  -- with its weight and whether it was checked, plus the threshold in force.
  snapshot      JSONB NOT NULL DEFAULT '{}',
  computed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tenant_id     UUID NOT NULL DEFAULT COALESCE(
    NULLIF(current_setting('zveltio.current_tenant', true), '')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  ),
  UNIQUE (checklist_id, scheme_id)
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zveltio_rls') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON zv_checklist_scoring_schemes TO zveltio_rls;
    GRANT SELECT, INSERT, UPDATE, DELETE ON zv_checklist_scheme_weights TO zveltio_rls;
    GRANT SELECT, INSERT, UPDATE, DELETE ON zv_checklist_scores TO zveltio_rls;
  END IF;
END $$;

-- DOWN

DROP TABLE IF EXISTS zv_checklist_scores;
DROP TABLE IF EXISTS zv_checklist_scheme_weights;
DROP TABLE IF EXISTS zv_checklist_scoring_schemes;
ALTER TABLE zv_checklist_items DROP COLUMN IF EXISTS template_item_id;
