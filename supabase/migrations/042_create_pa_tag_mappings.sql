-- ============================================================================
-- Migration: 042_create_pa_tag_mappings
-- Feature: Process Automation - Integrate & Model
-- Description: Create pa_tag_mappings table for SCADA/OT tag mapping
-- Requirements: AC 2.1.1-2.1.7
-- ============================================================================

-- Create helper function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create pa_tag_mappings table
-- Maps SCADA/OT tags to standardized internal tags
CREATE TABLE IF NOT EXISTS pa_tag_mappings (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tenant isolation
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Site reference
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  
  -- Source system information
  source_system VARCHAR(100) NOT NULL, -- e.g., "SCADA", "DCS", "PLC"
  source_tag VARCHAR(255) NOT NULL, -- Original tag name from source system
  
  -- Internal mapping
  internal_tag VARCHAR(255) NOT NULL, -- Standardized internal tag name
  
  -- Data type and unit
  data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('boolean', 'integer', 'float', 'string', 'timestamp')),
  unit VARCHAR(50), -- e.g., "kW", "Â°C", "bar"
  
  -- Metadata
  description TEXT,
  
  -- Value conversion
  scaling_factor DECIMAL(10, 4), -- Multiplier for value conversion
  "offset" DECIMAL(10, 4), -- Offset for value conversion
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255) NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_source_tag_per_tenant UNIQUE (tenant_id, source_system, source_tag),
  CONSTRAINT unique_internal_tag_per_tenant UNIQUE (tenant_id, internal_tag)
);

-- Create indexes for performance
CREATE INDEX idx_pa_tag_mappings_tenant_id ON pa_tag_mappings(tenant_id);
CREATE INDEX idx_pa_tag_mappings_site_id ON pa_tag_mappings(site_id);
CREATE INDEX idx_pa_tag_mappings_source_system ON pa_tag_mappings(source_system);
CREATE INDEX idx_pa_tag_mappings_is_active ON pa_tag_mappings(is_active);
CREATE INDEX idx_pa_tag_mappings_internal_tag ON pa_tag_mappings(internal_tag);

-- Create updated_at trigger
CREATE TRIGGER update_pa_tag_mappings_updated_at
  BEFORE UPDATE ON pa_tag_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add table comment
COMMENT ON TABLE pa_tag_mappings IS 'Process Automation: Maps SCADA/OT tags to standardized internal tags for process automation';

-- Add column comments
COMMENT ON COLUMN pa_tag_mappings.source_system IS 'Source system type (SCADA, DCS, PLC, etc.)';
COMMENT ON COLUMN pa_tag_mappings.source_tag IS 'Original tag name from source system';
COMMENT ON COLUMN pa_tag_mappings.internal_tag IS 'Standardized internal tag name';
COMMENT ON COLUMN pa_tag_mappings.data_type IS 'Data type: boolean, integer, float, string, or timestamp';
COMMENT ON COLUMN pa_tag_mappings.unit IS 'Unit of measurement (kW, Â°C, bar, etc.)';
COMMENT ON COLUMN pa_tag_mappings.scaling_factor IS 'Multiplier for value conversion';
COMMENT ON COLUMN pa_tag_mappings.offset IS 'Offset for value conversion';
COMMENT ON COLUMN pa_tag_mappings.is_active IS 'Whether this tag mapping is currently active';
