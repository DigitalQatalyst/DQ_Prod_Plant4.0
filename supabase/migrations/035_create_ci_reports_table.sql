-- Migration: Create CI Reports Table
-- Description: Creates table for CI reports with configuration, content, and distribution tracking

CREATE TABLE ci_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_ref TEXT NOT NULL,
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  scope TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'in-review', 'published')) DEFAULT 'draft',
  generated_date DATE NOT NULL,
  author TEXT NOT NULL,
  recipients INTEGER DEFAULT 0,
  content JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ci_reports_tenant_ref_unique UNIQUE(tenant_id, report_ref)
);

-- Add indexes
CREATE INDEX idx_ci_reports_tenant_id ON ci_reports(tenant_id);
CREATE INDEX idx_ci_reports_status ON ci_reports(status);
CREATE INDEX idx_ci_reports_generated_date ON ci_reports(generated_date);

-- Add table comment
COMMENT ON TABLE ci_reports IS 'CI reports with configuration, content, and distribution tracking';

-- Enable RLS
ALTER TABLE ci_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "ci_reports_allow_all" ON ci_reports
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON ci_reports TO authenticated;
GRANT ALL ON ci_reports TO anon;

-- Add trigger for updated_at
CREATE TRIGGER update_ci_reports_updated_at 
  BEFORE UPDATE ON ci_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
