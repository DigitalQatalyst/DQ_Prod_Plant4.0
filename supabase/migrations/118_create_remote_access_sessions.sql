-- Create remote access sessions table for transmission system access monitoring
-- Requirements: 3.5

CREATE TABLE remote_access_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  user_id UUID REFERENCES security_users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('rdp', 'ssh', 'vnc', 'web', 'scada-client', 'iec61850-client')),
  target_system TEXT NOT NULL,
  target_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  source_ip TEXT NOT NULL,
  destination_ip TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'terminated', 'expired', 'failed')),
  authentication_method TEXT NOT NULL CHECK (authentication_method IN ('password', 'certificate', 'mfa', 'sso')),
  authorization_status TEXT NOT NULL CHECK (authorization_status IN ('authorized', 'unauthorized', 'pending')),
  session_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  session_end TIMESTAMPTZ,
  duration_seconds INTEGER,
  commands_executed INTEGER DEFAULT 0,
  files_transferred INTEGER DEFAULT 0,
  alerts_triggered INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  termination_reason TEXT,
  audit_trail JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_remote_access_sessions_tenant ON remote_access_sessions(tenant_id);
CREATE INDEX idx_remote_access_sessions_site ON remote_access_sessions(site_id);
CREATE INDEX idx_remote_access_sessions_user ON remote_access_sessions(user_id);
CREATE INDEX idx_remote_access_sessions_username ON remote_access_sessions(username);
CREATE INDEX idx_remote_access_sessions_status ON remote_access_sessions(status);
CREATE INDEX idx_remote_access_sessions_target_asset ON remote_access_sessions(target_asset_id);
CREATE INDEX idx_remote_access_sessions_session_start ON remote_access_sessions(session_start);
CREATE INDEX idx_remote_access_sessions_risk_score ON remote_access_sessions(risk_score);
CREATE INDEX idx_remote_access_sessions_auth_status ON remote_access_sessions(authorization_status);

-- Enable Row Level Security
-- ALTER TABLE remote_access_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for remote_access_sessions
-- CREATE POLICY "remote_access_sessions_tenant_isolation" ON remote_access_sessions
--   FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_remote_access_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER remote_access_sessions_updated_at
  BEFORE UPDATE ON remote_access_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_remote_access_sessions_updated_at();

-- Create function to calculate session duration on end
CREATE OR REPLACE FUNCTION calculate_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.session_end IS NOT NULL AND NEW.session_start IS NOT NULL THEN
    NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.session_end - NEW.session_start))::INTEGER;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for duration calculation
CREATE TRIGGER remote_access_sessions_duration
  BEFORE INSERT OR UPDATE ON remote_access_sessions
  FOR EACH ROW
  WHEN (NEW.session_end IS NOT NULL)
  EXECUTE FUNCTION calculate_session_duration();

