-- Migration 015: Create Connectivity Tables
-- Creates connection_endpoints and stream_configs tables for Cycle 4

-- ============================================================================
-- Table: connection_endpoints
-- Purpose: Protocol endpoints for industrial data collection
-- ============================================================================

CREATE TABLE connection_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('IEC61850', 'DNP3', 'OPC-UA', 'Modbus-TCP', 'MQTT')),
  address TEXT NOT NULL,
  port INTEGER CHECK (port IS NULL OR (port >= 1 AND port <= 65535)),
  zone TEXT CHECK (zone IS NULL OR zone IN ('IT', 'OT', 'DMZ')),
  hazardous_area TEXT,
  status TEXT NOT NULL DEFAULT 'unknown' CHECK (status IN ('up', 'down', 'unknown')),
  last_seen TIMESTAMPTZ,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_connection_endpoints_tenant ON connection_endpoints(tenant_id);
CREATE INDEX idx_connection_endpoints_protocol ON connection_endpoints(protocol);
CREATE INDEX idx_connection_endpoints_status ON connection_endpoints(status);

COMMENT ON TABLE connection_endpoints IS 'Protocol endpoints for industrial data collection (IEC61850, DNP3, OPC-UA, Modbus-TCP, MQTT)';
COMMENT ON COLUMN connection_endpoints.zone IS 'Network zone classification: IT, OT, or DMZ';
COMMENT ON COLUMN connection_endpoints.status IS 'Current endpoint status: up, down, or unknown';
COMMENT ON COLUMN connection_endpoints.last_seen IS 'Last successful communication timestamp';

-- ============================================================================
-- Table: stream_configs
-- Purpose: Data collection and retention policy configuration
-- ============================================================================

CREATE TABLE stream_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  polling_interval INTEGER NOT NULL CHECK (polling_interval >= 100),
  retention TEXT NOT NULL CHECK (retention IN ('7d', '30d', '90d', '1y')),
  profile TEXT NOT NULL CHECK (profile IN ('high-frequency', 'standard', 'low-frequency')),
  asset_types TEXT[] DEFAULT '{}',
  is_sandbox BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_stream_configs_tenant ON stream_configs(tenant_id);
CREATE INDEX idx_stream_configs_profile ON stream_configs(profile);

COMMENT ON TABLE stream_configs IS 'Data collection policies with polling intervals and retention periods';
COMMENT ON COLUMN stream_configs.polling_interval IS 'Polling interval in milliseconds (minimum 100ms)';
COMMENT ON COLUMN stream_configs.retention IS 'Data retention period: 7d, 30d, 90d, or 1y';
COMMENT ON COLUMN stream_configs.profile IS 'Stream profile: high-frequency (≤1000ms), standard (5000-60000ms), low-frequency (>60000ms)';
COMMENT ON COLUMN stream_configs.is_sandbox IS 'Flag indicating if this is a sandbox/demo stream with simulated data';
