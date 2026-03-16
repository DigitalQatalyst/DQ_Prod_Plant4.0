-- Enable RLS on shared routing spine
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Enable RLS on shared visibility spine
ALTER TABLE platform_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_health_findings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on shared config spine
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_toggles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_defaults ENABLE ROW LEVEL SECURITY;

-- Enable RLS on shared identity spine
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE responsibility_labels ENABLE ROW LEVEL SECURITY;

-- Enable RLS on shared integrations spine
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Overview tables
ALTER TABLE overview_dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE overview_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE overview_dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE overview_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE overview_alert_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_cards ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Settings tables
ALTER TABLE tenant_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE naming_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_hierarchy_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create placeholder policies (service role bypasses RLS)
-- These will be replaced with JWT-based policies in future phase
CREATE POLICY "Service role bypass" ON work_items FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON notifications FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON platform_health_checks FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON platform_health_findings FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON streams FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON module_toggles FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON scope_defaults FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON teams FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON team_memberships FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON responsibility_labels FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON integrations FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON integration_mappings FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON integration_health_events FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON overview_dashboards FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON overview_widgets FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON overview_dashboard_widgets FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON overview_exceptions FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON overview_alert_triage FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON advisor_cards FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON tenant_profile FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON programs FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON naming_standards FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON site_hierarchy_nodes FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON tenant_units FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON user_preferences FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON notification_preferences FOR ALL USING (true);
