-- Create alerts table for cross-domain alerts
-- Requirements: 3.5

-- Create enum type for source_type
CREATE TYPE alert_source_type AS ENUM (
  'asset',
  'grid_node', 
  'grid_line',
  'security',
  'automation'
);

-- Create enum type for severity
CREATE TYPE alert_severity AS ENUM (
  'info',
  'warning',
  'critical'
);

-- Create enum type for status
CREATE TYPE alert_status AS ENUM (
  'open',
  'acknowledged',
  'in-progress',
  'closed'
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_type alert_source_type NOT NULL,
  source_id UUID,
  severity alert_severity NOT NULL,
  status alert_status DEFAULT 'open',
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  payload JSONB DEFAULT '{}'
);

-- Create indexes for common queries
CREATE INDEX idx_alerts_tenant ON alerts(tenant_id);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_source ON alerts(source_type, source_id);