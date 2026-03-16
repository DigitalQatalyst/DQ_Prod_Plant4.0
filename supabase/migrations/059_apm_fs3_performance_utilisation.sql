-- ============================================================================
-- FS3: Asset Performance & Utilisation - Migration Script
-- ============================================================================
-- This migration script creates the schema for tracking asset performance,
-- downtime events, reliability metrics, utilisation metrics, and performance
-- benchmarking for transmission assets.
--
-- Requirements: 12.1-12.9, 13.1-13.7, 14.1-14.7, 15.1-15.7
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 24.1: Extend downtime_events table
-- ============================================================================
-- Add transmission-specific fields to downtime_events table
-- Requirements: 12.3, 12.4, 12.5, 12.6

DO $$
BEGIN
  -- Add grid_impact_mw column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'downtime_events' AND column_name = 'grid_impact_mw'
  ) THEN
    ALTER TABLE downtime_events ADD COLUMN grid_impact_mw NUMERIC;
  END IF;

  -- Add protection_trip_code column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'downtime_events' AND column_name = 'protection_trip_code'
  ) THEN
    ALTER TABLE downtime_events ADD COLUMN protection_trip_code TEXT;
  END IF;

  -- Add outage_scope column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'downtime_events' AND column_name = 'outage_scope'
  ) THEN
    ALTER TABLE downtime_events ADD COLUMN outage_scope TEXT;
  END IF;
END $$;

-- Add check constraint for outage_scope values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_outage_scope'
  ) THEN
    ALTER TABLE downtime_events
      ADD CONSTRAINT chk_outage_scope
      CHECK (outage_scope IN ('bay', 'line', 'transformer', 'substation'));
  END IF;
END $$;

-- Add check constraint for duration consistency
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_downtime_duration'
  ) THEN
    ALTER TABLE downtime_events
      ADD CONSTRAINT chk_downtime_duration
      CHECK (
        (end_time IS NULL AND duration_minutes IS NULL) OR
        (end_time IS NOT NULL AND start_time < end_time)
      );
  END IF;
END $$;

-- Create indexes for downtime queries
CREATE INDEX IF NOT EXISTS idx_downtime_events_asset_start
  ON downtime_events(asset_id, start_time DESC);

CREATE INDEX IF NOT EXISTS idx_downtime_events_type_start
  ON downtime_events(event_type, start_time DESC);

-- ============================================================================
-- 24.2: Create reliability_metrics table
-- ============================================================================
-- Store computed reliability statistics (MTBF, MTTR, Availability)
-- Requirements: 13.1-13.7

CREATE TABLE IF NOT EXISTS reliability_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  mtbf_hours NUMERIC,
  mttr_hours NUMERIC,
  availability_percent NUMERIC NOT NULL,
  failure_count INTEGER NOT NULL DEFAULT 0,
  total_downtime_minutes INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset_id, period_start, period_end),
  CHECK (period_start < period_end),
  CHECK (availability_percent >= 0 AND availability_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_reliability_metrics_asset_period
  ON reliability_metrics(asset_id, period_start DESC);

-- ============================================================================
-- 24.3: Create utilisation_metrics table
-- ============================================================================
-- Store asset utilisation and loading metrics
-- Requirements: 14.1-14.7

CREATE TABLE IF NOT EXISTS utilisation_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  load_factor NUMERIC,
  peak_current NUMERIC,
  thermal_headroom NUMERIC,
  switching_cycles INTEGER,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (period_start < period_end),
  CHECK (load_factor >= 0 AND load_factor <= 100),
  CHECK (thermal_headroom >= 0 AND thermal_headroom <= 100)
);

CREATE INDEX IF NOT EXISTS idx_utilisation_metrics_asset_period
  ON utilisation_metrics(asset_id, period_start DESC);

-- ============================================================================
-- 24.4: Create performance_deviations table
-- ============================================================================
-- Track significant deviations from performance benchmarks
-- Requirements: 15.4, 15.5

CREATE TABLE IF NOT EXISTS performance_deviations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  deviation_type TEXT NOT NULL,
  magnitude NUMERIC NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  telemetry_window_start TIMESTAMPTZ,
  telemetry_window_end TIMESTAMPTZ,
  benchmark_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_deviations_asset
  ON performance_deviations(asset_id, detected_at DESC);

-- ============================================================================
-- 24.5: Create performance_benchmarks table
-- ============================================================================
-- Store target performance values by asset type and sector
-- Requirements: 15.1, 15.2

CREATE TABLE IF NOT EXISTS performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_type TEXT NOT NULL,
  sector TEXT NOT NULL DEFAULT 'power_transmission',
  availability_target NUMERIC,
  load_factor_target NUMERIC,
  mtbf_target NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(asset_type, sector),
  CHECK (availability_target >= 0 AND availability_target <= 100),
  CHECK (load_factor_target >= 0 AND load_factor_target <= 100)
);

-- ============================================================================
-- Migration Complete
-- ============================================================================
