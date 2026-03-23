-- Import jobs tracking
CREATE TABLE IF NOT EXISTS zv_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  format TEXT NOT NULL DEFAULT 'csv' CHECK (format IN ('csv','json','ndjson')),
  filename TEXT,
  total_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  failed_rows INT NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_import_logs_collection ON zv_import_logs(collection);
CREATE INDEX idx_import_logs_status ON zv_import_logs(status);
