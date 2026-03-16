-- Create tenants table for multi-sector tenant registry
-- Requirements: 3.1

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sector TEXT NOT NULL,           -- 'power', 'oil_gas', etc.
  subsector TEXT,                 -- 'transmission', 'upstream', etc.
  scenario_tag TEXT,              -- 'power_transmission_demo_v1'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for common queries
CREATE INDEX idx_tenants_sector ON tenants(sector);
CREATE INDEX idx_tenants_subsector ON tenants(subsector);