-- Remediation migration: Ensure all tables required by v_overview_kpis exist.
-- This guards against cases where earlier migrations were recorded in supabase_migrations
-- history but did not physically create the tables (e.g. partial remote state).

-- 1. work_items (originally created in 020_create_shared_routing_spine.sql)
CREATE TABLE IF NOT EXISTS work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT,
  assigned_to_user_id UUID,
  due_at TIMESTAMPTZ,
  source_feature_area TEXT NOT NULL,
  source_table TEXT,
  source_id UUID,
  deeplink_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_items_tenant_assigned_status
  ON work_items(tenant_id, assigned_to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_work_items_tenant_due
  ON work_items(tenant_id, due_at) WHERE status != 'completed';

-- 2. notifications (originally created in 020_create_shared_routing_spine.sql)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(tenant_id, user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_recent
  ON notifications(tenant_id, user_id, created_at DESC);

-- 3. platform_health_checks (originally created in 021_create_shared_visibility_spine.sql)
CREATE TABLE IF NOT EXISTS platform_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  check_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  params JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, check_key)
);

CREATE INDEX IF NOT EXISTS idx_health_checks_tenant_enabled
  ON platform_health_checks(tenant_id, enabled);

-- 4. platform_health_findings (originally created in 021_create_shared_visibility_spine.sql)
CREATE TABLE IF NOT EXISTS platform_health_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  check_key TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  first_seen TIMESTAMPTZ NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL,
  details JSONB,
  resolved_at TIMESTAMPTZ,
  FOREIGN KEY (tenant_id, check_key)
    REFERENCES platform_health_checks(tenant_id, check_key) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_health_findings_tenant_status_severity
  ON platform_health_findings(tenant_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_health_findings_tenant_check
  ON platform_health_findings(tenant_id, check_key, status);

-- 5. Ensure integration_health_events exists (originally created in 024_shared_integrations_and_site_type.sql)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'integration_health_events'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'integrations'
    ) THEN
      CREATE TABLE IF NOT EXISTS integration_health_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        details JSONB
      );
      CREATE INDEX IF NOT EXISTS idx_integration_health_tenant_integration_time
        ON integration_health_events(tenant_id, integration_id, timestamp DESC);
    END IF;
  END IF;




-- Create tenant_profile table
CREATE TABLE IF NOT EXISTS tenant_profile (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  region TEXT,
  timezone TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  regulatory_profile JSONB
);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Create naming_standards table
CREATE TABLE IF NOT EXISTS naming_standards (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  rules JSONB NOT NULL
);

-- Create site_hierarchy_nodes table
CREATE TABLE IF NOT EXISTS site_hierarchy_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES site_hierarchy_nodes(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, site_id, path)
);

CREATE INDEX IF NOT EXISTS idx_hierarchy_nodes_tenant_site_parent 
  ON site_hierarchy_nodes(tenant_id, site_id, parent_id);

-- Create tenant_units table
CREATE TABLE IF NOT EXISTS tenant_units (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  unit_system JSONB NOT NULL
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  defaults JSONB
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channels JSONB,
  digest_frequency TEXT,
  quiet_hours JSONB
);



-- Create overview_dashboards table
CREATE TABLE IF NOT EXISTS overview_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  preset_type TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  scope_defaults JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_overview_dashboards_tenant_default 
  ON overview_dashboards(tenant_id) WHERE is_default = true;

-- Create overview_widgets table
CREATE TABLE IF NOT EXISTS overview_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  widget_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_feature_area TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, widget_key)
);

-- Create overview_dashboard_widgets table
CREATE TABLE IF NOT EXISTS overview_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES overview_dashboards(id) ON DELETE CASCADE,
  widget_id UUID NOT NULL REFERENCES overview_widgets(id) ON DELETE CASCADE,
  position JSONB NOT NULL,
  config JSONB,
  UNIQUE(dashboard_id, widget_id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard 
  ON overview_dashboard_widgets(dashboard_id);

-- Create overview_exceptions table
CREATE TABLE IF NOT EXISTS overview_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  exception_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'new',
  source_ref JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overview_exceptions_tenant_status_severity 
  ON overview_exceptions(tenant_id, status, severity);

-- Create overview_alert_triage table
CREATE TABLE IF NOT EXISTS overview_alert_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'new',
  routed_to_feature_area TEXT,
  routed_to_ref JSONB,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alert_id)
);

-- Create advisor_cards table
CREATE TABLE IF NOT EXISTS advisor_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  card_key TEXT NOT NULL,
  title TEXT NOT NULL,
  severity TEXT NOT NULL,
  rationale TEXT,
  recommended_action TEXT,
  deeplink_path TEXT,
  params JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, card_key)
);

CREATE INDEX IF NOT EXISTS idx_advisor_cards_tenant_severity 
  ON advisor_cards(tenant_id, severity);
