-- SEO analysis scores
CREATE TABLE IF NOT EXISTS zv_page_seo_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE,
  overall_score INT NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  title_score INT NOT NULL DEFAULT 0,
  meta_description_score INT NOT NULL DEFAULT 0,
  heading_score INT NOT NULL DEFAULT 0,
  image_alt_score INT NOT NULL DEFAULT 0,
  issues JSONB NOT NULL DEFAULT '[]',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- A/B test variants
CREATE TABLE IF NOT EXISTS zv_page_ab_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  blocks JSONB NOT NULL DEFAULT '[]',
  traffic_pct INT NOT NULL DEFAULT 50 CHECK (traffic_pct BETWEEN 1 AND 99),
  is_active BOOLEAN NOT NULL DEFAULT true,
  views INT NOT NULL DEFAULT 0,
  conversions INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Page performance metrics (daily aggregates)
CREATE TABLE IF NOT EXISTS zv_page_metrics (
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  avg_time_on_page_seconds INT NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (page_id, date)
);

-- URL redirects
CREATE TABLE IF NOT EXISTS zv_page_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  redirect_type INT NOT NULL DEFAULT 301 CHECK (redirect_type IN (301, 302)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  hit_count INT NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sitemap config per page
CREATE TABLE IF NOT EXISTS zv_page_sitemap_config (
  page_id UUID NOT NULL REFERENCES zv_pages(id) ON DELETE CASCADE UNIQUE,
  include_in_sitemap BOOLEAN NOT NULL DEFAULT true,
  change_freq TEXT NOT NULL DEFAULT 'weekly' CHECK (change_freq IN ('always','hourly','daily','weekly','monthly','yearly','never')),
  priority NUMERIC(2,1) NOT NULL DEFAULT 0.5 CHECK (priority BETWEEN 0 AND 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add columns to pages
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'ro';
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS og_image TEXT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS is_noindex BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS reading_time_minutes INT;
ALTER TABLE zv_pages ADD COLUMN IF NOT EXISTS canonical_page_id UUID REFERENCES zv_pages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pages_locale ON zv_pages(locale, status);
CREATE INDEX IF NOT EXISTS idx_page_redirects_active ON zv_page_redirects(from_path) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_page_metrics_date ON zv_page_metrics(date DESC);
