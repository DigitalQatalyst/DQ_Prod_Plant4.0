-- Create performance tables for Operational Excellence Performance feature set
-- Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1

-- ============================================================================
-- 1. PERFORMANCE PANELS TABLE
-- ============================================================================
-- Stores OEE and performance monitoring panels for transmission assets
CREATE TABLE performance_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  grid_node_id UUID REFERENCES grid_nodes(id) ON DELETE SET NULL,
  grid_line_id UUID REFERENCES grid_lines(id) ON DELETE SET NULL,
  
  name TEXT NOT NULL,
  panel_type TEXT NOT NULL CHECK (panel_type IN ('asset', 'site', 'system')),
  
  -- OEE Metrics (Requirements 1.2, 1.5)
  oee_percentage DOUBLE PRECISION DEFAULT 0 CHECK (oee_percentage >= 0 AND oee_percentage <= 100),
  availability_percentage DOUBLE PRECISION DEFAULT 0 CHECK (availability_percentage >= 0 AND availability_percentage <= 100),
  performance_percentage DOUBLE PRECISION DEFAULT 0 CHECK (performance_percentage >= 0 AND performance_percentage <= 100),
  quality_percentage DOUBLE PRECISION DEFAULT 0 CHECK (quality_percentage >= 0 AND quality_percentage <= 100),
  
  -- Transmission-Specific Metrics (Requirements 2.1, 2.2)
  line_loading DOUBLE PRECISION CHECK (line_loading >= 0 AND line_loading <= 100),
  transformer_loading DOUBLE PRECISION CHECK (transformer_loading >= 0 AND transformer_loading <= 100),
  transmission_losses DOUBLE PRECISION CHECK (transmission_losses >= 0),
  saidi DOUBLE PRECISION CHECK (saidi >= 0),
  saifi DOUBLE PRECISION CHECK (saifi >= 0),
  trip_count INTEGER DEFAULT 0 CHECK (trip_count >= 0),
  
  -- Status and Metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Business Logic Constraints
  UNIQUE(tenant_id, name),
  CHECK (
    (panel_type = 'asset' AND (asset_id IS NOT NULL OR grid_node_id IS NOT NULL OR grid_line_id IS NOT NULL)) OR
    (panel_type = 'site' AND site_id IS NOT NULL) OR
    (panel_type = 'system' AND site_id IS NULL AND asset_id IS NULL AND grid_node_id IS NULL AND grid_line_id IS NULL)
  )
);

-- ============================================================================
-- 2. PERFORMANCE LOSSES TABLE
-- ============================================================================
-- Stores transmission loss analysis and categorization (Requirements 3.1, 3.2, 3.3)
CREATE TABLE performance_losses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  grid_node_id UUID REFERENCES grid_nodes(id) ON DELETE SET NULL,
  grid_line_id UUID REFERENCES grid_lines(id) ON DELETE SET NULL,
  
  loss_category TEXT NOT NULL CHECK (loss_category IN ('technical', 'non_technical', 'measurement_error')),
  loss_type TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Loss Metrics (Requirements 3.2, 3.3)
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  frequency_count INTEGER DEFAULT 1 CHECK (frequency_count > 0),
  impact_percentage DOUBLE PRECISION NOT NULL CHECK (impact_percentage >= 0 AND impact_percentage <= 100),
  energy_lost_mwh DOUBLE PRECISION CHECK (energy_lost_mwh >= 0),
  
  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Business Logic Constraints
  CHECK (resolved_at IS NULL OR resolved_at >= occurred_at)
);

-- ============================================================================
-- 3. PERFORMANCE BOTTLENECKS TABLE
-- ============================================================================
-- Stores transmission bottlenecks and constraints (Requirements 4.1, 4.2, 4.3)
CREATE TABLE performance_bottlenecks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  grid_node_id UUID REFERENCES grid_nodes(id) ON DELETE SET NULL,
  grid_line_id UUID REFERENCES grid_lines(id) ON DELETE SET NULL,
  
  constraint_type TEXT NOT NULL CHECK (constraint_type IN ('thermal', 'voltage', 'stability', 'operational')),
  severity TEXT NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  description TEXT NOT NULL,
  
  -- Constraint Metrics (Requirements 4.1, 4.2)
  capacity_limit_mw DOUBLE PRECISION CHECK (capacity_limit_mw > 0),
  current_loading_mw DOUBLE PRECISION CHECK (current_loading_mw >= 0),
  loading_percentage DOUBLE PRECISION CHECK (loading_percentage >= 0 AND loading_percentage <= 200),
  constraint_hours INTEGER DEFAULT 0 CHECK (constraint_hours >= 0),
  
  -- Status and Resolution (Requirements 4.5)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'monitoring')),
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  
  -- Business Logic Constraints
  CHECK (status != 'resolved' OR resolved_at IS NOT NULL),
  CHECK (current_loading_mw IS NULL OR capacity_limit_mw IS NULL OR current_loading_mw <= capacity_limit_mw * 2)
);

-- ============================================================================
-- 4. PERFORMANCE TRENDS TABLE
-- ============================================================================
-- Stores time-series performance trend data (Requirements 6.1, 6.2)
CREATE TABLE performance_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  grid_node_id UUID REFERENCES grid_nodes(id) ON DELETE SET NULL,
  grid_line_id UUID REFERENCES grid_lines(id) ON DELETE SET NULL,
  
  metric_name TEXT NOT NULL,
  metric_value DOUBLE PRECISION NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 5. PERFORMANCE BENCHMARKS TABLE
-- ============================================================================
-- Stores performance benchmarking data (Requirements 7.1, 7.2)
CREATE TABLE performance_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  benchmark_name TEXT NOT NULL,
  benchmark_type TEXT NOT NULL CHECK (benchmark_type IN ('site_comparison', 'asset_comparison', 'historical_comparison')),
  entities JSONB NOT NULL DEFAULT '[]',
  metrics JSONB NOT NULL DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(tenant_id, benchmark_name)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Performance Panels Indexes
CREATE INDEX idx_performance_panels_tenant ON performance_panels(tenant_id);
CREATE INDEX idx_performance_panels_site ON performance_panels(site_id);
CREATE INDEX idx_performance_panels_asset ON performance_panels(asset_id);
CREATE INDEX idx_performance_panels_grid_node ON performance_panels(grid_node_id);
CREATE INDEX idx_performance_panels_grid_line ON performance_panels(grid_line_id);
CREATE INDEX idx_performance_panels_type ON performance_panels(panel_type);
CREATE INDEX idx_performance_panels_status ON performance_panels(status);
CREATE INDEX idx_performance_panels_oee ON performance_panels(oee_percentage);
CREATE INDEX idx_performance_panels_updated ON performance_panels(last_updated);

-- Performance Losses Indexes
CREATE INDEX idx_performance_losses_tenant ON performance_losses(tenant_id);
CREATE INDEX idx_performance_losses_site ON performance_losses(site_id);
CREATE INDEX idx_performance_losses_asset ON performance_losses(asset_id);
CREATE INDEX idx_performance_losses_grid_node ON performance_losses(grid_node_id);
CREATE INDEX idx_performance_losses_grid_line ON performance_losses(grid_line_id);
CREATE INDEX idx_performance_losses_category ON performance_losses(loss_category);
CREATE INDEX idx_performance_losses_occurred ON performance_losses(occurred_at);
CREATE INDEX idx_performance_losses_impact ON performance_losses(impact_percentage);

-- Performance Bottlenecks Indexes
CREATE INDEX idx_performance_bottlenecks_tenant ON performance_bottlenecks(tenant_id);
CREATE INDEX idx_performance_bottlenecks_site ON performance_bottlenecks(site_id);
CREATE INDEX idx_performance_bottlenecks_asset ON performance_bottlenecks(asset_id);
CREATE INDEX idx_performance_bottlenecks_grid_node ON performance_bottlenecks(grid_node_id);
CREATE INDEX idx_performance_bottlenecks_grid_line ON performance_bottlenecks(grid_line_id);
CREATE INDEX idx_performance_bottlenecks_severity ON performance_bottlenecks(severity);
CREATE INDEX idx_performance_bottlenecks_status ON performance_bottlenecks(status);
CREATE INDEX idx_performance_bottlenecks_type ON performance_bottlenecks(constraint_type);

-- Performance Trends Indexes
CREATE INDEX idx_performance_trends_tenant ON performance_trends(tenant_id);
CREATE INDEX idx_performance_trends_site ON performance_trends(site_id);
CREATE INDEX idx_performance_trends_asset ON performance_trends(asset_id);
CREATE INDEX idx_performance_trends_grid_node ON performance_trends(grid_node_id);
CREATE INDEX idx_performance_trends_grid_line ON performance_trends(grid_line_id);
CREATE INDEX idx_performance_trends_metric ON performance_trends(metric_name);
CREATE INDEX idx_performance_trends_timestamp ON performance_trends(timestamp);
CREATE INDEX idx_performance_trends_composite ON performance_trends(tenant_id, metric_name, timestamp);

-- Unique constraint to prevent duplicate metrics (Requirements 6.1)
-- Using NULLS NOT DISTINCT to treat NULL values as equal in the unique constraint
CREATE UNIQUE INDEX idx_performance_trends_unique ON performance_trends(
  tenant_id, 
  metric_name, 
  timestamp, 
  site_id, 
  asset_id, 
  grid_node_id, 
  grid_line_id
) NULLS NOT DISTINCT;

-- Performance Benchmarks Indexes
CREATE INDEX idx_performance_benchmarks_tenant ON performance_benchmarks(tenant_id);
CREATE INDEX idx_performance_benchmarks_type ON performance_benchmarks(benchmark_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all performance tables
ALTER TABLE performance_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_losses ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_bottlenecks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR PERFORMANCE_PANELS
-- ============================================================================
CREATE POLICY "Users can view performance panels for their tenant" ON performance_panels
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert performance panels for their tenant" ON performance_panels
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update performance panels for their tenant" ON performance_panels
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete performance panels for their tenant" ON performance_panels
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================================================
-- RLS POLICIES FOR PERFORMANCE_LOSSES
-- ============================================================================
CREATE POLICY "Users can view performance losses for their tenant" ON performance_losses
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert performance losses for their tenant" ON performance_losses
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update performance losses for their tenant" ON performance_losses
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete performance losses for their tenant" ON performance_losses
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================================================
-- RLS POLICIES FOR PERFORMANCE_BOTTLENECKS
-- ============================================================================
CREATE POLICY "Users can view performance bottlenecks for their tenant" ON performance_bottlenecks
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert performance bottlenecks for their tenant" ON performance_bottlenecks
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update performance bottlenecks for their tenant" ON performance_bottlenecks
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete performance bottlenecks for their tenant" ON performance_bottlenecks
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================================================
-- RLS POLICIES FOR PERFORMANCE_TRENDS
-- ============================================================================
CREATE POLICY "Users can view performance trends for their tenant" ON performance_trends
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert performance trends for their tenant" ON performance_trends
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update performance trends for their tenant" ON performance_trends
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete performance trends for their tenant" ON performance_trends
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================================================
-- RLS POLICIES FOR PERFORMANCE_BENCHMARKS
-- ============================================================================
CREATE POLICY "Users can view performance benchmarks for their tenant" ON performance_benchmarks
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert performance benchmarks for their tenant" ON performance_benchmarks
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update performance benchmarks for their tenant" ON performance_benchmarks
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete performance benchmarks for their tenant" ON performance_benchmarks
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_performance_panels_updated_at 
    BEFORE UPDATE ON performance_panels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_losses_updated_at 
    BEFORE UPDATE ON performance_losses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_bottlenecks_updated_at 
    BEFORE UPDATE ON performance_bottlenecks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_benchmarks_updated_at 
    BEFORE UPDATE ON performance_benchmarks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE performance_panels IS 'OEE and performance monitoring panels for transmission assets';
COMMENT ON TABLE performance_losses IS 'Transmission loss analysis and categorization data';
COMMENT ON TABLE performance_bottlenecks IS 'Transmission bottlenecks and constraint tracking';
COMMENT ON TABLE performance_trends IS 'Time-series performance trend data for analysis';
COMMENT ON TABLE performance_benchmarks IS 'Performance benchmarking and comparative analysis data';

COMMENT ON COLUMN performance_panels.oee_percentage IS 'Overall Equipment Effectiveness calculated as Availability × Performance × Quality';
COMMENT ON COLUMN performance_panels.saidi IS 'System Average Interruption Duration Index (minutes per customer per year)';
COMMENT ON COLUMN performance_panels.saifi IS 'System Average Interruption Frequency Index (interruptions per customer per year)';
COMMENT ON COLUMN performance_losses.impact_percentage IS 'Loss impact as percentage of total system capacity or energy';
COMMENT ON COLUMN performance_bottlenecks.loading_percentage IS 'Current loading as percentage of capacity limit (can exceed 100%)';