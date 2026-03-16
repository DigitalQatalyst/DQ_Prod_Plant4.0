-- Migration 018: Create linear_asset_issues table
-- Purpose: Track issues on grid lines (thermal overload, protection fault, etc.)
-- Dependencies: 002_create_grid_lines.sql (grid_lines table)

CREATE TABLE linear_asset_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  grid_line_id UUID NOT NULL REFERENCES grid_lines(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('thermal_overload', 'protection_fault', 'insulator_damage', 'conductor_sag')),
  description TEXT NOT NULL CHECK (length(description) >= 10),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX idx_linear_asset_issues_tenant ON linear_asset_issues(tenant_id);
CREATE INDEX idx_linear_asset_issues_line ON linear_asset_issues(grid_line_id);
CREATE INDEX idx_linear_asset_issues_severity ON linear_asset_issues(severity);
CREATE INDEX idx_linear_asset_issues_unresolved ON linear_asset_issues(resolved_at) WHERE resolved_at IS NULL;

-- Comments for documentation
COMMENT ON TABLE linear_asset_issues IS 'Issues tracked on grid lines for transmission network maintenance';
COMMENT ON COLUMN linear_asset_issues.type IS 'Issue type: thermal_overload, protection_fault, insulator_damage, conductor_sag';
COMMENT ON COLUMN linear_asset_issues.description IS 'Detailed description of the issue (minimum 10 characters)';
COMMENT ON COLUMN linear_asset_issues.severity IS 'Issue severity: low, medium, high, critical';
COMMENT ON COLUMN linear_asset_issues.resolved_at IS 'Timestamp when issue was resolved (NULL if unresolved)';
