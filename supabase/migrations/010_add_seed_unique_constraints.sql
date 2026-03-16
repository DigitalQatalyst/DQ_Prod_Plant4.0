-- Add unique constraints to support idempotent seed operations
-- These constraints allow ON CONFLICT clauses to work with natural keys

-- Tenants: unique on (name, sector, subsector, scenario_tag)
ALTER TABLE tenants 
ADD CONSTRAINT uq_tenants_natural_key 
UNIQUE (name, sector, subsector, scenario_tag);

-- Sites: unique on (tenant_id, name)
ALTER TABLE sites 
ADD CONSTRAINT uq_sites_tenant_name 
UNIQUE (tenant_id, name);

-- Grid nodes: unique on (tenant_id, name)
ALTER TABLE grid_nodes 
ADD CONSTRAINT uq_grid_nodes_tenant_name 
UNIQUE (tenant_id, name);

-- Grid lines: unique on (tenant_id, name)
ALTER TABLE grid_lines 
ADD CONSTRAINT uq_grid_lines_tenant_name 
UNIQUE (tenant_id, name);

-- Assets: unique on (tenant_id, name)
ALTER TABLE assets 
ADD CONSTRAINT uq_assets_tenant_name 
UNIQUE (tenant_id, name);

-- Tags: unique on (tenant_id, asset_id, protocol, address)
ALTER TABLE tags 
ADD CONSTRAINT uq_tags_asset_protocol_address 
UNIQUE (tenant_id, asset_id, protocol, address);

-- Telemetry points: unique on (tenant_id, asset_id, metric, tag_id)
-- Note: tag_id can be NULL, so we need a partial unique index
CREATE UNIQUE INDEX uq_telemetry_points_with_tag 
ON telemetry_points (tenant_id, asset_id, metric, tag_id) 
WHERE tag_id IS NOT NULL;

CREATE UNIQUE INDEX uq_telemetry_points_without_tag 
ON telemetry_points (tenant_id, asset_id, metric) 
WHERE tag_id IS NULL;

-- Alerts: unique on (tenant_id, title, created_at, source_type, source_id)
-- This allows same title at different times or from different sources
CREATE UNIQUE INDEX uq_alerts_natural_key 
ON alerts (tenant_id, title, created_at, source_type, COALESCE(source_id::text, 'NULL'));
