-- Migration: Create pa_event_patterns table
-- Feature: Process Automation - Monitor & Detect
-- Requirements: AC 2.6.1-2.6.7
-- Description: Event patterns table for complex event processing and anomaly detection

CREATE TABLE IF NOT EXISTS pa_event_patterns (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Core Fields
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('sequence', 'trend', 'oscillation', 'correlation', 'anomaly')),
  
  -- Pattern Configuration
  match_conditions JSONB NOT NULL, -- Complex event matching logic
  -- Example for sequence: {events: [{type: 'A', within: '5m'}, {type: 'B', within: '10m'}]}
  -- Example for trend: {direction: 'increasing', duration: '1h', threshold: 10}
  -- Example for oscillation: {frequency: '5m', amplitude: 5, duration: '30m'}
  
  time_window INTEGER, -- Time window in seconds for pattern matching
  
  -- Detection Configuration
  detection_threshold NUMERIC(10, 2), -- Threshold for pattern detection (context-dependent)
  confidence_level NUMERIC(5, 2) DEFAULT 0.80 CHECK (confidence_level >= 0 AND confidence_level <= 1),
  
  -- Action Configuration
  action_on_match VARCHAR(50) CHECK (action_on_match IN ('alert', 'trigger', 'log', 'none')),
  trigger_id UUID, -- Optional reference to pa_triggers
  
  -- Status
  enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- Statistics (updated by detection engine)
  match_count INTEGER DEFAULT 0,
  last_match_at TIMESTAMPTZ,
  false_positive_count INTEGER DEFAULT 0,
  
  -- Metadata
  tags JSONB DEFAULT '[]',
  custom_properties JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by VARCHAR(255),
  
  -- Constraints
  CONSTRAINT unique_event_pattern_name_per_tenant UNIQUE (tenant_id, name),
  CONSTRAINT check_time_window_positive CHECK (time_window IS NULL OR time_window > 0)
);

-- Indexes for performance
CREATE INDEX idx_pa_event_patterns_tenant_id ON pa_event_patterns(tenant_id);
CREATE INDEX idx_pa_event_patterns_pattern_type ON pa_event_patterns(pattern_type);
CREATE INDEX idx_pa_event_patterns_enabled ON pa_event_patterns(enabled);
CREATE INDEX idx_pa_event_patterns_trigger_id ON pa_event_patterns(trigger_id);
CREATE INDEX idx_pa_event_patterns_tags ON pa_event_patterns USING GIN(tags);
CREATE INDEX idx_pa_event_patterns_match_conditions ON pa_event_patterns USING GIN(match_conditions);
CREATE INDEX idx_pa_event_patterns_last_match_at ON pa_event_patterns(last_match_at DESC NULLS LAST);
CREATE INDEX idx_pa_event_patterns_created_at ON pa_event_patterns(created_at DESC);

-- Comments
COMMENT ON TABLE pa_event_patterns IS 'Process Automation event patterns for complex event processing';
COMMENT ON COLUMN pa_event_patterns.id IS 'Unique identifier for the event pattern';
COMMENT ON COLUMN pa_event_patterns.tenant_id IS 'Reference to the tenant that owns this event pattern';
COMMENT ON COLUMN pa_event_patterns.name IS 'Human-readable name for the event pattern';
COMMENT ON COLUMN pa_event_patterns.description IS 'Detailed description of the event pattern';
COMMENT ON COLUMN pa_event_patterns.pattern_type IS 'Type of pattern: sequence, trend, oscillation, correlation, or anomaly';
COMMENT ON COLUMN pa_event_patterns.match_conditions IS 'JSONB configuration defining pattern matching logic';
COMMENT ON COLUMN pa_event_patterns.time_window IS 'Time window in seconds for pattern matching';
COMMENT ON COLUMN pa_event_patterns.detection_threshold IS 'Threshold value for pattern detection';
COMMENT ON COLUMN pa_event_patterns.confidence_level IS 'Required confidence level for pattern match (0-1)';
COMMENT ON COLUMN pa_event_patterns.action_on_match IS 'Action to take when pattern matches: alert, trigger, log, or none';
COMMENT ON COLUMN pa_event_patterns.trigger_id IS 'Optional reference to trigger to execute on match';
COMMENT ON COLUMN pa_event_patterns.enabled IS 'Whether the event pattern is currently active';
COMMENT ON COLUMN pa_event_patterns.match_count IS 'Number of times this pattern has matched';
COMMENT ON COLUMN pa_event_patterns.last_match_at IS 'Timestamp of most recent pattern match';
COMMENT ON COLUMN pa_event_patterns.false_positive_count IS 'Number of false positive detections';
COMMENT ON COLUMN pa_event_patterns.tags IS 'Array of tags for categorization and filtering';
COMMENT ON COLUMN pa_event_patterns.custom_properties IS 'Additional metadata as key-value pairs';

-- NO RLS POLICIES (local development only)
-- All tables unrestricted for local development
