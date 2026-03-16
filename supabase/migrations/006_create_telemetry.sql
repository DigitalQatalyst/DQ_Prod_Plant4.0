-- Create tags and telemetry_points tables for telemetry data
-- Requirements: 3.6, 3.7

-- Create enum type for protocol
CREATE TYPE telemetry_protocol AS ENUM (
  'OPC-UA',
  'Modbus',
  'MQTT',
  'DNP3',
  'IEC61850'
);

-- Create tags table for protocol/address mapping
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  protocol telemetry_protocol NOT NULL,
  address TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create telemetry_points table for metric definitions
CREATE TABLE telemetry_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE SET NULL,
  metric TEXT NOT NULL,           -- 'voltage', 'current', 'temperature', etc.
  unit TEXT,                      -- 'kV', 'A', '°C', etc.
  limits JSONB,                   -- { "min": 0, "max": 100, "warning": 80, "critical": 95 }
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_tags_tenant ON tags(tenant_id);
CREATE INDEX idx_tags_asset ON tags(asset_id);
CREATE INDEX idx_tags_protocol ON tags(protocol);

CREATE INDEX idx_telemetry_tenant ON telemetry_points(tenant_id);
CREATE INDEX idx_telemetry_asset ON telemetry_points(asset_id);
CREATE INDEX idx_telemetry_tag ON telemetry_points(tag_id);
CREATE INDEX idx_telemetry_metric ON telemetry_points(metric);