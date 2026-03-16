-- Migration: 013_create_sim_tables.sql
-- Description: Create SIM (Shift Intelligence Management) schema for Lean Execution
-- Feature: Operational Excellence - Lean Execution (SIM)
-- LOCAL DATABASE ONLY: This migration should ONLY be run against local Supabase instance

-- ============================================================================
-- ROLLBACK SECTION (Commented out - uncomment for manual rollback)
-- ============================================================================
/*
DROP TABLE IF EXISTS sim_action_links CASCADE;
DROP TABLE IF EXISTS sim_actions CASCADE;
DROP TABLE IF EXISTS sim_issues CASCADE;
DROP TABLE IF EXISTS outage_impacts CASCADE;
DROP TABLE IF EXISTS outages CASCADE;
DROP TABLE IF EXISTS switching_order_impacts CASCADE;
DROP TABLE IF EXISTS switching_orders CASCADE;
DROP TABLE IF EXISTS sim_kpis CASCADE;
DROP TABLE IF EXISTS sim_boards CASCADE;
DROP TABLE IF EXISTS sim_shifts CASCADE;
*/

-- ============================================================================
-- TABLE: sim_shifts
-- Description: Shift definitions for operational periods
-- Natural Key: (tenant_id, site_id, shift_start)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sim_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  shift_start TIMESTAMPTZ NOT NULL,
  shift_end TIMESTAMPTZ NOT NULL,
  shift_name TEXT NOT NULL CHECK (shift_name IN ('day', 'evening', 'night')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, site_id, shift_start)
);

COMMENT ON TABLE sim_shifts IS 'Shift definitions for operational control periods';
COMMENT ON COLUMN sim_shifts.shift_name IS 'Shift type: day, evening, or night';
COMMENT ON COLUMN sim_shifts.shift_start IS 'Start timestamp of the shift';
COMMENT ON COLUMN sim_shifts.shift_end IS 'End timestamp of the shift';

-- Indexes for sim_shifts
CREATE INDEX IF NOT EXISTS idx_sim_shifts_tenant_id ON sim_shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sim_shifts_site_id ON sim_shifts(site_id);
CREATE INDEX IF NOT EXISTS idx_sim_shifts_shift_start ON sim_shifts(shift_start);
CREATE INDEX IF NOT EXISTS idx_sim_shifts_shift_name ON sim_shifts(shift_name);

-- ============================================================================
-- TABLE: sim_boards
-- Description: SIM boards for shift operational dashboards
-- Natural Key: (tenant_id, board_date, site_id, shift_id)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sim_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  board_date DATE NOT NULL,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  shift_id UUID REFERENCES sim_shifts(id) ON DELETE SET NULL,
  board_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('on-track', 'at-risk', 'behind')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, board_date, site_id, shift_id)
);

COMMENT ON TABLE sim_boards IS 'SIM boards for shift operational dashboards';
COMMENT ON COLUMN sim_boards.board_date IS 'Date of the SIM board';
COMMENT ON COLUMN sim_boards.status IS 'Board status: on-track, at-risk, or behind';

-- Indexes for sim_boards
CREATE INDEX IF NOT EXISTS idx_sim_boards_tenant_id ON sim_boards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sim_boards_site_id ON sim_boards(site_id);
CREATE INDEX IF NOT EXISTS idx_sim_boards_shift_id ON sim_boards(shift_id);
CREATE INDEX IF NOT EXISTS idx_sim_boards_board_date ON sim_boards(board_date);
CREATE INDEX IF NOT EXISTS idx_sim_boards_status ON sim_boards(status);

-- ============================================================================
-- TABLE: sim_kpis
-- Description: KPI metrics for SIM boards
-- Natural Key: (tenant_id, board_id, kpi_code)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sim_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES sim_boards(id) ON DELETE CASCADE,
  kpi_code TEXT NOT NULL,
  kpi_name TEXT NOT NULL,
  target_value DOUBLE PRECISION,
  actual_value DOUBLE PRECISION,
  unit TEXT,
  status TEXT CHECK (status IN ('good', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, board_id, kpi_code)
);

COMMENT ON TABLE sim_kpis IS 'KPI metrics tracked on SIM boards';
COMMENT ON COLUMN sim_kpis.kpi_code IS 'Unique code for the KPI within the board';
COMMENT ON COLUMN sim_kpis.status IS 'KPI status: good, warning, or critical';

-- Indexes for sim_kpis
CREATE INDEX IF NOT EXISTS idx_sim_kpis_tenant_id ON sim_kpis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sim_kpis_board_id ON sim_kpis(board_id);
CREATE INDEX IF NOT EXISTS idx_sim_kpis_kpi_code ON sim_kpis(kpi_code);
CREATE INDEX IF NOT EXISTS idx_sim_kpis_status ON sim_kpis(status);

-- ============================================================================
-- TABLE: switching_orders
-- Description: Switching operations on transmission equipment
-- Natural Key: (tenant_id, order_no)
-- ============================================================================
CREATE TABLE IF NOT EXISTS switching_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_no TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT CHECK (status IN ('pending', 'approved', 'in-progress', 'completed', 'cancelled')),
  planned_start TIMESTAMPTZ,
  planned_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  assigned_owner TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, order_no)
);

COMMENT ON TABLE switching_orders IS 'Switching operations on transmission equipment';
COMMENT ON COLUMN switching_orders.order_no IS 'Unique order number within tenant';
COMMENT ON COLUMN switching_orders.priority IS 'Priority: high, medium, or low';
COMMENT ON COLUMN switching_orders.status IS 'Status: pending, approved, in-progress, completed, or cancelled';

-- Indexes for switching_orders
CREATE INDEX IF NOT EXISTS idx_switching_orders_tenant_id ON switching_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_switching_orders_status ON switching_orders(status);
CREATE INDEX IF NOT EXISTS idx_switching_orders_priority ON switching_orders(priority);
CREATE INDEX IF NOT EXISTS idx_switching_orders_planned_start ON switching_orders(planned_start);
CREATE INDEX IF NOT EXISTS idx_switching_orders_assigned_owner ON switching_orders(assigned_owner);

-- ============================================================================
-- TABLE: switching_order_impacts
-- Description: Grid topology and asset impacts of switching orders
-- Constraint: At least one of node_id, line_id, or asset_id must be specified
-- ============================================================================
CREATE TABLE IF NOT EXISTS switching_order_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES switching_orders(id) ON DELETE CASCADE,
  node_id UUID REFERENCES grid_nodes(id) ON DELETE CASCADE,
  line_id UUID REFERENCES grid_lines(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (node_id IS NOT NULL)::int + 
    (line_id IS NOT NULL)::int + 
    (asset_id IS NOT NULL)::int >= 1
  )
);

COMMENT ON TABLE switching_order_impacts IS 'Grid topology and asset impacts of switching orders';
COMMENT ON COLUMN switching_order_impacts.node_id IS 'Impacted grid node (substation)';
COMMENT ON COLUMN switching_order_impacts.line_id IS 'Impacted transmission line';
COMMENT ON COLUMN switching_order_impacts.asset_id IS 'Impacted asset';

-- Indexes for switching_order_impacts
CREATE INDEX IF NOT EXISTS idx_switching_order_impacts_order_id ON switching_order_impacts(order_id);
CREATE INDEX IF NOT EXISTS idx_switching_order_impacts_node_id ON switching_order_impacts(node_id);
CREATE INDEX IF NOT EXISTS idx_switching_order_impacts_line_id ON switching_order_impacts(line_id);
CREATE INDEX IF NOT EXISTS idx_switching_order_impacts_asset_id ON switching_order_impacts(asset_id);

-- ============================================================================
-- TABLE: outages
-- Description: Planned and unplanned service interruptions
-- Natural Key: (tenant_id, outage_ref)
-- ============================================================================
CREATE TABLE IF NOT EXISTS outages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  outage_ref TEXT NOT NULL,
  outage_type TEXT CHECK (outage_type IN ('planned', 'unplanned')),
  status TEXT CHECK (status IN ('scheduled', 'active', 'resolved')),
  start_time TIMESTAMPTZ NOT NULL,
  estimated_restoration TIMESTAMPTZ,
  actual_restoration TIMESTAMPTZ,
  impact_level TEXT CHECK (impact_level IN ('high', 'medium', 'low')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, outage_ref)
);

COMMENT ON TABLE outages IS 'Planned and unplanned service interruptions';
COMMENT ON COLUMN outages.outage_ref IS 'Unique outage reference within tenant';
COMMENT ON COLUMN outages.outage_type IS 'Type: planned or unplanned';
COMMENT ON COLUMN outages.status IS 'Status: scheduled, active, or resolved';
COMMENT ON COLUMN outages.impact_level IS 'Impact level: high, medium, or low';

-- Indexes for outages
CREATE INDEX IF NOT EXISTS idx_outages_tenant_id ON outages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_outages_status ON outages(status);
CREATE INDEX IF NOT EXISTS idx_outages_outage_type ON outages(outage_type);
CREATE INDEX IF NOT EXISTS idx_outages_start_time ON outages(start_time);
CREATE INDEX IF NOT EXISTS idx_outages_impact_level ON outages(impact_level);

-- ============================================================================
-- TABLE: outage_impacts
-- Description: Grid topology and asset impacts of outages
-- Constraint: At least one of node_id, line_id, or asset_id must be specified
-- ============================================================================
CREATE TABLE IF NOT EXISTS outage_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outage_id UUID NOT NULL REFERENCES outages(id) ON DELETE CASCADE,
  node_id UUID REFERENCES grid_nodes(id) ON DELETE CASCADE,
  line_id UUID REFERENCES grid_lines(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (node_id IS NOT NULL)::int + 
    (line_id IS NOT NULL)::int + 
    (asset_id IS NOT NULL)::int >= 1
  )
);

COMMENT ON TABLE outage_impacts IS 'Grid topology and asset impacts of outages';
COMMENT ON COLUMN outage_impacts.node_id IS 'Impacted grid node (substation)';
COMMENT ON COLUMN outage_impacts.line_id IS 'Impacted transmission line';
COMMENT ON COLUMN outage_impacts.asset_id IS 'Impacted asset';

-- Indexes for outage_impacts
CREATE INDEX IF NOT EXISTS idx_outage_impacts_outage_id ON outage_impacts(outage_id);
CREATE INDEX IF NOT EXISTS idx_outage_impacts_node_id ON outage_impacts(node_id);
CREATE INDEX IF NOT EXISTS idx_outage_impacts_line_id ON outage_impacts(line_id);
CREATE INDEX IF NOT EXISTS idx_outage_impacts_asset_id ON outage_impacts(asset_id);

-- ============================================================================
-- TABLE: sim_issues
-- Description: Issues logged during shift operations
-- Natural Key: (tenant_id, issue_ref)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sim_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  issue_ref TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT CHECK (status IN ('open', 'in-progress', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, issue_ref)
);

COMMENT ON TABLE sim_issues IS 'Issues logged during shift operations';
COMMENT ON COLUMN sim_issues.issue_ref IS 'Unique issue reference within tenant';
COMMENT ON COLUMN sim_issues.priority IS 'Priority: high, medium, or low';
COMMENT ON COLUMN sim_issues.status IS 'Status: open, in-progress, or resolved';

-- Indexes for sim_issues
CREATE INDEX IF NOT EXISTS idx_sim_issues_tenant_id ON sim_issues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sim_issues_status ON sim_issues(status);
CREATE INDEX IF NOT EXISTS idx_sim_issues_priority ON sim_issues(priority);
CREATE INDEX IF NOT EXISTS idx_sim_issues_category ON sim_issues(category);

-- ============================================================================
-- TABLE: sim_actions
-- Description: Actions with owners and due dates
-- Natural Key: (tenant_id, action_ref)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sim_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action_ref TEXT NOT NULL,
  description TEXT NOT NULL,
  owner TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  status TEXT CHECK (status IN ('pending', 'in-progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, action_ref)
);

COMMENT ON TABLE sim_actions IS 'Actions with owners and due dates';
COMMENT ON COLUMN sim_actions.action_ref IS 'Unique action reference within tenant';
COMMENT ON COLUMN sim_actions.owner IS 'Person responsible for the action';
COMMENT ON COLUMN sim_actions.status IS 'Status: pending, in-progress, or completed';

-- Indexes for sim_actions
CREATE INDEX IF NOT EXISTS idx_sim_actions_tenant_id ON sim_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sim_actions_status ON sim_actions(status);
CREATE INDEX IF NOT EXISTS idx_sim_actions_owner ON sim_actions(owner);
CREATE INDEX IF NOT EXISTS idx_sim_actions_due_date ON sim_actions(due_date);

-- ============================================================================
-- TABLE: sim_action_links
-- Description: Links between actions and various entities
-- Constraint: At least one link target must be specified
-- ============================================================================
CREATE TABLE IF NOT EXISTS sim_action_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID NOT NULL REFERENCES sim_actions(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES sim_issues(id) ON DELETE CASCADE,
  order_id UUID REFERENCES switching_orders(id) ON DELETE CASCADE,
  outage_id UUID REFERENCES outages(id) ON DELETE CASCADE,
  node_id UUID REFERENCES grid_nodes(id) ON DELETE CASCADE,
  line_id UUID REFERENCES grid_lines(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (issue_id IS NOT NULL)::int + 
    (order_id IS NOT NULL)::int + 
    (outage_id IS NOT NULL)::int + 
    (node_id IS NOT NULL)::int + 
    (line_id IS NOT NULL)::int + 
    (asset_id IS NOT NULL)::int >= 1
  )
);

COMMENT ON TABLE sim_action_links IS 'Links between actions and various entities (issues, orders, outages, assets, nodes, lines)';
COMMENT ON COLUMN sim_action_links.issue_id IS 'Linked issue';
COMMENT ON COLUMN sim_action_links.order_id IS 'Linked switching order';
COMMENT ON COLUMN sim_action_links.outage_id IS 'Linked outage';
COMMENT ON COLUMN sim_action_links.node_id IS 'Linked grid node';
COMMENT ON COLUMN sim_action_links.line_id IS 'Linked transmission line';
COMMENT ON COLUMN sim_action_links.asset_id IS 'Linked asset';

-- Indexes for sim_action_links
CREATE INDEX IF NOT EXISTS idx_sim_action_links_action_id ON sim_action_links(action_id);
CREATE INDEX IF NOT EXISTS idx_sim_action_links_issue_id ON sim_action_links(issue_id);
CREATE INDEX IF NOT EXISTS idx_sim_action_links_order_id ON sim_action_links(order_id);
CREATE INDEX IF NOT EXISTS idx_sim_action_links_outage_id ON sim_action_links(outage_id);
CREATE INDEX IF NOT EXISTS idx_sim_action_links_node_id ON sim_action_links(node_id);
CREATE INDEX IF NOT EXISTS idx_sim_action_links_line_id ON sim_action_links(line_id);
CREATE INDEX IF NOT EXISTS idx_sim_action_links_asset_id ON sim_action_links(asset_id);

-- ============================================================================
-- TRIGGERS: Automatic timestamp updates
-- ============================================================================

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_sim_shifts_updated_at BEFORE UPDATE ON sim_shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sim_boards_updated_at BEFORE UPDATE ON sim_boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sim_kpis_updated_at BEFORE UPDATE ON sim_kpis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_switching_orders_updated_at BEFORE UPDATE ON switching_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outages_updated_at BEFORE UPDATE ON outages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sim_issues_updated_at BEFORE UPDATE ON sim_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sim_actions_updated_at BEFORE UPDATE ON sim_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE sim_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE switching_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE switching_order_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outages ENABLE ROW LEVEL SECURITY;
ALTER TABLE outage_impacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_action_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sim_shifts
CREATE POLICY "Users can view sim_shifts for their tenant" ON sim_shifts
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert sim_shifts for their tenant" ON sim_shifts
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update sim_shifts for their tenant" ON sim_shifts
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete sim_shifts for their tenant" ON sim_shifts
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS Policies for sim_boards
CREATE POLICY "Users can view sim_boards for their tenant" ON sim_boards
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert sim_boards for their tenant" ON sim_boards
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update sim_boards for their tenant" ON sim_boards
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete sim_boards for their tenant" ON sim_boards
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS Policies for sim_kpis
CREATE POLICY "Users can view sim_kpis for their tenant" ON sim_kpis
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert sim_kpis for their tenant" ON sim_kpis
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update sim_kpis for their tenant" ON sim_kpis
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete sim_kpis for their tenant" ON sim_kpis
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS Policies for switching_orders
CREATE POLICY "Users can view switching_orders for their tenant" ON switching_orders
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert switching_orders for their tenant" ON switching_orders
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update switching_orders for their tenant" ON switching_orders
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete switching_orders for their tenant" ON switching_orders
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS Policies for switching_order_impacts (no tenant_id, uses parent table)
CREATE POLICY "Users can view switching_order_impacts" ON switching_order_impacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM switching_orders 
      WHERE switching_orders.id = switching_order_impacts.order_id 
      AND switching_orders.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "Users can insert switching_order_impacts" ON switching_order_impacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM switching_orders 
      WHERE switching_orders.id = switching_order_impacts.order_id 
      AND switching_orders.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "Users can update switching_order_impacts" ON switching_order_impacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM switching_orders 
      WHERE switching_orders.id = switching_order_impacts.order_id 
      AND switching_orders.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "Users can delete switching_order_impacts" ON switching_order_impacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM switching_orders 
      WHERE switching_orders.id = switching_order_impacts.order_id 
      AND switching_orders.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- RLS Policies for outages
CREATE POLICY "Users can view outages for their tenant" ON outages
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert outages for their tenant" ON outages
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update outages for their tenant" ON outages
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete outages for their tenant" ON outages
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS Policies for outage_impacts (no tenant_id, uses parent table)
CREATE POLICY "Users can view outage_impacts" ON outage_impacts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM outages 
      WHERE outages.id = outage_impacts.outage_id 
      AND outages.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "Users can insert outage_impacts" ON outage_impacts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM outages 
      WHERE outages.id = outage_impacts.outage_id 
      AND outages.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "Users can update outage_impacts" ON outage_impacts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM outages 
      WHERE outages.id = outage_impacts.outage_id 
      AND outages.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "Users can delete outage_impacts" ON outage_impacts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM outages 
      WHERE outages.id = outage_impacts.outage_id 
      AND outages.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- RLS Policies for sim_issues
CREATE POLICY "Users can view sim_issues for their tenant" ON sim_issues
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert sim_issues for their tenant" ON sim_issues
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update sim_issues for their tenant" ON sim_issues
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete sim_issues for their tenant" ON sim_issues
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS Policies for sim_actions
CREATE POLICY "Users can view sim_actions for their tenant" ON sim_actions
  FOR SELECT USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can insert sim_actions for their tenant" ON sim_actions
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can update sim_actions for their tenant" ON sim_actions
  FOR UPDATE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY "Users can delete sim_actions for their tenant" ON sim_actions
  FOR DELETE USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS Policies for sim_action_links (no tenant_id, uses parent table)
CREATE POLICY "Users can view sim_action_links" ON sim_action_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sim_actions 
      WHERE sim_actions.id = sim_action_links.action_id 
      AND sim_actions.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "Users can insert sim_action_links" ON sim_action_links
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sim_actions 
      WHERE sim_actions.id = sim_action_links.action_id 
      AND sim_actions.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "Users can update sim_action_links" ON sim_action_links
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sim_actions 
      WHERE sim_actions.id = sim_action_links.action_id 
      AND sim_actions.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

CREATE POLICY "Users can delete sim_action_links" ON sim_action_links
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sim_actions 
      WHERE sim_actions.id = sim_action_links.action_id 
      AND sim_actions.tenant_id = current_setting('app.current_tenant_id', true)::uuid
    )
  );

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after migration to verify tables were created correctly:
--
-- List all SIM tables:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND (table_name LIKE 'sim_%' OR table_name LIKE '%order%' OR table_name LIKE 'outage%')
-- ORDER BY table_name;
--
-- Verify indexes:
-- SELECT tablename, indexname FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND (tablename LIKE 'sim_%' OR tablename LIKE '%order%' OR tablename LIKE 'outage%')
-- ORDER BY tablename, indexname;
--
-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND (tablename LIKE 'sim_%' OR tablename LIKE '%order%' OR tablename LIKE 'outage%')
-- ORDER BY tablename;
--
-- ============================================================================
