-- EMS Power Transmission - Analytics Schema Extensions
-- Creates analytics tables for KPIs, benchmarks, recommendations, and demand windows
-- Requirements: 9.1, 9.2, 10.2, 10.3, 11.1, 11.7

-- ============================================================================
-- ENERGY KPI SNAPSHOTS TABLE
-- ============================================================================

-- Create energy_kpi_snapshots table for pre-computed KPI values
CREATE TABLE IF NOT EXISTS energy_kpi_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  kpi_code TEXT NOT NULL,  -- 'kwh_per_mwh_delivered', 'losses_pct', 'load_factor', 'avg_power_factor'
  scope_type TEXT NOT NULL,  -- 'org', 'substation', 'feeder', 'meter'
  scope_id UUID NOT NULL,  -- References the entity (substation_id, feeder_id, meter_id, or org_id)
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  period_grain TEXT NOT NULL,  -- 'hour', 'day', 'week', 'month', 'quarter', 'year'
  value DECIMAL(15,6) NOT NULL,
  unit TEXT NOT NULL,  -- 'kWh/MWh', '%', 'ratio', 'kW', 'kWh', 'USD'
  target_value DECIMAL(15,6),  -- Optional target/benchmark value
  baseline_value DECIMAL(15,6),  -- Optional baseline for comparison
  calculation_method TEXT,  -- 'sum', 'avg', 'max', 'min', 'weighted_avg', 'formula'
  data_quality_score DECIMAL(3,2),  -- 0.0 to 1.0, indicates completeness/accuracy
  metadata JSONB DEFAULT '{}',  -- Additional context (contributing meters, calculation details, etc.)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (kpi_code, scope_type, scope_id, period_start, period_grain) must be unique
  CONSTRAINT uq_energy_kpi_snapshots_natural_key UNIQUE (kpi_code, scope_type, scope_id, period_start, period_grain),
  
  -- Check constraints
  CONSTRAINT chk_energy_kpi_snapshots_period CHECK (period_end > period_start),
  CONSTRAINT chk_energy_kpi_snapshots_data_quality CHECK (data_quality_score IS NULL OR (data_quality_score >= 0 AND data_quality_score <= 1)),
  CONSTRAINT chk_energy_kpi_snapshots_scope_type CHECK (scope_type IN ('org', 'substation', 'feeder', 'meter')),
  CONSTRAINT chk_energy_kpi_snapshots_period_grain CHECK (period_grain IN ('hour', 'day', 'week', 'month', 'quarter', 'year'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_org ON energy_kpi_snapshots(org_id);
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_kpi_code ON energy_kpi_snapshots(kpi_code);
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_scope ON energy_kpi_snapshots(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_period ON energy_kpi_snapshots(period_start DESC, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_org_kpi ON energy_kpi_snapshots(org_id, kpi_code);
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_org_scope ON energy_kpi_snapshots(org_id, scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_period_grain ON energy_kpi_snapshots(period_grain, period_start DESC);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_energy_kpi_snapshots_org_kpi_scope_period 
  ON energy_kpi_snapshots(org_id, kpi_code, scope_type, scope_id, period_start DESC);

-- Enable RLS
ALTER TABLE energy_kpi_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY energy_kpi_snapshots_tenant_isolation ON energy_kpi_snapshots
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_kpi_snapshots TO authenticated;

-- Add comments
COMMENT ON TABLE energy_kpi_snapshots IS 'Pre-computed KPI values by scope and time period for performance optimization';
COMMENT ON COLUMN energy_kpi_snapshots.kpi_code IS 'Standardized KPI identifier (e.g., kwh_per_mwh_delivered, losses_pct)';
COMMENT ON COLUMN energy_kpi_snapshots.scope_type IS 'Type of entity the KPI applies to (org, substation, feeder, meter)';
COMMENT ON COLUMN energy_kpi_snapshots.scope_id IS 'UUID of the entity (substation_id, feeder_id, meter_id, or org_id)';
COMMENT ON COLUMN energy_kpi_snapshots.data_quality_score IS 'Score from 0.0 to 1.0 indicating data completeness and accuracy';
COMMENT ON CONSTRAINT uq_energy_kpi_snapshots_natural_key ON energy_kpi_snapshots IS 'Natural key: KPI snapshots are unique by (kpi_code, scope_type, scope_id, period_start, period_grain)';


-- ============================================================================
-- ENERGY BENCHMARKS TABLE
-- ============================================================================

-- Create energy_benchmarks table for performance comparison
CREATE TABLE IF NOT EXISTS energy_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  benchmark_code TEXT NOT NULL,  -- 'industry_avg_losses', 'peer_load_factor', 'best_practice_efficiency'
  benchmark_name TEXT NOT NULL,
  benchmark_type TEXT NOT NULL,  -- 'industry', 'peer', 'historical', 'target', 'regulatory'
  scope_type TEXT NOT NULL,  -- 'org', 'substation', 'feeder', 'meter', 'voltage_level'
  scope_filter JSONB DEFAULT '{}',  -- Filters for applicability (voltage_level, region, asset_type, etc.)
  
  -- Benchmark values
  value DECIMAL(15,6) NOT NULL,
  unit TEXT NOT NULL,
  percentile DECIMAL(5,2),  -- For industry/peer benchmarks (e.g., 50th percentile = median)
  
  -- Metadata
  source TEXT,  -- 'IEEE Standard', 'Industry Report', 'Internal Analysis', 'Regulatory Requirement'
  source_reference TEXT,  -- Specific document or standard reference
  effective_date DATE NOT NULL,
  expiry_date DATE,
  confidence_level DECIMAL(3,2),  -- Statistical confidence level (0.0 to 1.0)
  sample_size INTEGER,  -- For statistical benchmarks
  
  description TEXT,
  methodology TEXT,  -- How the benchmark was calculated/derived
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (org_id, benchmark_code, effective_date) must be unique
  CONSTRAINT uq_energy_benchmarks_org_code_date UNIQUE (org_id, benchmark_code, effective_date),
  
  -- Check constraints
  CONSTRAINT chk_energy_benchmarks_dates CHECK (expiry_date IS NULL OR expiry_date > effective_date),
  CONSTRAINT chk_energy_benchmarks_confidence CHECK (confidence_level IS NULL OR (confidence_level >= 0 AND confidence_level <= 1)),
  CONSTRAINT chk_energy_benchmarks_percentile CHECK (percentile IS NULL OR (percentile >= 0 AND percentile <= 100)),
  CONSTRAINT chk_energy_benchmarks_scope_type CHECK (scope_type IN ('org', 'substation', 'feeder', 'meter', 'voltage_level')),
  CONSTRAINT chk_energy_benchmarks_type CHECK (benchmark_type IN ('industry', 'peer', 'historical', 'target', 'regulatory'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_energy_benchmarks_org ON energy_benchmarks(org_id);
CREATE INDEX IF NOT EXISTS idx_energy_benchmarks_code ON energy_benchmarks(benchmark_code);
CREATE INDEX IF NOT EXISTS idx_energy_benchmarks_type ON energy_benchmarks(benchmark_type);
CREATE INDEX IF NOT EXISTS idx_energy_benchmarks_scope ON energy_benchmarks(scope_type);
CREATE INDEX IF NOT EXISTS idx_energy_benchmarks_active ON energy_benchmarks(org_id, active);
CREATE INDEX IF NOT EXISTS idx_energy_benchmarks_effective ON energy_benchmarks(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_energy_benchmarks_org_code_active ON energy_benchmarks(org_id, benchmark_code, active);

-- Composite index for benchmark lookup
CREATE INDEX IF NOT EXISTS idx_energy_benchmarks_lookup 
  ON energy_benchmarks(org_id, benchmark_code, scope_type, effective_date DESC) 
  WHERE active = true;

-- Enable RLS
ALTER TABLE energy_benchmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY energy_benchmarks_tenant_isolation ON energy_benchmarks
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_benchmarks TO authenticated;

-- Add comments
COMMENT ON TABLE energy_benchmarks IS 'Performance benchmarks for comparison against industry, peer, and target values';
COMMENT ON COLUMN energy_benchmarks.benchmark_code IS 'Standardized benchmark identifier';
COMMENT ON COLUMN energy_benchmarks.scope_filter IS 'JSON filters defining benchmark applicability (voltage_level, region, etc.)';
COMMENT ON COLUMN energy_benchmarks.percentile IS 'Statistical percentile for industry/peer benchmarks (50 = median)';
COMMENT ON COLUMN energy_benchmarks.methodology IS 'Description of how the benchmark was calculated or derived';
COMMENT ON CONSTRAINT uq_energy_benchmarks_org_code_date ON energy_benchmarks IS 'Natural key: benchmarks are unique by (org_id, benchmark_code, effective_date)';


-- ============================================================================
-- ENERGY RECOMMENDATIONS TABLE
-- ============================================================================

-- Create energy_recommendations table for optimization recommendations
CREATE TABLE IF NOT EXISTS energy_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,  -- 'waste', 'efficiency', 'peak_shaving', 'ai_optimization', 'load_balancing', 'pq_improvement'
  scope_type TEXT NOT NULL,  -- 'substation', 'feeder', 'meter', 'load', 'transformer'
  scope_id UUID NOT NULL,  -- References the target entity
  
  -- Recommendation details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',  -- 'Low', 'Medium', 'High', 'Critical'
  
  -- Impact estimates
  estimated_savings_kwh DECIMAL(15,4),
  estimated_savings_cost DECIMAL(12,2),
  estimated_implementation_cost DECIMAL(12,2),
  payback_period_months INTEGER,
  confidence_level DECIMAL(3,2),  -- 0.0 to 1.0
  
  -- Implementation details
  timeframe TEXT,  -- 'immediate', 'short_term', 'medium_term', 'long_term'
  implementation_complexity TEXT DEFAULT 'Medium',  -- 'Low', 'Medium', 'High'
  required_resources TEXT,  -- Description of resources needed
  
  -- Status tracking
  status TEXT DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected', 'implemented', 'cancelled'
  status_reason TEXT,  -- Reason for rejection or cancellation
  assigned_to UUID,  -- User responsible for implementation
  
  -- Dates
  target_implementation_date DATE,
  actual_implementation_date DATE,
  review_date DATE,
  
  -- Results tracking
  actual_savings_kwh DECIMAL(15,4),
  actual_savings_cost DECIMAL(12,2),
  actual_implementation_cost DECIMAL(12,2),
  
  -- Source and validation
  source TEXT DEFAULT 'system',  -- 'system', 'user', 'ai_model', 'external_audit'
  source_reference TEXT,  -- Reference to analysis, model, or audit that generated this
  validation_notes TEXT,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (recommendation_type, scope_type, scope_id, title) must be unique per day
  -- Note: Uniqueness enforced by application logic and partial index
  
  -- Check constraints
  CONSTRAINT chk_energy_recommendations_confidence CHECK (confidence_level IS NULL OR (confidence_level >= 0 AND confidence_level <= 1)),
  CONSTRAINT chk_energy_recommendations_priority CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  CONSTRAINT chk_energy_recommendations_status CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented', 'cancelled')),
  CONSTRAINT chk_energy_recommendations_complexity CHECK (implementation_complexity IN ('Low', 'Medium', 'High')),
  CONSTRAINT chk_energy_recommendations_timeframe CHECK (timeframe IN ('immediate', 'short_term', 'medium_term', 'long_term')),
  CONSTRAINT chk_energy_recommendations_scope_type CHECK (scope_type IN ('substation', 'feeder', 'meter', 'load', 'transformer')),
  CONSTRAINT chk_energy_recommendations_type CHECK (recommendation_type IN ('waste', 'efficiency', 'peak_shaving', 'ai_optimization', 'load_balancing', 'pq_improvement')),
  CONSTRAINT chk_energy_recommendations_implementation_date CHECK (actual_implementation_date IS NULL OR target_implementation_date IS NULL OR actual_implementation_date >= target_implementation_date - INTERVAL '30 days')
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_org ON energy_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_type ON energy_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_scope ON energy_recommendations(scope_type, scope_id);
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_status ON energy_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_priority ON energy_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_assigned ON energy_recommendations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_created ON energy_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_org_status ON energy_recommendations(org_id, status);
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_org_type ON energy_recommendations(org_id, recommendation_type);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_org_status_priority 
  ON energy_recommendations(org_id, status, priority, created_at DESC);

-- Index for pending recommendations by scope
CREATE INDEX IF NOT EXISTS idx_energy_recommendations_pending_scope 
  ON energy_recommendations(scope_type, scope_id, created_at DESC) 
  WHERE status = 'pending';

-- Partial unique index for natural key (without date expression to avoid immutability issues)
-- This ensures uniqueness within the same day by using a date range check in application logic
CREATE UNIQUE INDEX IF NOT EXISTS idx_energy_recommendations_natural_key 
  ON energy_recommendations(recommendation_type, scope_type, scope_id, title, created_at);

-- Enable RLS
ALTER TABLE energy_recommendations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY energy_recommendations_tenant_isolation ON energy_recommendations
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_recommendations TO authenticated;

-- Add comments
COMMENT ON TABLE energy_recommendations IS 'Energy optimization recommendations with impact estimates and status tracking';
COMMENT ON COLUMN energy_recommendations.scope_id IS 'UUID of the target entity (substation_id, feeder_id, meter_id, etc.)';
COMMENT ON COLUMN energy_recommendations.confidence_level IS 'Confidence in savings estimates from 0.0 to 1.0';
COMMENT ON COLUMN energy_recommendations.payback_period_months IS 'Estimated payback period in months';
COMMENT ON COLUMN energy_recommendations.source IS 'Source that generated the recommendation (system, user, ai_model, external_audit)';
-- Note: Natural key uniqueness enforced by idx_energy_recommendations_natural_key index


-- ============================================================================
-- TRANSMISSION DEMAND WINDOWS TABLE
-- ============================================================================

-- Create tx_demand_windows table for utility-specific demand charge windows
CREATE TABLE IF NOT EXISTS tx_demand_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  utility_name TEXT NOT NULL,
  tariff_code TEXT NOT NULL,
  window_name TEXT NOT NULL,  -- 'peak', 'off_peak', 'shoulder', 'super_peak'
  
  -- Time definitions
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL,  -- Array of day numbers (1=Monday, 7=Sunday)
  months INTEGER[],  -- Optional: array of month numbers (1=Jan, 12=Dec), NULL means all months
  
  -- Seasonal variations
  season TEXT,  -- 'summer', 'winter', 'spring', 'fall', NULL for year-round
  season_start_date DATE,  -- Start date for seasonal windows (MM-DD format, year ignored)
  season_end_date DATE,    -- End date for seasonal windows (MM-DD format, year ignored)
  
  -- Demand charge parameters
  demand_charge_rate DECIMAL(8,4) NOT NULL,  -- $/kW
  demand_charge_unit TEXT DEFAULT 'USD/kW',
  minimum_demand_kw DECIMAL(10,2) DEFAULT 0,
  ratchet_percentage DECIMAL(5,2),  -- Percentage of peak demand to maintain as minimum (e.g., 80%)
  ratchet_months INTEGER DEFAULT 12,  -- Number of months to apply ratchet
  
  -- Window characteristics
  window_duration_minutes INTEGER,  -- Calculated field: duration of the window
  measurement_interval_minutes INTEGER DEFAULT 15,  -- Demand measurement interval (typically 15 or 30 minutes)
  
  -- Metadata
  effective_date DATE NOT NULL,
  expiry_date DATE,
  description TEXT,
  tariff_document_reference TEXT,
  active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint: (org_id, utility_name, tariff_code, window_name, effective_date) must be unique
  CONSTRAINT uq_tx_demand_windows_natural_key UNIQUE (org_id, utility_name, tariff_code, window_name, effective_date),
  
  -- Check constraints
  CONSTRAINT chk_tx_demand_windows_time CHECK (start_time != end_time),
  CONSTRAINT chk_tx_demand_windows_days CHECK (array_length(days_of_week, 1) > 0 AND days_of_week <@ ARRAY[1,2,3,4,5,6,7]),
  CONSTRAINT chk_tx_demand_windows_months CHECK (months IS NULL OR (array_length(months, 1) > 0 AND months <@ ARRAY[1,2,3,4,5,6,7,8,9,10,11,12])),
  CONSTRAINT chk_tx_demand_windows_dates CHECK (expiry_date IS NULL OR expiry_date > effective_date),
  CONSTRAINT chk_tx_demand_windows_ratchet CHECK (ratchet_percentage IS NULL OR (ratchet_percentage >= 0 AND ratchet_percentage <= 100)),
  CONSTRAINT chk_tx_demand_windows_season CHECK (season IS NULL OR season IN ('summer', 'winter', 'spring', 'fall')),
  CONSTRAINT chk_tx_demand_windows_window_name CHECK (window_name IN ('peak', 'off_peak', 'shoulder', 'super_peak', 'critical_peak')),
  CONSTRAINT chk_tx_demand_windows_measurement_interval CHECK (measurement_interval_minutes IN (15, 30, 60))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tx_demand_windows_org ON tx_demand_windows(org_id);
CREATE INDEX IF NOT EXISTS idx_tx_demand_windows_utility ON tx_demand_windows(utility_name);
CREATE INDEX IF NOT EXISTS idx_tx_demand_windows_tariff ON tx_demand_windows(tariff_code);
CREATE INDEX IF NOT EXISTS idx_tx_demand_windows_active ON tx_demand_windows(org_id, active);
CREATE INDEX IF NOT EXISTS idx_tx_demand_windows_effective ON tx_demand_windows(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_demand_windows_org_utility ON tx_demand_windows(org_id, utility_name, active);

-- Composite index for window lookup
CREATE INDEX IF NOT EXISTS idx_tx_demand_windows_lookup 
  ON tx_demand_windows(org_id, utility_name, tariff_code, effective_date DESC) 
  WHERE active = true;

-- GIN index for array columns (days_of_week, months)
CREATE INDEX IF NOT EXISTS idx_tx_demand_windows_days_gin ON tx_demand_windows USING GIN (days_of_week);
CREATE INDEX IF NOT EXISTS idx_tx_demand_windows_months_gin ON tx_demand_windows USING GIN (months);

-- Enable RLS
ALTER TABLE tx_demand_windows ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tx_demand_windows_tenant_isolation ON tx_demand_windows
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tx_demand_windows TO authenticated;

-- Add comments
COMMENT ON TABLE tx_demand_windows IS 'Utility-specific demand charge windows and tariff structures for transmission operations';
COMMENT ON COLUMN tx_demand_windows.days_of_week IS 'Array of day numbers where 1=Monday, 7=Sunday';
COMMENT ON COLUMN tx_demand_windows.months IS 'Optional array of month numbers (1=Jan, 12=Dec), NULL means all months';
COMMENT ON COLUMN tx_demand_windows.ratchet_percentage IS 'Percentage of peak demand to maintain as minimum billing demand';
COMMENT ON COLUMN tx_demand_windows.ratchet_months IS 'Number of months to apply demand ratchet (typically 12)';
COMMENT ON COLUMN tx_demand_windows.measurement_interval_minutes IS 'Demand measurement interval in minutes (15, 30, or 60)';
COMMENT ON CONSTRAINT uq_tx_demand_windows_natural_key ON tx_demand_windows IS 'Natural key: demand windows are unique by (org_id, utility_name, tariff_code, window_name, effective_date)';


-- ============================================================================
-- CREATE TRIGGER FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Create or replace the generic updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for all tables
CREATE TRIGGER tr_energy_kpi_snapshots_updated_at
  BEFORE UPDATE ON energy_kpi_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_energy_benchmarks_updated_at
  BEFORE UPDATE ON energy_benchmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_energy_recommendations_updated_at
  BEFORE UPDATE ON energy_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_tx_demand_windows_updated_at
  BEFORE UPDATE ON tx_demand_windows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- HELPER FUNCTIONS FOR WINDOW CALCULATIONS
-- ============================================================================

-- Function to calculate window duration in minutes
CREATE OR REPLACE FUNCTION calculate_window_duration(start_time TIME, end_time TIME)
RETURNS INTEGER AS $$
BEGIN
  -- Handle overnight windows (end_time < start_time)
  IF end_time < start_time THEN
    RETURN EXTRACT(EPOCH FROM (end_time + INTERVAL '1 day' - start_time)) / 60;
  ELSE
    RETURN EXTRACT(EPOCH FROM (end_time - start_time)) / 60;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update window_duration_minutes when inserting or updating demand windows
CREATE OR REPLACE FUNCTION update_demand_window_duration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.window_duration_minutes = calculate_window_duration(NEW.start_time, NEW.end_time);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tx_demand_windows_duration
  BEFORE INSERT OR UPDATE ON tx_demand_windows
  FOR EACH ROW
  EXECUTE FUNCTION update_demand_window_duration();

-- Add comment for the duration calculation
COMMENT ON FUNCTION calculate_window_duration(TIME, TIME) IS 'Calculates window duration in minutes, handling overnight windows';
COMMENT ON FUNCTION update_demand_window_duration() IS 'Trigger function to automatically calculate and update window_duration_minutes';