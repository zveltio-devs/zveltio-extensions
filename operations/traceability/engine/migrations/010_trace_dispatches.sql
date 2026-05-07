-- Pending/confirmed dispatches — created automatically when an invoice with lot_id
-- in line metadata is detected via the event bus (invoice:created → record.created).
-- Also supports manual (direct) dispatches without an invoice.
CREATE TABLE IF NOT EXISTS trace_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- invoice link (null for direct dispatches)
  invoice_id UUID,
  invoice_number VARCHAR(100),
  invoice_line_id UUID,

  -- customer
  customer_id UUID,
  customer_name VARCHAR(255),

  -- what is being dispatched
  lot_id UUID REFERENCES trace_lots(id),
  item_name_from_invoice VARCHAR(255),
  quantity_invoiced NUMERIC(12,3),
  quantity_dispatched NUMERIC(12,3),        -- filled at confirmation
  unit VARCHAR(20) NOT NULL DEFAULT 'buc',

  -- lifecycle
  status VARCHAR NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID
);

CREATE INDEX IF NOT EXISTS idx_dispatches_status ON trace_dispatches(status);
CREATE INDEX IF NOT EXISTS idx_dispatches_lot ON trace_dispatches(lot_id);
CREATE INDEX IF NOT EXISTS idx_dispatches_invoice ON trace_dispatches(invoice_id);
