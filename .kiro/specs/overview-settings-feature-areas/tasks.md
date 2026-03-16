# Implementation Tasks: Overview & Settings Feature Areas

**Project:** Plant4.0 (Power → Transmission)  
**Feature:** Overview & Settings  
**Status:** Ready for Implementation

---

## Task Organization

Tasks are organized into phases to minimize risk and ensure dependencies are met:
- **Phase 0**: Scaffolding & Shared Models
- **Phase 1**: Settings Foundations (Streams, Tenant Profile, User Profiles)
- **Phase 2**: Overview Foundations (Dashboards, Widgets, Views)
- **Phase 3**: Work Items & Notifications
- **Phase 4**: Platform Health
- **Phase 5**: Integrations
- **Phase 6**: Remaining Pages & Polish

Each task includes:
- Purpose and context
- Files to create/modify
- Acceptance criteria
- Seed expectations

---

## Phase 0: Scaffolding & Shared Models

### Task 0.1: Create Shared Routing & Attention Spine Migration

**Purpose**: Create tables for work items and notifications

**Files to Create:**
- `supabase/migrations/20260129_001_create_shared_routing_spine.sql`

**Migration Content:**
```sql
-- Create work_items table
CREATE TABLE work_items (
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

CREATE INDEX idx_work_items_tenant_assigned_status 
  ON work_items(tenant_id, assigned_to_user_id, status);
CREATE INDEX idx_work_items_tenant_due 
  ON work_items(tenant_id, due_at) WHERE status != 'completed';

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_unread 
  ON notifications(tenant_id, user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_user_recent 
  ON notifications(tenant_id, user_id, created_at DESC);
```

**Acceptance Criteria:**
- [ ] Migration applies cleanly
- [ ] Tables created with correct columns and types
- [ ] Indexes created
- [ ] Foreign keys reference tenants table

**Seed Expectations:** None (tables only)

### Task 0.2: Create Shared Visibility Spine Migration

**Purpose**: Create tables for platform health checks and findings

**Files to Create:**
- `supabase/migrations/20260129_002_create_shared_visibility_spine.sql`

**Migration Content:**
```sql
-- Create platform_health_checks table
CREATE TABLE platform_health_checks (
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

CREATE INDEX idx_health_checks_tenant_enabled 
  ON platform_health_checks(tenant_id, enabled);

-- Create platform_health_findings table
CREATE TABLE platform_health_findings (
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

CREATE INDEX idx_health_findings_tenant_status_severity 
  ON platform_health_findings(tenant_id, status, severity);
CREATE INDEX idx_health_findings_tenant_check 
  ON platform_health_findings(tenant_id, check_key, status);
```

**Acceptance Criteria:**
- [ ] Migration applies cleanly
- [ ] Tables created with composite foreign key
- [ ] Indexes created
- [ ] Unique constraint on (tenant_id, check_key)

**Seed Expectations:** None (tables only)

### Task 0.3: Create Shared Configuration Spine Migration

**Purpose**: Create tables for streams, module toggles, and scope defaults

**Files to Create:**
- `supabase/migrations/20260129_003_create_shared_config_spine.sql`

**Migration Content:**
```sql
-- Create streams table
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

CREATE UNIQUE INDEX idx_streams_tenant_default 
  ON streams(tenant_id) WHERE is_default = true;

-- Create module_toggles table
CREATE TABLE module_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  feature_area TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  readiness_state TEXT,
  UNIQUE(tenant_id, stream_id, feature_area)
);

CREATE INDEX idx_module_toggles_tenant_stream 
  ON module_toggles(tenant_id, stream_id);

-- Create scope_defaults table
CREATE TABLE scope_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  principal_type TEXT NOT NULL,
  principal_id TEXT NOT NULL,
  default_site_ids UUID[],
  default_stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
  default_dashboard_id UUID,
  UNIQUE(tenant_id, principal_type, principal_id)
);

CREATE INDEX idx_scope_defaults_tenant_principal 
  ON scope_defaults(tenant_id, principal_type, principal_id);
```

**Acceptance Criteria:**
- [ ] Migration applies cleanly
- [ ] Unique constraint ensures only one default stream per tenant
- [ ] Foreign keys properly configured
- [ ] Array column for default_site_ids works

**Seed Expectations:** None (tables only)

### Task 0.4: Create Shared Identity Spine Migration

**Purpose**: Create tables for user profiles, teams, and memberships

**Files to Create:**
- `supabase/migrations/20260129_004_create_shared_identity_spine.sql`

**Migration Content:**
```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  persona_label TEXT,
  preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_tenant 
  ON user_profiles(tenant_id);

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  on_call_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Create team_memberships table
CREATE TABLE team_memberships (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX idx_team_memberships_user 
  ON team_memberships(user_id);

-- Create responsibility_labels table
CREATE TABLE responsibility_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(tenant_id, code)
);
```

**Acceptance Criteria:**
- [ ] Migration applies cleanly
- [ ] Composite primary key on team_memberships
- [ ] Unique constraints on natural keys
- [ ] Indexes created

**Seed Expectations:** None (tables only)

### Task 0.5: Create Shared Integrations Spine Migration

**Purpose**: Create tables for integration types, instances, mappings, and health events

**Files to Create:**
- `supabase/migrations/20260129_005_create_shared_integrations_spine.sql`

**Migration Content:**
```sql
-- Create integration_types table (global catalog)
CREATE TABLE integration_types (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);

-- Create integrations table
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type_code TEXT NOT NULL REFERENCES integration_types(code),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'inactive',
  last_sync_at TIMESTAMPTZ,
  config JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_integrations_tenant_status 
  ON integrations(tenant_id, status);

-- Create integration_mappings table
CREATE TABLE integration_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  mapping JSONB
);

CREATE INDEX idx_integration_mappings_integration_site 
  ON integration_mappings(integration_id, site_id);

-- Create integration_health_events table
CREATE TABLE integration_health_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  details JSONB
);

CREATE INDEX idx_integration_health_tenant_integration_time 
  ON integration_health_events(tenant_id, integration_id, timestamp DESC);
```

**Acceptance Criteria:**
- [ ] Migration applies cleanly
- [ ] integration_types has no tenant_id (global catalog)
- [ ] Foreign keys properly configured
- [ ] Indexes support health event queries

**Seed Expectations:** None (tables only)

### Task 0.6: Create Overview Tables Migration

**Purpose**: Create Overview-specific tables (dashboards, widgets, exceptions, triage, advisor)

**Files to Create:**
- `supabase/migrations/20260129_006_create_overview_tables.sql`

**Migration Content:**
```sql
-- Create overview_dashboards table
CREATE TABLE overview_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  preset_type TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  scope_defaults JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

CREATE UNIQUE INDEX idx_overview_dashboards_tenant_default 
  ON overview_dashboards(tenant_id) WHERE is_default = true;

-- Create overview_widgets table
CREATE TABLE overview_widgets (
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
CREATE TABLE overview_dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES overview_dashboards(id) ON DELETE CASCADE,
  widget_id UUID NOT NULL REFERENCES overview_widgets(id) ON DELETE CASCADE,
  position JSONB NOT NULL,
  config JSONB,
  UNIQUE(dashboard_id, widget_id)
);

CREATE INDEX idx_dashboard_widgets_dashboard 
  ON overview_dashboard_widgets(dashboard_id);

-- Create overview_exceptions table
CREATE TABLE overview_exceptions (
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

CREATE INDEX idx_overview_exceptions_tenant_status_severity 
  ON overview_exceptions(tenant_id, status, severity);

-- Create overview_alert_triage table
CREATE TABLE overview_alert_triage (
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
CREATE TABLE advisor_cards (
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

CREATE INDEX idx_advisor_cards_tenant_severity 
  ON advisor_cards(tenant_id, severity);
```

**Acceptance Criteria:**
- [ ] Migration applies cleanly
- [ ] All tables created with proper relationships
- [ ] Unique constraints prevent duplicate dashboards/widgets
- [ ] Alert triage references existing alerts table

**Seed Expectations:** None (tables only)

### Task 0.7: Create Settings Tables Migration

**Purpose**: Create Settings-specific tables (tenant profile, programs, hierarchy, units, preferences)

**Files to Create:**
- `supabase/migrations/20260129_007_create_settings_tables.sql`

**Migration Content:**
```sql
-- Create tenant_profile table
CREATE TABLE tenant_profile (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  region TEXT,
  timezone TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  regulatory_profile JSONB
);

-- Create programs table
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);

-- Create naming_standards table
CREATE TABLE naming_standards (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  rules JSONB NOT NULL
);

-- Create site_hierarchy_nodes table
CREATE TABLE site_hierarchy_nodes (
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

CREATE INDEX idx_hierarchy_nodes_tenant_site_parent 
  ON site_hierarchy_nodes(tenant_id, site_id, parent_id);

-- Create tenant_units table
CREATE TABLE tenant_units (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  unit_system JSONB NOT NULL
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  defaults JSONB
);

-- Create notification_preferences table
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channels JSONB,
  digest_frequency TEXT,
  quiet_hours JSONB
);
```

**Acceptance Criteria:**
- [ ] Migration applies cleanly
- [ ] 1:1 extension tables use tenant_id/user_id as PK
- [ ] Hierarchy nodes support self-referential parent_id
- [ ] Path column supports materialized path queries

**Seed Expectations:** None (tables only)

### Task 0.8: Create Overview Views and Functions

**Purpose**: Create views for KPIs, top alerts, data freshness, and health score function

**Files to Create:**
- `supabase/migrations/20260129_008_create_overview_views.sql`

**Migration Content:**
```sql
-- Create v_overview_kpis view
CREATE OR REPLACE VIEW v_overview_kpis AS
SELECT 
  t.id AS tenant_id,
  COUNT(DISTINCT a.id) AS total_assets,
  COUNT(DISTINCT CASE WHEN al.status = 'active' THEN al.id END) AS active_alerts,
  COUNT(DISTINCT CASE WHEN al.status = 'active' AND al.severity = 'critical' THEN al.id END) AS critical_alerts,
  COUNT(DISTINCT CASE WHEN wi.status IN ('open', 'in_progress') THEN wi.id END) AS open_work_items,
  COUNT(DISTINCT CASE WHEN phf.status = 'open' AND phf.check_key = 'telemetry_freshness' THEN phf.id END) AS stale_telemetry_count,
  COALESCE(AVG(CASE 
    WHEN ihe.status = 'healthy' THEN 100
    WHEN ihe.status = 'degraded' THEN 50
    WHEN ihe.status = 'down' THEN 0
  END), 0) AS integration_health_score,
  NOW() AS last_updated
FROM tenants t
LEFT JOIN assets a ON a.tenant_id = t.id
LEFT JOIN alerts al ON al.tenant_id = t.id
LEFT JOIN work_items wi ON wi.tenant_id = t.id
LEFT JOIN platform_health_findings phf ON phf.tenant_id = t.id
LEFT JOIN LATERAL (
  SELECT DISTINCT ON (integration_id) status
  FROM integration_health_events
  WHERE tenant_id = t.id
  ORDER BY integration_id, timestamp DESC
) ihe ON true
GROUP BY t.id;

-- Create v_overview_top_alerts view
CREATE OR REPLACE VIEW v_overview_top_alerts AS
SELECT 
  a.*,
  ROW_NUMBER() OVER (
    PARTITION BY a.tenant_id 
    ORDER BY 
      CASE a.severity 
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      a.created_at DESC
  ) AS rank
FROM alerts a
WHERE a.status = 'active';

-- Create v_overview_data_freshness view
CREATE OR REPLACE VIEW v_overview_data_freshness AS
SELECT 
  tp.tenant_id,
  a.site_id,
  NULL::UUID AS stream_id,
  MAX(od.timestamp) AS last_telemetry_at,
  EXTRACT(EPOCH FROM (NOW() - MAX(od.timestamp))) / 60 AS staleness_minutes,
  CASE 
    WHEN MAX(od.timestamp) > NOW() - INTERVAL '15 minutes' THEN 'fresh'
    WHEN MAX(od.timestamp) > NOW() - INTERVAL '1 hour' THEN 'stale'
    ELSE 'critical'
  END AS status
FROM telemetry_points tp
JOIN assets a ON a.id = tp.asset_id
LEFT JOIN operational_data od ON od.telemetry_point_id = tp.id
GROUP BY tp.tenant_id, a.site_id;

-- Create fn_compute_platform_health_score function
CREATE OR REPLACE FUNCTION fn_compute_platform_health_score(p_tenant_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_integration_score NUMERIC;
  v_freshness_score NUMERIC;
  v_alert_score NUMERIC;
  v_final_score NUMERIC;
BEGIN
  -- Integration health (40% weight)
  SELECT COALESCE(AVG(CASE 
    WHEN status = 'healthy' THEN 100
    WHEN status = 'degraded' THEN 50
    ELSE 0
  END), 0) INTO v_integration_score
  FROM (
    SELECT DISTINCT ON (integration_id) status
    FROM integration_health_events
    WHERE tenant_id = p_tenant_id
    ORDER BY integration_id, timestamp DESC
  ) latest_health;
  
  -- Data freshness (30% weight)
  SELECT COALESCE(AVG(CASE 
    WHEN status = 'fresh' THEN 100
    WHEN status = 'stale' THEN 50
    ELSE 0
  END), 0) INTO v_freshness_score
  FROM v_overview_data_freshness
  WHERE tenant_id = p_tenant_id;
  
  -- Alert severity (30% weight)
  SELECT COALESCE(100 - (
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) * 10 +
    COUNT(CASE WHEN severity = 'high' THEN 1 END) * 5
  ), 100) INTO v_alert_score
  FROM alerts
  WHERE tenant_id = p_tenant_id AND status = 'active';
  
  v_final_score := (
    v_integration_score * 0.4 +
    v_freshness_score * 0.3 +
    v_alert_score * 0.3
  );
  
  RETURN GREATEST(0, LEAST(100, v_final_score));
END;
$$ LANGUAGE plpgsql;
```

**Acceptance Criteria:**
- [ ] Views created successfully
- [ ] Views return data for existing tenant
- [ ] Function executes without errors
- [ ] Function returns value between 0-100

**Seed Expectations:** None (views/functions only)

### Task 0.9: Enable RLS on All Tables

**Purpose**: Enable Row Level Security on all tenant-scoped tables

**Files to Create:**
- `supabase/migrations/20260129_009_enable_rls.sql`

**Migration Content:**
```sql
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
```

**Acceptance Criteria:**
- [ ] RLS enabled on all tenant-scoped tables
- [ ] Placeholder policies created
- [ ] Service role can still access all data
- [ ] No breaking changes to existing queries

**Seed Expectations:** None (RLS only)

---

## Checkpoint 0: Verify Migrations

**Verification Steps:**
1. Run `npx supabase db reset --linked`
2. Verify all migrations apply cleanly
3. Verify baseline data intact (tenants=1, sites=3, assets=15, etc.)
4. Verify all new tables exist
5. Verify all views return data
6. Verify function executes

**Expected State:**
- All Phase 0 migrations applied
- All tables created
- All views/functions working
- RLS enabled
- Baseline data unchanged

---

## Phase 1: Settings Foundations

### Task 1.1: Create Tenant Profile & Streams Seed

**Purpose**: Seed tenant profile, streams, and programs

**Files to Create:**
- `supabase/seed/090_settings_tenant_profile.sql`

**Seed Content:**
```sql
BEGIN;

-- Precondition: Ensure tenant exists
DO $$
DECLARE
  v_tenant_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tenant_count FROM tenants;
  IF v_tenant_count = 0 THEN
    RAISE EXCEPTION 'Precondition failed: No tenants found';
  END IF;
END $$;

-- Lookup CTE
WITH tenant_lookup AS (
  SELECT id, code FROM tenants LIMIT 1
),

-- Upsert tenant_profile
profile_upsert AS (
  INSERT INTO tenant_profile (tenant_id, logo_url, region, timezone, currency_code, regulatory_profile)
  SELECT 
    t.id,
    NULL,
    'North America',
    'America/New_York',
    'USD',
    '{"standards": ["NERC CIP", "IEEE 1547"]}'::jsonb
  FROM tenant_lookup t
  ON CONFLICT (tenant_id) DO UPDATE
  SET region = EXCLUDED.region,
      timezone = EXCLUDED.timezone,
      currency_code = EXCLUDED.currency_code
  RETURNING *
),

-- Upsert streams
stream_upsert AS (
  INSERT INTO streams (tenant_id, code, name, kind, status, is_default)
  SELECT t.id, code, name, kind, status, is_default
  FROM tenant_lookup t
  CROSS JOIN (VALUES
    ('MAIN', 'Main Production', 'production', 'active', true),
    ('PILOT', 'Pilot Program', 'pilot', 'active', false),
    ('RND', 'Research & Development', 'research', 'active', false)
  ) AS s(code, name, kind, status, is_default)
  ON CONFLICT (tenant_id, code) DO UPDATE
  SET name = EXCLUDED.name,
      kind = EXCLUDED.kind,
      status = EXCLUDED.status,
      is_default = EXCLUDED.is_default
  RETURNING *
),

-- Upsert programs
program_upsert AS (
  INSERT INTO programs (tenant_id, name, description, status)
  SELECT t.id, name, description, status
  FROM tenant_lookup t
  CROSS JOIN (VALUES
    ('Grid Modernization', 'Modernize transmission grid infrastructure', 'active'),
    ('Renewable Integration', 'Integrate renewable energy sources', 'active'),
    ('Asset Reliability', 'Improve asset reliability and uptime', 'active'),
    ('Cybersecurity Enhancement', 'Enhance cybersecurity posture', 'planned')
  ) AS p(name, description, status)
  ON CONFLICT (tenant_id, name) DO UPDATE
  SET description = EXCLUDED.description,
      status = EXCLUDED.status
  RETURNING *
)

SELECT 'Tenant profile, streams, and programs seeded' AS result;

-- Post-seed validation
DO $$
DECLARE
  v_profile_count INTEGER;
  v_stream_count INTEGER;
  v_program_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_profile_count FROM tenant_profile;
  SELECT COUNT(*) INTO v_stream_count FROM streams;
  SELECT COUNT(*) INTO v_program_count FROM programs;
  
  IF v_profile_count < 1 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 1 tenant_profile, got %', v_profile_count;
  END IF;
  
  IF v_stream_count < 3 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 3 streams, got %', v_stream_count;
  END IF;
  
  IF v_program_count < 2 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 2 programs, got %', v_program_count;
  END IF;
END $$;

COMMIT;
```

**Acceptance Criteria:**
- [ ] Seed runs successfully
- [ ] tenant_profile = 1
- [ ] streams >= 3
- [ ] programs >= 2
- [ ] One stream marked as default

**Seed Expectations:**
- tenant_profile: 1
- streams: 3
- programs: 4

### Task 1.2-1.5: Complete Settings Foundation Seeds

**Purpose**: Seed remaining Settings foundation data

**Files to Create:**
- `supabase/seed/091_settings_hierarchy_scope.sql` - Hierarchy nodes (20-40) and scope defaults (5)
- `supabase/seed/092_settings_users_teams.sql` - User profiles (8-15), teams (3-6), memberships, responsibilities (8-12)
- `supabase/seed/094_settings_defaults_modules.sql` - Tenant units (1), module toggles (20+)
- `supabase/seed/095_settings_user_prefs.sql` - User preferences (8-15), notification preferences (8-15)

**Acceptance Criteria:**
- [ ] All seed files follow CTE pattern with preconditions and validations
- [ ] All validation thresholds met per file
- [ ] Seeds are idempotent

---

## Phase 2: Overview Foundations

### Task 2.1-2.2: Create Overview Seeds

**Purpose**: Seed Overview dashboards, widgets, and exceptions

**Files to Create:**
- `supabase/seed/080_overview_dashboards.sql` - Dashboards (5 presets)
- `supabase/seed/081_overview_widgets.sql` - Widgets (10-20), dashboard links (20+)
- `supabase/seed/082_overview_exceptions.sql` - Exceptions (8-15)

**Acceptance Criteria:**
- [ ] 5 dashboard presets created (Ops, Reliability, Security, Energy, Executive)
- [ ] 10-20 widgets seeded
- [ ] 20+ dashboard-widget links created
- [ ] 8-15 exceptions seeded

---

## Phase 3: Work Items & Notifications

### Task 3.1: Create Work & Notification Seeds

**Purpose**: Seed work items and notifications

**Files to Create:**
- `supabase/seed/085_overview_work_notifications.sql` - Work items (12-25), notifications (20-40)

**Acceptance Criteria:**
- [ ] 12-25 work items seeded with deep links
- [ ] 20-40 notifications seeded
- [ ] Work items reference various feature areas

---

## Phase 4: Platform Health

### Task 4.1: Create Platform Health Seeds

**Purpose**: Seed health checks and findings

**Files to Create:**
- `supabase/seed/084_overview_platform_health.sql` - Health checks (6-10), findings (5-12)

**Acceptance Criteria:**
- [ ] 6-10 health checks seeded
- [ ] 5-12 health findings seeded (mix of open/resolved)

---

## Phase 5: Integrations & Advisor

### Task 5.1-5.2: Create Integration & Advisor Seeds

**Purpose**: Seed integrations and advisor cards

**Files to Create:**
- `supabase/seed/093_settings_integrations.sql` - Integration types (8-12), integrations (3-6), mappings, health events (10-20)
- `supabase/seed/086_overview_advisor_cards.sql` - Advisor cards (10-20)

**Acceptance Criteria:**
- [ ] 8-12 integration types seeded
- [ ] 3-6 integrations seeded
- [ ] 10-20 health events seeded
- [ ] 10-20 advisor cards seeded

---

## Checkpoint 1: Verify All Seeds

**Verification Steps:**
1. Run `npx supabase db reset --linked`
2. Verify all seed validation thresholds met
3. Query each table to confirm row counts

**Expected State:**
- All seed files executed successfully
- All validation thresholds met
- Baseline data unchanged

---

## Phase 6: Data Provider Implementation

### Task 6.1: Add TypeScript Types

**Purpose**: Define TypeScript interfaces for all new entities

**Files to Create/Modify:**
- `src/types/overview.ts` - Overview types (Dashboard, Widget, WorkItem, Notification, Exception, HealthCheck, HealthFinding, AdvisorCard)
- `src/types/settings.ts` - Settings types (TenantProfile, Stream, Program, Team, UserProfile, Integration, etc.)

**Acceptance Criteria:**
- [ ] All entity types defined
- [ ] Filter and update types defined
- [ ] Types exported properly

### Task 6.2: Implement SupabaseProvider Methods

**Purpose**: Implement data access methods for Overview & Settings

**Files to Modify:**
- `src/providers/SupabaseProvider.ts` (or equivalent)

**Methods to Implement:**
- Overview: getOverviewKPIs, getDashboards, getWorkItems, getNotifications, getExceptions, getHealthFindings, getAdvisorCards, updateAlertTriage, updateWorkItem, markNotificationRead
- Settings: getTenantProfile, updateTenantProfile, getStreams, createStream, updateStream, getPrograms, getUserProfiles, updateUserProfile, getTeams, getIntegrations, updateIntegration, getModuleToggles, updateModuleToggle, getUserPreferences, updateUserPreferences

**Acceptance Criteria:**
- [ ] All methods implemented with proper tenant_id scoping
- [ ] Error handling implemented
- [ ] Methods use views where appropriate (v_overview_kpis, etc.)

### Task 6.3: Update HybridProvider Routing

**Purpose**: Route Overview & Settings methods to SupabaseProvider

**Files to Modify:**
- `src/providers/HybridProvider.ts` (or equivalent)

**Acceptance Criteria:**
- [ ] Overview methods route to SupabaseProvider
- [ ] Settings methods route to SupabaseProvider
- [ ] Existing Upstream O&G methods still route to MockProvider
- [ ] No breaking changes

---

## Phase 7: Overview Pages Implementation

### Task 7.1: Implement Command Center Pages

**Files to Create:**
- `src/pages/overview/OverviewCommandCenterPage.tsx` - Main dashboard with KPIs
- `src/pages/overview/OverviewDashboardsPage.tsx` - Dashboard list

**Acceptance Criteria:**
- [ ] Command center displays KPIs from v_overview_kpis
- [ ] Dashboard list shows available dashboards
- [ ] nLVE pattern followed

### Task 7.2: Implement Alert & Exception Pages

**Files to Create:**
- `src/pages/overview/OverviewAlertsInboxPage.tsx` - Alert list
- `src/pages/overview/OverviewAlertSummaryPage.tsx` - Alert detail with "Open in Source"
- `src/pages/overview/OverviewExceptionsPage.tsx` - Exception list
- `src/pages/overview/OverviewExceptionDetailPage.tsx` - Exception detail

**Acceptance Criteria:**
- [ ] Alert inbox displays alerts from existing alerts table
- [ ] "Open in Source" button routes to correct feature area
- [ ] Exception list displays with filtering
- [ ] Deep links work correctly

### Task 7.3: Implement Health Pages

**Files to Create:**
- `src/pages/overview/PlatformHealthFindingsPage.tsx` - Health findings list
- `src/pages/overview/PlatformHealthFindingDetailPage.tsx` - Finding detail
- `src/pages/overview/DataStreamStatusPage.tsx` - Data stream status
- `src/pages/overview/DataStreamDetailPage.tsx` - Stream detail

**Acceptance Criteria:**
- [ ] Health findings display with severity filtering
- [ ] Data stream status shows freshness per site
- [ ] v_overview_data_freshness view used

### Task 7.4: Implement Work & Notification Pages

**Files to Create:**
- `src/pages/overview/MyWorklistPage.tsx` - User worklist
- `src/pages/overview/WorkItemDetailPage.tsx` - Work item detail with deep link
- `src/pages/overview/NotificationsCenterPage.tsx` - Notification feed

**Acceptance Criteria:**
- [ ] Worklist filters by assigned user
- [ ] Work item deep links route to source
- [ ] Notifications can be marked as read

### Task 7.5: Implement Advisor & Help Pages

**Files to Create:**
- `src/pages/overview/AdvisorCardsPage.tsx` - Advisor cards
- `src/pages/overview/RecommendedActionsPage.tsx` - Recommended actions
- `src/pages/overview/PlatformHelpChangeLogPage.tsx` - Help content

**Acceptance Criteria:**
- [ ] Advisor cards display with severity
- [ ] Deep links to actions work
- [ ] Help content renders

---

## Phase 8: Settings Pages Implementation

### Task 8.1: Implement Organization Pages

**Files to Create:**
- `src/pages/settings/SettingsOrganizationPage.tsx` - Tenant profile view/edit
- `src/pages/settings/SettingsStreamsProgramsPage.tsx` - Streams and programs list/edit
- `src/pages/settings/SettingsNamingStandardsPage.tsx` - Naming standards edit

**Acceptance Criteria:**
- [ ] Tenant profile displays and allows editing
- [ ] Streams list with view/edit capability
- [ ] One stream marked as default

### Task 8.2: Implement Sites & Hierarchy Pages

**Files to Create:**
- `src/pages/settings/SettingsSitesPage.tsx` - Sites list
- `src/pages/settings/SettingsOperationalHierarchyPage.tsx` - Hierarchy tree view/edit
- `src/pages/settings/SettingsScopeDefaultsPage.tsx` - Scope defaults edit

**Acceptance Criteria:**
- [ ] Sites list displays existing sites
- [ ] Hierarchy displays as tree structure
- [ ] Scope defaults editable per role/team/user

### Task 8.3: Implement Users & Teams Pages

**Files to Create:**
- `src/pages/settings/SettingsUsersTeamsPage.tsx` - Users and teams list
- `src/pages/settings/SettingsUserDetailPage.tsx` - User detail view
- `src/pages/settings/SettingsResponsibilitiesPage.tsx` - Responsibility labels

**Acceptance Criteria:**
- [ ] Users and teams list displays
- [ ] User detail shows profile and team memberships
- [ ] Responsibility labels manageable
- [ ] Link to Cybersecurity for permissions

### Task 8.4: Implement Integration Pages

**Files to Create:**
- `src/pages/settings/SettingsIntegrationsCatalogPage.tsx` - Integrations list
- `src/pages/settings/SettingsIntegrationDetailPage.tsx` - Integration detail with health
- `src/pages/settings/SettingsIntegrationConfigPage.tsx` - Integration config edit

**Acceptance Criteria:**
- [ ] Integrations list shows status and last sync
- [ ] Integration detail displays health events
- [ ] Configuration editable

### Task 8.5: Implement Platform Defaults Pages

**Files to Create:**
- `src/pages/settings/SettingsPlatformDefaultsPage.tsx` - Platform defaults view/edit
- `src/pages/settings/SettingsModulesTogglesPage.tsx` - Module toggles view/edit

**Acceptance Criteria:**
- [ ] Platform defaults (units, etc.) editable
- [ ] Module toggles display per stream
- [ ] Toggles can be enabled/disabled

### Task 8.6: Implement User Settings Pages

**Files to Create:**
- `src/pages/settings/SettingsMyProfilePage.tsx` - User profile view/edit
- `src/pages/settings/SettingsMyPreferencesPage.tsx` - User preferences edit
- `src/pages/settings/SettingsMyNotificationsPage.tsx` - Notification preferences edit
- `src/pages/settings/SettingsAccessibilityThemePage.tsx` - Accessibility settings

**Acceptance Criteria:**
- [ ] User can edit their profile
- [ ] Preferences (default site, stream, theme) editable
- [ ] Notification preferences (channels, frequency, quiet hours) editable
- [ ] Accessibility options available

---

## Phase 9: Routing & Navigation

### Task 9.1: Update Routing Configuration

**Purpose**: Add all Overview & Settings routes

**Files to Modify:**
- `src/App.tsx` (or routing config file)

**Routes to Add:**
- Overview: `/overview`, `/overview/dashboards`, `/overview/alerts`, `/overview/alerts/:id`, `/overview/exceptions`, `/overview/exceptions/:id`, `/overview/health/findings`, `/overview/health/findings/:id`, `/overview/health/streams`, `/overview/health/streams/:id`, `/overview/work`, `/overview/work/:id`, `/overview/notifications`, `/overview/advisor`, `/overview/recommended-actions`, `/overview/help`
- Settings: `/settings/organization`, `/settings/streams`, `/settings/naming-standards`, `/settings/sites`, `/settings/hierarchy`, `/settings/scope-defaults`, `/settings/users`, `/settings/users/:id`, `/settings/responsibilities`, `/settings/integrations`, `/settings/integrations/:id`, `/settings/integrations/:id/edit`, `/settings/platform-defaults`, `/settings/modules`, `/settings/me`, `/settings/me/preferences`, `/settings/me/notifications`, `/settings/me/accessibility`

**Acceptance Criteria:**
- [ ] All routes configured
- [ ] Route parameters work correctly
- [ ] Navigation between routes works

### Task 9.2: Update Navigation

**Purpose**: Add Overview & Settings to left nav

**Files to Modify:**
- `src/data/navigation.ts` (or equivalent)

**Acceptance Criteria:**
- [ ] Overview section added to nav with icon
- [ ] Settings section added to nav with icon
- [ ] Sub-navigation items configured
- [ ] Active route highlighting works

---

## Checkpoint 2: End-to-End Testing

**Verification Steps:**
1. Set `VITE_DATA_BACKEND=hybrid` in environment
2. Start dev server: `npm run dev`
3. Navigate to `/overview` - verify KPIs display
4. Navigate to `/overview/alerts` - verify alert list loads
5. Click an alert - verify detail page and "Open in Source" button
6. Navigate to `/overview/work` - verify worklist displays
7. Navigate to `/settings/organization` - verify tenant profile loads
8. Navigate to `/settings/streams` - verify streams list
9. Navigate to `/settings/users` - verify users list
10. Navigate to `/settings/integrations` - verify integrations list
11. Test editing a stream - verify save works
12. Test editing user preferences - verify save works

**Expected Results:**
- All pages render without errors
- Data loads from Supabase via SupabaseProvider
- Deep links navigate to correct feature areas
- Forms allow editing and persist changes
- No breaking changes to existing Upstream O&G pages
- No console errors

---

## Definition of Done

### Schema & Data Layer
- [ ] All 9 migrations applied cleanly to remote dev
- [ ] `npx supabase db reset --linked` completes successfully
- [ ] All seed validation thresholds met (see requirements.md section 4.6)
- [ ] Baseline data unchanged (tenants=1, sites=3, assets=15, alerts=12, etc.)
- [ ] All views return data (v_overview_kpis, v_overview_top_alerts, v_overview_data_freshness)
- [ ] Health score function executes and returns 0-100
- [ ] RLS enabled on all tenant-scoped tables

### Data Provider Layer
- [ ] All SupabaseProvider methods implemented (Overview + Settings)
- [ ] HybridProvider routes Overview/Settings to SupabaseProvider
- [ ] All queries properly scoped by tenant_id
- [ ] Error handling implemented for all methods
- [ ] Unit tests written for provider methods

### UI Layer
- [ ] All 17 Overview pages implemented and rendering
- [ ] All 18 Settings pages implemented and rendering
- [ ] All 35+ routes configured in routing
- [ ] Navigation updated with Overview and Settings sections
- [ ] nLVE pattern followed consistently across all pages
- [ ] Loading states implemented for all data fetching
- [ ] Error states implemented with user-friendly messages
- [ ] Empty states implemented with guidance

### Integration & Deep Linking
- [ ] "Open in Source" buttons route to correct feature area pages
- [ ] Work item deep links navigate to source systems
- [ ] Alert triage routing functional
- [ ] Exception source references work
- [ ] Advisor card deep links navigate correctly
- [ ] No breaking changes to existing Upstream O&G features

### Quality & Polish
- [ ] Accessibility standards met (WCAG AA)
- [ ] Keyboard navigation works throughout
- [ ] Screen reader support implemented
- [ ] Color contrast meets standards
- [ ] Responsive design works on tablet and desktop
- [ ] Forms validate input properly
- [ ] Data persists correctly to Supabase
- [ ] No console errors or warnings
- [ ] Performance acceptable (< 2s page load, < 500ms API calls)

### Documentation
- [ ] README updated with Overview & Settings information
- [ ] API documentation for new SupabaseProvider methods
- [ ] Seed data documented with expected counts
- [ ] Migration notes documented
- [ ] Deep linking patterns documented

---

**End of Implementation Tasks**
