-- =============================================================================
-- SUBTASK 14.3: Ensure telemetry_data table exists
-- Requirements: 7.1, 28.4
-- Note: TimescaleDB hypertable conversion skipped for local development
-- =============================================================================

-- Create telemetry_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS telemetry_data (
  timestamp TIMESTAMPTZ NOT NULL,
  asset_id UUID NOT NULL,
  parameter_id UUID NOT NULL REFERENCES telemetry_parameters(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  quality_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index on (asset_id, parameter_id, timestamp DESC) for performance
CREATE INDEX IF NOT EXISTS idx_telemetry_asset_param_time
  ON telemetry_data(asset_id, parameter_id, timestamp DESC);
