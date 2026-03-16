-- ============================================================================
-- APM Transmission FS2: Predictive & Prescriptive Maintenance - Migration
-- ============================================================================
-- Feature Set: FS2 - Predictive & Prescriptive Maintenance
-- Requirements: 16.1-16.7, 17.1-17.7, 18.1-18.8, 19.1-19.7
--
-- This migration creates the schema for:
-- - Failure predictions and RUL estimation
-- - Condition-Based Maintenance (CBM) triggers
-- - Maintenance recommendations
-- - Risk scoring models
--
-- Dependencies:
-- - FS4: Asset Inventory & Criticality (assets, fmea_entries, spare_parts)
-- - FS1: Asset Health & Diagnostics (telemetry_parameters, health_scores)
-- - FS3: Asset Performance & Utilisation (downtime_events, reliability_metrics)
--
-- Idempotency: This script can be run multiple times safely
-- ============================================================================

-- =============================================================================
-- SUBTASK 34.1: Create failure_predictions table
-- Requirements: 16.1-16.7
-- =============================================================================

CREATE TABLE IF NOT EXISTS failure_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  prediction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  failure_probability NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  time_horizon_days INTEGER NOT NULL,
  risk_level TEXT NOT NULL,
  rul_days INTEGER,
  contributing_factors TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add check constraints (idempotent)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_failure_probability_bounds'
  ) THEN
    ALTER TABLE failure_predictions
      ADD CONSTRAINT chk_failure_probability_bounds
      CHECK (failure_probability >= 0 AND failure_probability <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_prediction_confidence_bounds'
  ) THEN
    ALTER TABLE failure_predictions
      ADD CONSTRAINT chk_prediction_confidence_bounds
      CHECK (confidence >= 0 AND confidence <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_time_horizon_values'
  ) THEN
    ALTER TABLE failure_predictions
      ADD CONSTRAINT chk_time_horizon_values
      CHECK (time_horizon_days IN (7, 30, 90));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_risk_level_values'
  ) THEN
    ALTER TABLE failure_predictions
      ADD CONSTRAINT chk_risk_level_values
      CHECK (risk_level IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_failure_predictions_asset
  ON failure_predictions(asset_id, prediction_date DESC);

CREATE INDEX IF NOT EXISTS idx_failure_predictions_risk
  ON failure_predictions(risk_level, prediction_date DESC);

-- =============================================================================
-- SUBTASK 34.2: Create cbm_triggers table
-- Requirements: 17.1-17.7
-- =============================================================================

CREATE TABLE IF NOT EXISTS cbm_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parameter_id UUID NOT NULL REFERENCES telemetry_parameters(id) ON DELETE CASCADE,
  condition_operator TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL,
  recommended_action TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add check constraint for condition_operator values (idempotent)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_cbm_condition_operator'
  ) THEN
    ALTER TABLE cbm_triggers
      ADD CONSTRAINT chk_cbm_condition_operator
      CHECK (condition_operator IN ('greater_than', 'less_than', 'equals', 'rate_of_change_exceeds'));
  END IF;
END $;

-- Create index on parameter_id for active triggers
CREATE INDEX IF NOT EXISTS idx_cbm_triggers_parameter_active
  ON cbm_triggers(parameter_id) WHERE is_active = true;

-- =============================================================================
-- SUBTASK 34.3: Create maintenance_recommendations table
-- Requirements: 18.1-18.8
-- =============================================================================

CREATE TABLE IF NOT EXISTS maintenance_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  description TEXT NOT NULL,
  priority_score NUMERIC NOT NULL,
  due_date DATE,
  required_spares UUID[],
  source_trigger_id UUID,
  status TEXT NOT NULL DEFAULT 'open',
  completion_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add check constraints (idempotent)
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_recommendation_type'
  ) THEN
    ALTER TABLE maintenance_recommendations
      ADD CONSTRAINT chk_recommendation_type
      CHECK (recommendation_type IN ('inspection', 'repair', 'replacement', 'calibration', 'cleaning'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_recommendation_status'
  ) THEN
    ALTER TABLE maintenance_recommendations
      ADD CONSTRAINT chk_recommendation_status
      CHECK (status IN ('open', 'scheduled', 'completed', 'cancelled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_priority_score_bounds'
  ) THEN
    ALTER TABLE maintenance_recommendations
      ADD CONSTRAINT chk_priority_score_bounds
      CHECK (priority_score >= 0 AND priority_score <= 100);
  END IF;
END $;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_recs_asset_priority
  ON maintenance_recommendations(asset_id, priority_score DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_recs_status_due
  ON maintenance_recommendations(status, due_date);

-- =============================================================================
-- SUBTASK 34.4: Create risk_scoring_model table
-- Requirements: 19.1, 19.2
-- =============================================================================

CREATE TABLE IF NOT EXISTS risk_scoring_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector TEXT NOT NULL,
  criticality_weight NUMERIC NOT NULL,
  health_weight NUMERIC NOT NULL,
  failure_probability_weight NUMERIC NOT NULL,
  performance_deviation_weight NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_risk_scoring_sector UNIQUE(sector)
);

-- =============================================================================
-- Migration Complete
-- =============================================================================
