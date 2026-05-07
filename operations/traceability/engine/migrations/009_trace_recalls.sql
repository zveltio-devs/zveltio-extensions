CREATE TABLE IF NOT EXISTS trace_recalls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES trace_lots(id),
  scope VARCHAR NOT NULL CHECK (scope IN ('internal','market_withdrawal','consumer_recall')),
  reason TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','cancelled')),
  initiated_by UUID,
  initiated_at TIMESTAMPTZ DEFAULT now(),
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  affected_downstream_lots JSONB DEFAULT '[]',
  notification_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_recalls_status ON trace_recalls(status);
CREATE INDEX IF NOT EXISTS idx_recalls_lot ON trace_recalls(lot_id);
