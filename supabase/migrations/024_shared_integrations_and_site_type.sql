-- Add site_type column to sites table
-- This allows categorizing sites by their function in the power transmission network

ALTER TABLE sites 
ADD COLUMN site_type TEXT;

-- Add a check constraint for valid site types
ALTER TABLE sites
ADD CONSTRAINT chk_site_type CHECK (
  site_type IS NULL OR 
  site_type IN (
    'substation',
    'generation',
    'transmission',
    'distribution',
    'control-center',
    'switching-station',
    'other'
  )
);

-- Set default for existing rows
UPDATE sites 
SET site_type = 'substation' 
WHERE site_type IS NULL;

-- Create index for filtering by site type
CREATE INDEX idx_sites_site_type ON sites(site_type);

-- Create integration_types table (global catalog)
CREATE TABLE integration_types (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Create integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type_code TEXT NOT NULL REFERENCES integration_types(code),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  last_sync_at TIMESTAMPTZ,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_integrations_tenant_status 
  ON integrations(tenant_id, status);

-- Create integration_mappings table
CREATE TABLE integration_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  mapping JSONB
);

CREATE INDEX idx_integration_mappings_integration_site 
  ON integration_mappings(integration_id, site_id);

-- Create integration_health_events table
CREATE TABLE integration_health_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB
);

CREATE INDEX idx_integration_health_tenant_integration_time 
  ON integration_health_events(tenant_id, integration_id, timestamp DESC);
