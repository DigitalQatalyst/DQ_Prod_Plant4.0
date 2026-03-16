-- Migration: Create Shift Performance Metrics Table
-- Description: Creates table for tracking shift performance metrics and KPIs

CREATE TABLE shift_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES sim_shifts(id) ON DELETE CASCADE,
  performance_score DOUBLE PRECISION NOT NULL,
  status TEXT CHECK (status IN ('excellent', 'good', 'needs-improvement', 'critical')) DEFAULT 'good',
  achievements INTEGER DEFAULT 0,
  issues INTEGER DEFAULT 0,
  metrics JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT shift_performance_shift_unique UNIQUE(shift_id)
);

-- Add indexes
CREATE INDEX idx_shift_performance_tenant_id ON shift_performance(tenant_id);
CREATE INDEX idx_shift_performance_shift_id ON shift_performance(shift_id);
CREATE INDEX idx_shift_performance_status ON shift_performance(status);

-- Add table comment
COMMENT ON TABLE shift_performance IS 'Shift performance metrics and KPIs for tracking operational excellence';

-- Enable RLS
ALTER TABLE shift_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "shift_performance_allow_all" ON shift_performance
  FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON shift_performance TO authenticated;
GRANT ALL ON shift_performance TO anon;

-- Add trigger for updated_at
CREATE TRIGGER update_shift_performance_updated_at 
  BEFORE UPDATE ON shift_performance 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
