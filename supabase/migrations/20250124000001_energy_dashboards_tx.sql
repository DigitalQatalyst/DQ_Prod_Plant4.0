-- EMS Power Transmission - Dashboards and Reporting Schema Extensions
-- Creates dashboard, tariff, and export tables for transmission-specific reporting
-- Requirements: 23.1, 24.1, 25.1, 26.1

-- ============================================================================
-- DASHBOARD DEFINITIONS TABLE
-- ============================================================================

-- Create dashboard_definitions table for custom dashboards
CREATE TABLE IF NOT EXISTS dashboard_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  dashboard_code TEXT NOT NULL,  -- Natural key
  name TEXT NOT NULL,
  description TEXT,
  
  -- Dashboard type
  dashboard_type TEXT NOT NULL,  -- 'system', 'custom', 'template'
  category TEXT,  -- 'energy', 'transmission', 'sustainability', 'operations', 'compliance'
  
  -- Configuration
  config JSONB NOT NULL DEFAULT '{}',  -- Dashboard configuration including widgets, layout, filters
  version INTEGER DEFAULT 1,
  
  -- Access control
  owner_id UUID,  -- User who created the dashboard
  public_dashboard BOOLEAN DEFAULT false,  -- Available to all users in org
  shared_with UUID[],  -- Array of user IDs with access
  
  -- Status
  active BOOLEAN DEFAULT true,
  published BOOLEAN DEFAULT false,
  superseded_by UUID REFERENCES dashboard_definitions(id) ON DELETE SET NULL,
  
  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_dashboard_definitions_org_code UNIQUE (org_id, dashboard_code),
  
  -- Check constraints
  CONSTRAINT chk_dashboard_definitions_version CHECK (version > 0),
  CONSTRAINT chk_dashboard_definitions_view_count CHECK (view_count >= 0),
  CONSTRAINT chk_dashboard_definitions_type CHECK (dashboard_type IN ('system', 'custom', 'template')),
  CONSTRAINT chk_dashboard_definitions_category CHECK (category IN ('energy', 'transmission', 'sustainability', 'operations', 'compliance', 'financial', 'technical'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_org ON dashboard_definitions(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_type ON dashboard_definitions(dashboard_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_category ON dashboard_definitions(category);
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_owner ON dashboard_definitions(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_active ON dashboard_definitions(org_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_published ON dashboard_definitions(org_id, published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_public ON dashboard_definitions(org_id) WHERE public_dashboard = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_last_viewed ON dashboard_definitions(last_viewed_at DESC) WHERE last_viewed_at IS NOT NULL;

-- GIN index for shared_with array
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_shared_gin ON dashboard_definitions USING GIN (shared_with);

-- GIN index for config JSONB
CREATE INDEX IF NOT EXISTS idx_dashboard_definitions_config_gin ON dashboard_definitions USING GIN (config);

-- Enable RLS
ALTER TABLE dashboard_definitions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY dashboard_definitions_tenant_isolation ON dashboard_definitions
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_definitions TO authenticated;

-- Add comments
COMMENT ON TABLE dashboard_definitions IS 'Custom dashboard definitions with widgets, layout, and access control';
COMMENT ON COLUMN dashboard_definitions.config IS 'Dashboard configuration including widgets array, layout, filters, and settings';
COMMENT ON COLUMN dashboard_definitions.version IS 'Dashboard version number, incremented on each update';
COMMENT ON COLUMN dashboard_definitions.shared_with IS 'Array of user UUIDs who have access to this dashboard';
COMMENT ON CONSTRAINT uq_dashboard_definitions_org_code ON dashboard_definitions IS 'Natural key: dashboards are unique by (org_id, dashboard_code)';


-- ============================================================================
-- DASHBOARD FAVORITES TABLE
-- ============================================================================

-- Create dashboard_favorites table for user favorites
CREATE TABLE IF NOT EXISTS dashboard_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dashboard_id UUID NOT NULL REFERENCES dashboard_definitions(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Ordering
  sort_order INTEGER DEFAULT 0,
  
  -- Pinning
  pinned BOOLEAN DEFAULT false,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique constraint: one favorite per user per dashboard
  CONSTRAINT uq_dashboard_favorites_user_dashboard UNIQUE (user_id, dashboard_id),
  
  -- Check constraints
  CONSTRAINT chk_dashboard_favorites_sort_order CHECK (sort_order >= 0)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_favorites_user ON dashboard_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_favorites_dashboard ON dashboard_favorites(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_favorites_org ON dashboard_favorites(org_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_favorites_user_sort ON dashboard_favorites(user_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_dashboard_favorites_pinned ON dashboard_favorites(user_id, pinned) WHERE pinned = true;

-- Enable RLS
ALTER TABLE dashboard_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY dashboard_favorites_tenant_isolation ON dashboard_favorites
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON dashboard_favorites TO authenticated;

-- Add comments
COMMENT ON TABLE dashboard_favorites IS 'User dashboard favorites and pinning';
COMMENT ON COLUMN dashboard_favorites.sort_order IS 'User-defined sort order for favorites list';
COMMENT ON COLUMN dashboard_favorites.pinned IS 'Whether dashboard is pinned to top of favorites';
COMMENT ON CONSTRAINT uq_dashboard_favorites_user_dashboard ON dashboard_favorites IS 'Each user can favorite a dashboard only once';


-- ============================================================================
-- ENERGY TARIFFS TABLE
-- ============================================================================

-- Create energy_tariffs table for transmission tariff structures
CREATE TABLE IF NOT EXISTS energy_tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tariff_code TEXT NOT NULL,  -- Natural key
  tariff_name TEXT NOT NULL,
  description TEXT,
  
  -- Tariff type
  tariff_type TEXT NOT NULL,  -- 'transmission', 'distribution', 'generation', 'ancillary_services'
  rate_structure TEXT NOT NULL,  -- 'flat', 'time_of_use', 'demand_charge', 'tiered', 'real_time_pricing'
  
  -- Utility/Provider
  utility_name TEXT,
  utility_account_number TEXT,
  service_territory TEXT,
  
  -- Applicability
  applies_to_scope TEXT NOT NULL,  -- 'org', 'substation', 'feeder', 'meter'
  scope_id UUID,  -- Reference to specific entity
  voltage_level_kv INTEGER,  -- Applicable voltage level
  
  -- Rate components
  energy_rate_per_kwh DECIMAL(10,6),  -- Energy charge ($/kWh)
  demand_rate_per_kw DECIMAL(10,4),  -- Demand charge ($/kW)
  fixed_charge_per_month DECIMAL(10,2),  -- Fixed monthly charge
  
  -- Time-of-use rates (if applicable)
  tou_rates JSONB DEFAULT '{}',  -- JSON defining TOU periods and rates
  
  -- Demand charge configuration
  demand_window_minutes INTEGER,  -- Demand measurement window (typically 15 or 30 minutes)
  demand_ratchet_enabled BOOLEAN DEFAULT false,
  demand_ratchet_percentage DECIMAL(5,2),  -- Minimum demand as % of peak (e.g., 80%)
  demand_ratchet_months INTEGER,  -- Number of months ratchet applies
  
  -- Seasonal rates
  seasonal_rates_enabled BOOLEAN DEFAULT false,
  seasonal_rates JSONB DEFAULT '{}',  -- JSON defining seasonal rate variations
  
  -- Temporal validity
  effective_date DATE NOT NULL,
  expiry_date DATE,
  
  -- Status
  active BOOLEAN DEFAULT true,
  default_tariff BOOLEAN DEFAULT false,  -- Is this the default tariff for this scope
  
  -- Additional charges
  additional_charges JSONB DEFAULT '{}',  -- JSON for other charges (taxes, fees, surcharges)
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Natural key constraint
  CONSTRAINT uq_energy_tariffs_org_code UNIQUE (org_id, tariff_code),
  
  -- Check constraints
  CONSTRAINT chk_energy_tariffs_dates CHECK (expiry_date IS NULL OR expiry_date > effective_date),
  CONSTRAINT chk_energy_tariffs_energy_rate CHECK (energy_rate_per_kwh IS NULL OR energy_rate_per_kwh >= 0),
  CONSTRAINT chk_energy_tariffs_demand_rate CHECK (demand_rate_per_kw IS NULL OR demand_rate_per_kw >= 0),
  CONSTRAINT chk_energy_tariffs_fixed_charge CHECK (fixed_charge_per_month IS NULL OR fixed_charge_per_month >= 0),
  CONSTRAINT chk_energy_tariffs_demand_window CHECK (demand_window_minutes IS NULL OR demand_window_minutes > 0),
  CONSTRAINT chk_energy_tariffs_ratchet_pct CHECK (demand_ratchet_percentage IS NULL OR (demand_ratchet_percentage >= 0 AND demand_ratchet_percentage <= 100)),
  CONSTRAINT chk_energy_tariffs_ratchet_months CHECK (demand_ratchet_months IS NULL OR demand_ratchet_months > 0),
  CONSTRAINT chk_energy_tariffs_voltage CHECK (voltage_level_kv IS NULL OR voltage_level_kv > 0),
  CONSTRAINT chk_energy_tariffs_type CHECK (tariff_type IN ('transmission', 'distribution', 'generation', 'ancillary_services', 'combined')),
  CONSTRAINT chk_energy_tariffs_structure CHECK (rate_structure IN ('flat', 'time_of_use', 'demand_charge', 'tiered', 'real_time_pricing', 'combined')),
  CONSTRAINT chk_energy_tariffs_scope CHECK (applies_to_scope IN ('org', 'substation', 'feeder', 'meter'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_org ON energy_tariffs(org_id);
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_type ON energy_tariffs(tariff_type);
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_structure ON energy_tariffs(rate_structure);
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_scope ON energy_tariffs(applies_to_scope, scope_id);
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_voltage ON energy_tariffs(voltage_level_kv) WHERE voltage_level_kv IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_effective ON energy_tariffs(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_active ON energy_tariffs(org_id, active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_default ON energy_tariffs(org_id, applies_to_scope) WHERE default_tariff = true;
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_utility ON energy_tariffs(utility_name) WHERE utility_name IS NOT NULL;

-- Composite index for tariff lookup
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_lookup 
  ON energy_tariffs(org_id, applies_to_scope, scope_id, effective_date DESC) 
  WHERE active = true;

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_tou_gin ON energy_tariffs USING GIN (tou_rates);
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_seasonal_gin ON energy_tariffs USING GIN (seasonal_rates);
CREATE INDEX IF NOT EXISTS idx_energy_tariffs_additional_gin ON energy_tariffs USING GIN (additional_charges);

-- Enable RLS
ALTER TABLE energy_tariffs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY energy_tariffs_tenant_isolation ON energy_tariffs
  FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON energy_tariffs TO authenticated;

-- Add comments
COMMENT ON TABLE energy_tariffs IS 'Energy tariff structures for transmission demand charges and rate calculations';
COMMENT ON COLUMN energy_tariffs.rate_structure IS 'Type of rate structure (flat, time-of-use, demand charge, tiered, real-time pricing)';
COMMENT ON COLUMN energy_tariffs.demand_window_minutes IS 'Demand measurement window in minutes (typically 15 or 30)';
COMMENT ON COLUMN energy_tariffs.demand_ratchet_percentage IS 'Minimum demand as percentage of peak demand';
COMMENT ON COLUMN energy_tariffs.tou_rates IS 'JSON defining time-of-use periods and rates';
COMMENT ON COLUMN energy_tariffs.seasonal_rates IS 'JSON defining seasonal rate variations';
COMMENT ON CONSTRAINT uq_energy_tariffs_org_code ON energy_tariffs IS 'Natural key: tariffs are unique by (org_id, tariff_code)';


-- ============================================================================
-- EXTEND EXPORT JOBS TABLE (if not already created in sustainability migration)
-- ============================================================================

-- Check if export_jobs table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'export_jobs') THEN
    -- Create export_jobs table
    CREATE TABLE export_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      
      -- Job details
      job_type TEXT NOT NULL,  -- 'report', 'data_export', 'audit_export', 'compliance_package', 'dashboard_export'
      template_id UUID,  -- References report_templates(id) if applicable
      dashboard_id UUID REFERENCES dashboard_definitions(id) ON DELETE SET NULL,  -- For dashboard exports
      
      -- Export parameters
      export_format TEXT NOT NULL,  -- 'pdf', 'excel', 'csv', 'json', 'xml'
      date_range_start TIMESTAMPTZ,
      date_range_end TIMESTAMPTZ,
      filters JSONB DEFAULT '{}',  -- Additional filters applied to export
      
      -- Status tracking
      status TEXT DEFAULT 'pending',  -- 'pending', 'queued', 'running', 'completed', 'failed', 'cancelled'
      progress_percentage INTEGER DEFAULT 0,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      
      -- Timing
      queued_at TIMESTAMPTZ,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,  -- When the download link expires
      
      -- Output
      output_file_url TEXT,
      output_file_name TEXT,
      output_file_size_bytes BIGINT,
      row_count INTEGER,  -- Number of rows/records in export
      
      -- Metadata
      generation_metadata JSONB DEFAULT '{}',  -- Template version, data sources, etc.
      requested_by UUID,  -- User who requested the export
      
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now(),
      
      -- Check constraints
      CONSTRAINT chk_export_jobs_date_range CHECK (date_range_end IS NULL OR date_range_end >= date_range_start),
      CONSTRAINT chk_export_jobs_progress CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
      CONSTRAINT chk_export_jobs_retry CHECK (retry_count >= 0 AND retry_count <= max_retries),
      CONSTRAINT chk_export_jobs_file_size CHECK (output_file_size_bytes IS NULL OR output_file_size_bytes > 0),
      CONSTRAINT chk_export_jobs_row_count CHECK (row_count IS NULL OR row_count >= 0),
      CONSTRAINT chk_export_jobs_timing CHECK (
        (started_at IS NULL OR started_at >= queued_at) AND
        (completed_at IS NULL OR completed_at >= started_at)
      ),
      CONSTRAINT chk_export_jobs_type CHECK (job_type IN ('report', 'data_export', 'audit_export', 'compliance_package', 'dashboard_export')),
      CONSTRAINT chk_export_jobs_format CHECK (export_format IN ('pdf', 'excel', 'csv', 'json', 'xml')),
      CONSTRAINT chk_export_jobs_status CHECK (status IN ('pending', 'queued', 'running', 'completed', 'failed', 'cancelled'))
    );

    -- Create indexes
    CREATE INDEX idx_export_jobs_org ON export_jobs(org_id);
    CREATE INDEX idx_export_jobs_template ON export_jobs(template_id) WHERE template_id IS NOT NULL;
    CREATE INDEX idx_export_jobs_dashboard ON export_jobs(dashboard_id) WHERE dashboard_id IS NOT NULL;
    CREATE INDEX idx_export_jobs_status ON export_jobs(status);
    CREATE INDEX idx_export_jobs_type ON export_jobs(job_type);
    CREATE INDEX idx_export_jobs_requested_by ON export_jobs(requested_by);
    CREATE INDEX idx_export_jobs_created ON export_jobs(created_at DESC);
    CREATE INDEX idx_export_jobs_completed ON export_jobs(completed_at DESC) WHERE completed_at IS NOT NULL;
    CREATE INDEX idx_export_jobs_expires ON export_jobs(expires_at) WHERE expires_at IS NOT NULL;
    CREATE INDEX idx_export_jobs_org_status ON export_jobs(org_id, status);
    CREATE INDEX idx_export_jobs_pending ON export_jobs(created_at) WHERE status IN ('pending', 'queued');

    -- Enable RLS
    ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;

    -- Create RLS policy
    CREATE POLICY export_jobs_tenant_isolation ON export_jobs
      FOR ALL USING (org_id = current_setting('app.current_tenant_id')::UUID);

    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON export_jobs TO authenticated;

    -- Add comments
    COMMENT ON TABLE export_jobs IS 'Export job tracking for reports, dashboards, and data exports';
    COMMENT ON COLUMN export_jobs.status IS 'Job status: pending → queued → running → completed/failed/cancelled';
    COMMENT ON COLUMN export_jobs.expires_at IS 'When the download link expires (typically 7-30 days after completion)';
    -- COMMENT ON CONSTRAINT chk_export_jobs_timing ON export_jobs IS 'Ensures timestamps are monotonically increasing';
  ELSE
    -- Table exists, add dashboard_id column if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'export_jobs' 
      AND column_name = 'dashboard_id'
    ) THEN
      ALTER TABLE export_jobs ADD COLUMN dashboard_id UUID REFERENCES dashboard_definitions(id) ON DELETE SET NULL;
      CREATE INDEX idx_export_jobs_dashboard ON export_jobs(dashboard_id) WHERE dashboard_id IS NOT NULL;
      COMMENT ON COLUMN export_jobs.dashboard_id IS 'Reference to dashboard for dashboard exports';
    END IF;
  END IF;
END $$;


-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Add updated_at triggers for new tables
CREATE TRIGGER tr_dashboard_definitions_updated_at
  BEFORE UPDATE ON dashboard_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_dashboard_favorites_updated_at
  BEFORE UPDATE ON dashboard_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_energy_tariffs_updated_at
  BEFORE UPDATE ON energy_tariffs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for export_jobs if it was just created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_trigger 
    WHERE tgname = 'tr_export_jobs_updated_at'
  ) THEN
    CREATE TRIGGER tr_export_jobs_updated_at
      BEFORE UPDATE ON export_jobs
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate tariff cost for a given consumption and demand
CREATE OR REPLACE FUNCTION fn_calculate_tariff_cost(
  p_tariff_id UUID,
  p_energy_kwh DECIMAL(15,4),
  p_peak_demand_kw DECIMAL(12,4),
  p_period_start TIMESTAMPTZ,
  p_period_end TIMESTAMPTZ
)
RETURNS TABLE (
  energy_cost DECIMAL(12,2),
  demand_cost DECIMAL(12,2),
  fixed_cost DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  tariff_name TEXT
) AS $$
DECLARE
  v_tariff RECORD;
  v_energy_cost DECIMAL(12,2) := 0;
  v_demand_cost DECIMAL(12,2) := 0;
  v_fixed_cost DECIMAL(12,2) := 0;
  v_months INTEGER;
BEGIN
  -- Get tariff details
  SELECT * INTO v_tariff FROM energy_tariffs WHERE id = p_tariff_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tariff not found: %', p_tariff_id;
  END IF;
  
  -- Calculate energy cost
  IF v_tariff.energy_rate_per_kwh IS NOT NULL THEN
    v_energy_cost := p_energy_kwh * v_tariff.energy_rate_per_kwh;
  END IF;
  
  -- Calculate demand cost
  IF v_tariff.demand_rate_per_kw IS NOT NULL THEN
    v_demand_cost := p_peak_demand_kw * v_tariff.demand_rate_per_kw;
  END IF;
  
  -- Calculate fixed cost (prorated for period)
  IF v_tariff.fixed_charge_per_month IS NOT NULL THEN
    v_months := EXTRACT(EPOCH FROM (p_period_end - p_period_start)) / (30 * 24 * 3600);
    v_fixed_cost := v_tariff.fixed_charge_per_month * v_months;
  END IF;
  
  RETURN QUERY
  SELECT 
    v_energy_cost as energy_cost,
    v_demand_cost as demand_cost,
    v_fixed_cost as fixed_cost,
    (v_energy_cost + v_demand_cost + v_fixed_cost) as total_cost,
    v_tariff.tariff_name as tariff_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_calculate_tariff_cost(UUID, DECIMAL, DECIMAL, TIMESTAMPTZ, TIMESTAMPTZ) IS 'Calculates total tariff cost including energy, demand, and fixed charges';


-- Function to get active tariff for a given scope and date
CREATE OR REPLACE FUNCTION fn_get_active_tariff(
  p_org_id UUID,
  p_scope_type TEXT,
  p_scope_id UUID,
  p_date DATE
)
RETURNS TABLE (
  tariff_id UUID,
  tariff_code TEXT,
  tariff_name TEXT,
  rate_structure TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    et.id as tariff_id,
    et.tariff_code,
    et.tariff_name,
    et.rate_structure
  FROM energy_tariffs et
  WHERE et.org_id = p_org_id
    AND et.applies_to_scope = p_scope_type
    AND (et.scope_id = p_scope_id OR et.scope_id IS NULL)
    AND et.effective_date <= p_date
    AND (et.expiry_date IS NULL OR et.expiry_date > p_date)
    AND et.active = true
  ORDER BY 
    et.scope_id IS NOT NULL DESC,  -- Prefer specific scope over org-wide
    et.default_tariff DESC,  -- Then prefer default tariff
    et.effective_date DESC   -- Then most recent
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_get_active_tariff(UUID, TEXT, UUID, DATE) IS 'Returns the active tariff for a given scope and date';


-- Function to increment dashboard view count
CREATE OR REPLACE FUNCTION fn_increment_dashboard_views(
  p_dashboard_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE dashboard_definitions
  SET 
    view_count = view_count + 1,
    last_viewed_at = now()
  WHERE id = p_dashboard_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_increment_dashboard_views(UUID) IS 'Increments view count and updates last viewed timestamp for a dashboard';

