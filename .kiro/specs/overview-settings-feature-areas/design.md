# Design Document: Overview & Settings Feature Areas

**Project:** Plant4.0 (Power → Transmission)  
**Feature:** Overview & Settings  
**Version:** 1.0  
**Last Updated:** 2026-01-29

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Overview   │  │   Settings   │  │  Other Areas │      │
│  │    Pages     │  │    Pages     │  │   (O&G)      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                   ┌────────▼────────┐                        │
│                   │ HybridProvider  │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│              ┌─────────────┴─────────────┐                  │
│              │                           │                  │
│     ┌────────▼────────┐       ┌─────────▼────────┐         │
│     │ SupabaseProvider│       │   MockProvider   │         │
│     │  (Overview &    │       │   (Upstream      │         │
│     │   Settings)     │       │     O&G)         │         │
│     └────────┬────────┘       └──────────────────┘         │
└──────────────┼─────────────────────────────────────────────┘
               │
        ┌──────▼──────┐
        │  Supabase   │
        │  (Remote)   │
        └─────────────┘
```

### 1.2 Data Flow

**Overview Pages:**
1. User navigates to Overview page (e.g., `/overview`)
2. React component calls HybridProvider method
3. HybridProvider routes to SupabaseProvider
4. SupabaseProvider queries Supabase views/tables
5. Data returned to component for rendering

**Settings Pages:**
1. User navigates to Settings page (e.g., `/settings/organization`)
2. React component calls HybridProvider method
3. HybridProvider routes to SupabaseProvider
4. SupabaseProvider queries/mutates Supabase tables
5. Data returned to component for rendering

**Deep Link Routing:**
1. User clicks "Open in Source" or work item deep link
2. React Router navigates to target feature area
3. Target feature area may use MockProvider or SupabaseProvider
4. Seamless transition between data sources

### 1.3 Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Routing**: React Router v6
- **UI Components**: shadcn/ui (existing)
- **State Management**: React Context + hooks
- **Data Layer**: Supabase Client
- **Database**: PostgreSQL (via Supabase)
- **Styling**: Tailwind CSS

---

## 2. Data Model Design

### 2.1 Entity Relationship Overview

```
Tenants (existing)
  ├─→ Tenant Profile (1:1)
  ├─→ Streams (1:N)
  ├─→ Programs (1:N)
  ├─→ Sites (1:N) [existing]
  │    └─→ Site Hierarchy Nodes (1:N)
  ├─→ User Profiles (1:N)
  │    ├─→ User Preferences (1:1)
  │    ├─→ Notification Preferences (1:1)
  │    └─→ Team Memberships (N:M via Teams)
  ├─→ Teams (1:N)
  ├─→ Scope Defaults (1:N)
  ├─→ Overview Dashboards (1:N)
  │    └─→ Dashboard Widgets (N:M via Overview Widgets)
  ├─→ Work Items (1:N)
  ├─→ Notifications (1:N)
  ├─→ Platform Health Checks (1:N)
  │    └─→ Platform Health Findings (1:N)
  ├─→ Overview Exceptions (1:N)
  ├─→ Advisor Cards (1:N)
  ├─→ Integrations (1:N)
  │    ├─→ Integration Mappings (1:N)
  │    └─→ Integration Health Events (1:N)
  └─→ Module Toggles (1:N)
```

### 2.2 Table Design Decisions

#### 2.2.1 Tables vs Views vs JSONB

**Use Tables When:**
- Entity has clear identity and lifecycle (e.g., `work_items`, `teams`)
- Entity requires referential integrity (foreign keys)
- Entity is frequently updated
- Entity needs to be queried independently

**Use Views When:**
- Data is derived from multiple tables (e.g., `v_overview_kpis`)
- Aggregations are complex and reused across UI
- Read-only access pattern
- Performance optimization via indexed base tables

**Use JSONB When:**
- Schema is flexible and varies by instance (e.g., `config`, `params`)
- Data is always accessed as a unit (no partial queries)
- Structure may evolve without migrations
- Examples: widget config, integration config, notification payload

#### 2.2.2 Natural Keys vs Surrogate Keys

**Primary Keys:**
- All tables use UUID surrogate keys (`id`)
- Exception: junction tables use composite PKs (e.g., `team_memberships`)
- Exception: 1:1 extension tables use FK as PK (e.g., `tenant_profile.tenant_id`)

**Natural Keys:**
- Enforced via unique constraints (e.g., `tenant_id + code` for streams)
- Used in seed data for deterministic resolution
- Examples: stream code, integration type code, widget key

### 2.3 Detailed Table Schemas

#### 2.3.1 Shared Routing & Attention Spine

**work_items**
```sql
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
```

**notifications**
```sql
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

#### 2.3.2 Shared Platform Visibility Spine

**platform_health_checks**
```sql
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
```

**platform_health_findings**
```sql
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

#### 2.3.3 Shared Configuration & Scoping Spine

**streams**
```sql
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
```

**module_toggles**
```sql
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
```

**scope_defaults**
```sql
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

#### 2.3.4 Shared Identity-Lite Collaboration Spine

**user_profiles**
```sql
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
```

**teams**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  on_call_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

**team_memberships**
```sql
CREATE TABLE team_memberships (
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

CREATE INDEX idx_team_memberships_user 
  ON team_memberships(user_id);
```

**responsibility_labels**
```sql
CREATE TABLE responsibility_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE(tenant_id, code)
);
```

#### 2.3.5 Shared Integrations Spine

**integration_types**
```sql
CREATE TABLE integration_types (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL
);
```

**integrations**
```sql
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
```

**integration_mappings**
```sql
CREATE TABLE integration_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE CASCADE,
  mapping JSONB
);

CREATE INDEX idx_integration_mappings_integration_site 
  ON integration_mappings(integration_id, site_id);
```

**integration_health_events**
```sql
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

#### 2.3.6 Overview-Specific Tables

**overview_dashboards**
```sql
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
```

**overview_widgets**
```sql
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
```

**overview_dashboard_widgets**
```sql
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
```

**overview_exceptions**
```sql
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
```

**overview_alert_triage**
```sql
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
```

**advisor_cards**
```sql
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

#### 2.3.7 Settings-Specific Tables

**tenant_profile**
```sql
CREATE TABLE tenant_profile (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  region TEXT,
  timezone TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  regulatory_profile JSONB
);
```

**programs**
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

**naming_standards**
```sql
CREATE TABLE naming_standards (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  rules JSONB NOT NULL
);
```

**site_hierarchy_nodes**
```sql
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
CREATE INDEX idx_hierarchy_nodes_path 
  ON site_hierarchy_nodes USING gin(path gin_trgm_ops);
```

**tenant_units**
```sql
CREATE TABLE tenant_units (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  unit_system JSONB NOT NULL
);
```

**user_preferences**
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  defaults JSONB
);
```

**notification_preferences**
```sql
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channels JSONB,
  digest_frequency TEXT,
  quiet_hours JSONB
);
```

### 2.4 View Designs

#### 2.4.1 v_overview_kpis

```sql
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
```

#### 2.4.2 v_overview_top_alerts

```sql
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
WHERE a.status = 'active'
QUALIFY rank <= 20;
```

#### 2.4.3 v_overview_data_freshness

```sql
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
```

#### 2.4.4 fn_compute_platform_health_score

```sql
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

### 2.5 RLS Strategy

#### 2.5.1 Phase 1: Enable RLS, Service Role Bypass

For this phase, we enable RLS on all tenant-scoped tables but rely on service role for access:

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_health_checks ENABLE ROW LEVEL SECURITY;
-- ... (repeat for all tenant-scoped tables)

-- Create placeholder policies (service role bypasses RLS)
CREATE POLICY "Service role bypass" ON work_items FOR ALL USING (true);
CREATE POLICY "Service role bypass" ON notifications FOR ALL USING (true);
-- ... (repeat for all tenant-scoped tables)
```

#### 2.5.2 Phase 2: JWT-Based Policies (Future)

In a future phase, implement tenant-scoped policies based on JWT claims:

```sql
-- Example future policy
CREATE POLICY "Users see own tenant data" ON work_items
  FOR SELECT
  USING (tenant_id = (current_setting('request.jwt.claims', true)::json->>'tenant_id')::uuid);
```

### 2.6 Index Strategy

**Indexing Principles:**
1. All tenant-scoped queries include `tenant_id` as first index column
2. Status/state columns frequently filtered get composite indexes
3. Timestamp columns for sorting get DESC indexes
4. Foreign keys automatically indexed
5. JSONB columns use GIN indexes where queried

**Key Indexes:**
- `(tenant_id, status, severity)` - for filtering exceptions, findings, alerts
- `(tenant_id, user_id, created_at DESC)` - for notification feeds
- `(tenant_id, assigned_to_user_id, status)` - for worklists
- `(tenant_id, integration_id, timestamp DESC)` - for health event history
- `(tenant_id, site_id, path)` - for hierarchy queries

---

## 3. UI Design Patterns

### 3.1 nLVE Pattern Implementation

**Navigate (N):**
- Left sidebar navigation with Overview and Settings sections
- Breadcrumb navigation for deep pages
- Quick access via command palette (future)

**List (L):**
- Table or card-based list views
- Filtering, sorting, search capabilities
- Pagination for large datasets
- Empty states with guidance

**View (V):**
- Detail pane showing entity information
- Related data in tabs or sections
- Action buttons (Edit, Delete, etc.)
- Deep link buttons where applicable

**Edit (E):**
- Inline editing or modal forms
- Form validation with clear error messages
- Save/Cancel actions
- Optimistic UI updates

### 3.2 Page Routing Map

#### 3.2.1 Overview Routes

| Route | Component | Purpose | nLVE Stage |
|-------|-----------|---------|------------|
| `/overview` | OverviewCommandCenterPage | Main command center dashboard | View |
| `/overview/dashboards` | OverviewDashboardsPage | List of available dashboards | List |
| `/overview/dashboards/:id/edit` | OverviewDashboardEditPage | Edit dashboard configuration | Edit |
| `/overview/alerts` | OverviewAlertsInboxPage | Unified alert inbox | List |
| `/overview/alerts/:id` | OverviewAlertSummaryPage | Alert detail with deep link | View |
| `/overview/exceptions` | OverviewExceptionsPage | Operational exceptions list | List |
| `/overview/exceptions/:id` | OverviewExceptionDetailPage | Exception detail | View |
| `/overview/health/findings` | PlatformHealthFindingsPage | Health findings list | List |
| `/overview/health/findings/:id` | PlatformHealthFindingDetailPage | Finding detail | View |
| `/overview/health/streams` | DataStreamStatusPage | Data stream status | List |
| `/overview/health/streams/:id` | DataStreamDetailPage | Stream detail | View |
| `/overview/work` | MyWorklistPage | User worklist | List |
| `/overview/work/:id` | WorkItemDetailPage | Work item detail | View |
| `/overview/notifications` | NotificationsCenterPage | Notification feed | List |
| `/overview/advisor` | AdvisorCardsPage | Advisor cards | List |
| `/overview/recommended-actions` | RecommendedActionsPage | Recommended actions | List |
| `/overview/help` | PlatformHelpChangeLogPage | Help and changelog | View |

#### 3.2.2 Settings Routes

| Route | Component | Purpose | nLVE Stage |
|-------|-----------|---------|------------|
| `/settings/organization` | SettingsOrganizationPage | Tenant profile | View/Edit |
| `/settings/streams` | SettingsStreamsProgramsPage | Streams and programs | List/View/Edit |
| `/settings/naming-standards` | SettingsNamingStandardsPage | Naming conventions | Edit |
| `/settings/sites` | SettingsSitesPage | Sites management | List/View/Edit |
| `/settings/hierarchy` | SettingsOperationalHierarchyPage | Operational hierarchy | List/View/Edit |
| `/settings/scope-defaults` | SettingsScopeDefaultsPage | Scope defaults | Edit |
| `/settings/users` | SettingsUsersTeamsPage | Users and teams | List/View/Edit |
| `/settings/users/:id` | SettingsUserDetailPage | User detail | View |
| `/settings/responsibilities` | SettingsResponsibilitiesPage | Responsibility labels | List/Edit |
| `/settings/integrations` | SettingsIntegrationsCatalogPage | Integrations catalog | List |
| `/settings/integrations/:id` | SettingsIntegrationDetailPage | Integration detail | View |
| `/settings/integrations/:id/edit` | SettingsIntegrationConfigPage | Integration config | Edit |
| `/settings/platform-defaults` | SettingsPlatformDefaultsPage | Platform defaults | View/Edit |
| `/settings/modules` | SettingsModulesTogglesPage | Module toggles | View/Edit |
| `/settings/me` | SettingsMyProfilePage | User profile | View/Edit |
| `/settings/me/preferences` | SettingsMyPreferencesPage | User preferences | Edit |
| `/settings/me/notifications` | SettingsMyNotificationsPage | Notification settings | Edit |
| `/settings/me/accessibility` | SettingsAccessibilityThemePage | Accessibility & theme | Edit |

### 3.3 Widget Strategy

#### 3.3.1 Curated Widgets (Phase 1)

Widgets are pre-defined and curated by the platform. Each widget has:
- `widget_key`: Unique identifier (e.g., 'kpi_total_assets', 'alert_summary')
- `source_feature_area`: Which feature area provides the data
- `config`: JSONB for widget-specific settings (filters, display options)

**Example Widgets:**
1. **KPI Widgets**: Total Assets, Active Alerts, Open Work Items, Data Freshness
2. **Alert Widgets**: Top Alerts by Severity, Recent Alerts, Alert Trends
3. **Health Widgets**: Integration Status, Telemetry Freshness, Platform Health Score
4. **Work Widgets**: My Tasks, Team Tasks, Overdue Items
5. **Exception Widgets**: Stale Telemetry, Missing Metadata, Integration Issues

#### 3.3.2 Widget Configuration (Phase 1 Limited)

Users can:
- Toggle widget visibility on/off
- Adjust basic filters (site, stream, time range)
- Reorder widgets (position JSONB)

Users cannot:
- Create fully custom widgets (Phase 2)
- Modify widget data sources
- Create complex aggregations

#### 3.3.3 Widget Data Resolution

Each widget type has a corresponding data resolver function:

```typescript
// Example widget resolver interface
interface WidgetResolver {
  widgetKey: string;
  resolve: (config: WidgetConfig, context: UserContext) => Promise<WidgetData>;
}

// Example KPI widget resolver
const kpiTotalAssetsResolver: WidgetResolver = {
  widgetKey: 'kpi_total_assets',
  resolve: async (config, context) => {
    const kpis = await supabaseProvider.getOverviewKPIs(context.tenantId);
    return {
      value: kpis.total_assets,
      label: 'Total Assets',
      trend: calculateTrend(kpis.total_assets, config.comparisonPeriod)
    };
  }
};
```

### 3.4 Component Architecture

#### 3.4.1 Page Component Structure

```
OverviewCommandCenterPage
├── DashboardHeader (breadcrumb, filters, actions)
├── DashboardGrid (widget layout)
│   ├── KPIWidget (total assets)
│   ├── KPIWidget (active alerts)
│   ├── AlertSummaryWidget
│   ├── HealthScoreWidget
│   └── WorkItemsWidget
└── DashboardFooter (last updated, refresh)
```

#### 3.4.2 Reusable Components

**List Components:**
- `EntityList<T>` - Generic list with filtering/sorting
- `AlertList` - Specialized alert list (already exists)
- `WorkItemList` - Work item list with status badges
- `NotificationList` - Notification feed

**Detail Components:**
- `EntityDetail<T>` - Generic detail view
- `AlertDetail` - Alert detail with deep link (already exists)
- `WorkItemDetail` - Work item detail with source link
- `IntegrationDetail` - Integration detail with health history

**Form Components:**
- `EntityForm<T>` - Generic form with validation
- `StreamForm` - Stream configuration form
- `IntegrationForm` - Integration configuration form
- `PreferencesForm` - User preferences form

**Widget Components:**
- `BaseWidget` - Base widget wrapper
- `KPIWidget` - KPI display widget
- `ChartWidget` - Chart visualization widget
- `ListWidget` - List display widget
- `StatusWidget` - Status indicator widget

---

## 4. Integration Points

### 4.1 Overview → Other Feature Areas

**Alert Integration:**
- Overview reads from existing `alerts` table
- "Open in Source" button routes to feature-specific alert pages
- Example: `/overview/alerts/123` → `/monitoring/alerts/123`

**Work Item Integration:**
- Work items store `source_feature_area`, `source_table`, `source_id`
- Deep link constructed: `/{source_feature_area}/{source_table}/{source_id}`
- Example: work item from monitoring → `/monitoring/condition-monitoring/456`

**Health Check Integration:**
- Health checks can reference any feature area
- Findings link back to source via `details` JSONB
- Example: stale telemetry finding → `/monitoring/telemetry-points`

### 4.2 Settings → Cybersecurity Feature Area

**Policy Enforcement:**
- Settings pages display user/team/role information
- Settings pages do NOT enforce permissions
- "Manage Permissions" buttons link to Cybersecurity pages
- Example: `/settings/users/123` → "Manage Permissions" → `/security/user-roles/123`

**Audit Logging:**
- Settings changes should trigger audit events (future)
- Audit log viewing handled by Cybersecurity feature area
- Link from Settings to `/security/audit-log` with filters

### 4.3 HybridProvider Routing Logic

```typescript
class HybridProvider implements DataProvider {
  private supabaseProvider: SupabaseProvider;
  private mockProvider: MockProvider;

  // Overview methods route to Supabase
  async getOverviewKPIs(tenantId: string) {
    return this.supabaseProvider.getOverviewKPIs(tenantId);
  }

  async getWorkItems(tenantId: string, filters: WorkItemFilters) {
    return this.supabaseProvider.getWorkItems(tenantId, filters);
  }

  // Settings methods route to Supabase
  async getStreams(tenantId: string) {
    return this.supabaseProvider.getStreams(tenantId);
  }

  async updateTenantProfile(tenantId: string, profile: TenantProfile) {
    return this.supabaseProvider.updateTenantProfile(tenantId, profile);
  }

  // Legacy Upstream O&G methods route to Mock
  async getUpstreamAssets() {
    return this.mockProvider.getUpstreamAssets();
  }
}
```

### 4.4 Deep Link Construction

**Pattern:**
```typescript
interface DeepLinkConfig {
  featureArea: string;
  resourceType: string;
  resourceId: string;
  action?: string;
}

function constructDeepLink(config: DeepLinkConfig): string {
  const base = `/${config.featureArea}/${config.resourceType}/${config.resourceId}`;
  return config.action ? `${base}/${config.action}` : base;
}

// Example usage
const alertDeepLink = constructDeepLink({
  featureArea: 'monitoring',
  resourceType: 'alerts',
  resourceId: '123'
}); // Result: /monitoring/alerts/123
```

---

## 5. Seed Pack Strategy

### 5.1 Seed File Organization

**Naming Convention:**
- `080_overview_dashboards.sql` - Overview dashboards and presets
- `081_overview_widgets.sql` - Widget catalog and dashboard links
- `082_overview_exceptions.sql` - Exception examples
- `083_overview_triage_states.sql` - Triage state examples (optional)
- `084_overview_platform_health.sql` - Health checks and findings
- `085_overview_work_notifications.sql` - Work items and notifications
- `086_overview_advisor_cards.sql` - Advisor cards
- `090_settings_tenant_profile.sql` - Tenant profile and streams
- `091_settings_hierarchy_scope.sql` - Hierarchy nodes and scope defaults
- `092_settings_users_teams.sql` - Users, teams, memberships, responsibilities
- `093_settings_integrations.sql` - Integration types, instances, mappings, health
- `094_settings_defaults_modules.sql` - Tenant units and module toggles
- `095_settings_user_prefs.sql` - User preferences and notification settings

### 5.2 Seed File Template

```sql
-- 080_overview_dashboards.sql
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

-- Lookup CTE for tenant resolution
WITH tenant_lookup AS (
  SELECT id, code FROM tenants WHERE code = 'ACME_POWER'
),

-- Upsert dashboards
dashboard_upsert AS (
  INSERT INTO overview_dashboards (tenant_id, name, preset_type, is_default, scope_defaults)
  SELECT 
    t.id,
    'Operations Command Center',
    'ops',
    true,
    '{"default_stream_id": null}'::jsonb
  FROM tenant_lookup t
  ON CONFLICT (tenant_id, name) DO UPDATE
  SET preset_type = EXCLUDED.preset_type,
      is_default = EXCLUDED.is_default
  RETURNING *
)

SELECT * FROM dashboard_upsert;

-- Post-seed validation
DO $$
DECLARE
  v_dashboard_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_dashboard_count FROM overview_dashboards;
  IF v_dashboard_count < 5 THEN
    RAISE EXCEPTION 'Validation failed: Expected >= 5 dashboards, got %', v_dashboard_count;
  END IF;
END $$;

COMMIT;
```

### 5.3 Seed Data Validation Strategy

**Validation Levels:**

1. **Precondition Checks** (before insert):
   - Tenant exists
   - Required reference data exists (sites, asset_types, etc.)
   - No conflicting data

2. **Post-Insert Validation** (after insert):
   - Row count thresholds met
   - Required relationships established
   - Data integrity constraints satisfied

3. **Cross-Seed Validation** (after all seeds):
   - All foreign keys valid
   - No orphaned records
   - Aggregate counts match expectations

**Example Validation Query:**
```sql
-- Validate all Overview & Settings seed data
SELECT 
  'overview_dashboards' AS table_name, COUNT(*) AS count, 5 AS expected_min
FROM overview_dashboards
UNION ALL
SELECT 'overview_widgets', COUNT(*), 10 FROM overview_widgets
UNION ALL
SELECT 'work_items', COUNT(*), 12 FROM work_items
UNION ALL
SELECT 'streams', COUNT(*), 3 FROM streams
UNION ALL
SELECT 'user_profiles', COUNT(*), 8 FROM user_profiles
UNION ALL
SELECT 'teams', COUNT(*), 3 FROM teams
UNION ALL
SELECT 'integrations', COUNT(*), 3 FROM integrations;
```

### 5.4 Idempotency Strategy

**Approaches by Table Type:**

1. **Unique Constraint Tables** (tenant_id + natural_key):
   - Use `ON CONFLICT (tenant_id, code) DO UPDATE`
   - Example: streams, integration_types, widgets

2. **No Unique Constraint Tables**:
   - Use `WHERE NOT EXISTS` in CTE
   - Example: work_items, notifications, health_findings

3. **1:1 Extension Tables**:
   - Use `ON CONFLICT (tenant_id) DO UPDATE`
   - Example: tenant_profile, tenant_units

**Example Idempotent Insert:**
```sql
-- Idempotent stream insert
INSERT INTO streams (tenant_id, code, name, kind, status, is_default)
SELECT t.id, 'MAIN', 'Main Production', 'production', 'active', true
FROM tenants t
WHERE t.code = 'ACME_POWER'
ON CONFLICT (tenant_id, code) DO UPDATE
SET name = EXCLUDED.name,
    kind = EXCLUDED.kind,
    status = EXCLUDED.status;
```

---

## 6. SupabaseProvider Method Design

### 6.1 Overview Methods

```typescript
interface OverviewProvider {
  // Dashboard methods
  getOverviewKPIs(tenantId: string): Promise<OverviewKPIs>;
  getDashboards(tenantId: string): Promise<Dashboard[]>;
  getDashboard(dashboardId: string): Promise<Dashboard>;
  getDashboardWidgets(dashboardId: string): Promise<DashboardWidget[]>;
  
  // Alert methods
  getAlertsInbox(tenantId: string, filters: AlertFilters): Promise<Alert[]>;
  getAlertTriage(alertId: string): Promise<AlertTriage | null>;
  updateAlertTriage(alertId: string, triage: AlertTriageUpdate): Promise<AlertTriage>;
  
  // Exception methods
  getExceptions(tenantId: string, filters: ExceptionFilters): Promise<Exception[]>;
  getException(exceptionId: string): Promise<Exception>;
  updateException(exceptionId: string, update: ExceptionUpdate): Promise<Exception>;
  
  // Health methods
  getHealthChecks(tenantId: string): Promise<HealthCheck[]>;
  getHealthFindings(tenantId: string, filters: FindingFilters): Promise<HealthFinding[]>;
  getHealthFinding(findingId: string): Promise<HealthFinding>;
  getDataStreamStatus(tenantId: string): Promise<DataStreamStatus[]>;
  getPlatformHealthScore(tenantId: string): Promise<number>;
  
  // Work & Notification methods
  getWorkItems(tenantId: string, filters: WorkItemFilters): Promise<WorkItem[]>;
  getWorkItem(workItemId: string): Promise<WorkItem>;
  updateWorkItem(workItemId: string, update: WorkItemUpdate): Promise<WorkItem>;
  getNotifications(userId: string, filters: NotificationFilters): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  
  // Advisor methods
  getAdvisorCards(tenantId: string): Promise<AdvisorCard[]>;
}
```

### 6.2 Settings Methods

```typescript
interface SettingsProvider {
  // Tenant & Organization
  getTenantProfile(tenantId: string): Promise<TenantProfile>;
  updateTenantProfile(tenantId: string, profile: TenantProfileUpdate): Promise<TenantProfile>;
  getStreams(tenantId: string): Promise<Stream[]>;
  createStream(tenantId: string, stream: StreamCreate): Promise<Stream>;
  updateStream(streamId: string, update: StreamUpdate): Promise<Stream>;
  getPrograms(tenantId: string): Promise<Program[]>;
  getNamingStandards(tenantId: string): Promise<NamingStandards>;
  updateNamingStandards(tenantId: string, standards: NamingStandards): Promise<NamingStandards>;
  
  // Sites & Hierarchy
  getSites(tenantId: string): Promise<Site[]>;
  getHierarchyNodes(tenantId: string, siteId?: string): Promise<HierarchyNode[]>;
  createHierarchyNode(node: HierarchyNodeCreate): Promise<HierarchyNode>;
  getScopeDefaults(tenantId: string): Promise<ScopeDefault[]>;
  updateScopeDefault(id: string, update: ScopeDefaultUpdate): Promise<ScopeDefault>;
  
  // Users & Teams
  getUserProfiles(tenantId: string): Promise<UserProfile[]>;
  getUserProfile(userId: string): Promise<UserProfile>;
  updateUserProfile(userId: string, update: UserProfileUpdate): Promise<UserProfile>;
  getTeams(tenantId: string): Promise<Team[]>;
  getTeamMemberships(teamId: string): Promise<TeamMembership[]>;
  getResponsibilityLabels(tenantId: string): Promise<ResponsibilityLabel[]>;
  
  // Integrations
  getIntegrationTypes(): Promise<IntegrationType[]>;
  getIntegrations(tenantId: string): Promise<Integration[]>;
  getIntegration(integrationId: string): Promise<Integration>;
  updateIntegration(integrationId: string, update: IntegrationUpdate): Promise<Integration>;
  getIntegrationMappings(integrationId: string): Promise<IntegrationMapping[]>;
  getIntegrationHealthEvents(integrationId: string, limit?: number): Promise<IntegrationHealthEvent[]>;
  
  // Platform Defaults
  getTenantUnits(tenantId: string): Promise<TenantUnits>;
  updateTenantUnits(tenantId: string, units: TenantUnits): Promise<TenantUnits>;
  getModuleToggles(tenantId: string, streamId?: string): Promise<ModuleToggle[]>;
  updateModuleToggle(id: string, enabled: boolean): Promise<ModuleToggle>;
  
  // User Settings
  getUserPreferences(userId: string): Promise<UserPreferences>;
  updateUserPreferences(userId: string, prefs: UserPreferences): Promise<UserPreferences>;
  getNotificationPreferences(userId: string): Promise<NotificationPreferences>;
  updateNotificationPreferences(userId: string, prefs: NotificationPreferences): Promise<NotificationPreferences>;
}
```

### 6.3 Example Method Implementation

```typescript
// Example: getOverviewKPIs
async getOverviewKPIs(tenantId: string): Promise<OverviewKPIs> {
  const { data, error } = await this.supabase
    .from('v_overview_kpis')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) throw new Error(`Failed to fetch KPIs: ${error.message}`);
  
  return {
    totalAssets: data.total_assets,
    activeAlerts: data.active_alerts,
    criticalAlerts: data.critical_alerts,
    openWorkItems: data.open_work_items,
    staleTelemetryCount: data.stale_telemetry_count,
    integrationHealthScore: data.integration_health_score,
    lastUpdated: data.last_updated
  };
}

// Example: getWorkItems with filtering
async getWorkItems(
  tenantId: string, 
  filters: WorkItemFilters
): Promise<WorkItem[]> {
  let query = this.supabase
    .from('work_items')
    .select('*')
    .eq('tenant_id', tenantId);

  if (filters.assignedToUserId) {
    query = query.eq('assigned_to_user_id', filters.assignedToUserId);
  }

  if (filters.status) {
    query = query.in('status', filters.status);
  }

  if (filters.priority) {
    query = query.in('priority', filters.priority);
  }

  query = query.order('due_at', { ascending: true, nullsFirst: false });

  const { data, error } = await query;

  if (error) throw new Error(`Failed to fetch work items: ${error.message}`);
  
  return data.map(this.mapWorkItem);
}

// Example: updateAlertTriage
async updateAlertTriage(
  alertId: string, 
  triage: AlertTriageUpdate
): Promise<AlertTriage> {
  const { data, error } = await this.supabase
    .from('overview_alert_triage')
    .upsert({
      alert_id: alertId,
      state: triage.state,
      routed_to_feature_area: triage.routedToFeatureArea,
      routed_to_ref: triage.routedToRef,
      updated_by: triage.updatedBy,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to update triage: ${error.message}`);
  
  return this.mapAlertTriage(data);
}
```

---

## 7. Migration Strategy

### 7.1 Migration File Organization

**Naming Convention:**
- `20260129_001_create_shared_routing_spine.sql` - Work items, notifications
- `20260129_002_create_shared_visibility_spine.sql` - Health checks, findings
- `20260129_003_create_shared_config_spine.sql` - Streams, module toggles, scope defaults
- `20260129_004_create_shared_identity_spine.sql` - User profiles, teams, memberships
- `20260129_005_create_shared_integrations_spine.sql` - Integration types, instances, mappings
- `20260129_006_create_overview_tables.sql` - Dashboards, widgets, exceptions, triage, advisor
- `20260129_007_create_settings_tables.sql` - Tenant profile, programs, hierarchy, units, prefs
- `20260129_008_create_overview_views.sql` - KPI views, data freshness, health score function
- `20260129_009_enable_rls.sql` - Enable RLS on all tenant-scoped tables

### 7.2 Migration Dependencies

```
Existing baseline (tenants, sites, assets, alerts)
  ↓
Shared spines (routing, visibility, config, identity, integrations)
  ↓
Overview tables (dashboards, widgets, exceptions, triage, advisor)
  ↓
Settings tables (tenant profile, programs, hierarchy, units, prefs)
  ↓
Views and functions (v_overview_kpis, fn_compute_platform_health_score)
  ↓
RLS policies
```

### 7.3 Reversible Migrations

Each migration must include a DOWN migration:

```sql
-- UP migration
CREATE TABLE work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... columns
);

-- DOWN migration (in separate file or same file with comment)
DROP TABLE IF EXISTS work_items CASCADE;
```

### 7.4 Migration Testing Checklist

Before applying migrations to remote:
- [ ] Test on local Supabase instance
- [ ] Verify `npx supabase db reset` completes
- [ ] Verify all foreign keys resolve
- [ ] Verify indexes created
- [ ] Verify RLS enabled
- [ ] Verify views return data
- [ ] Verify functions execute without errors
- [ ] Verify seed data loads successfully
- [ ] Verify baseline data unchanged

---

## 8. Performance Considerations

### 8.1 Query Optimization

**Strategies:**
1. **Use Views for Complex Aggregations**: Avoid computing KPIs in UI code
2. **Proper Indexing**: All tenant-scoped queries use indexed columns
3. **Pagination**: List views paginate large datasets
4. **Selective Loading**: Load only required columns with `.select()`
5. **Caching**: Cache dashboard configurations and widget metadata

**Example Optimized Query:**
```typescript
// Bad: Load all columns, no pagination
const { data } = await supabase
  .from('work_items')
  .select('*')
  .eq('tenant_id', tenantId);

// Good: Select specific columns, paginate, use index
const { data } = await supabase
  .from('work_items')
  .select('id, title, status, priority, due_at, assigned_to_user_id')
  .eq('tenant_id', tenantId)
  .eq('status', 'open')
  .order('due_at', { ascending: true })
  .range(0, 49); // First 50 items
```

### 8.2 Index Coverage Analysis

**Critical Queries:**
1. **Worklist Query**: `WHERE tenant_id = ? AND assigned_to_user_id = ? AND status IN (?)`
   - Index: `(tenant_id, assigned_to_user_id, status)`

2. **Alert Inbox Query**: `WHERE tenant_id = ? AND status = 'active' ORDER BY severity, created_at DESC`
   - Index: `(tenant_id, status, severity, created_at DESC)`

3. **Notification Feed Query**: `WHERE tenant_id = ? AND user_id = ? AND read_at IS NULL ORDER BY created_at DESC`
   - Index: `(tenant_id, user_id, read_at, created_at DESC)`

4. **Health Findings Query**: `WHERE tenant_id = ? AND status = 'open' ORDER BY severity, last_seen DESC`
   - Index: `(tenant_id, status, severity, last_seen DESC)`

### 8.3 View Materialization Strategy

**Phase 1: Regular Views**
- Use regular views for `v_overview_kpis`, `v_overview_top_alerts`, `v_overview_data_freshness`
- Acceptable for moderate data volumes (< 100k rows per table)

**Phase 2: Materialized Views (Future)**
- If performance degrades, convert to materialized views
- Refresh strategy: on-demand or scheduled (every 5-15 minutes)
- Trade-off: Slightly stale data for better query performance

```sql
-- Future materialized view example
CREATE MATERIALIZED VIEW mv_overview_kpis AS
SELECT * FROM v_overview_kpis;

CREATE UNIQUE INDEX ON mv_overview_kpis(tenant_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_overview_kpis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_overview_kpis;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Error Handling & Edge Cases

### 9.1 Data Provider Error Handling

```typescript
class SupabaseProvider {
  private handleError(operation: string, error: any): never {
    console.error(`SupabaseProvider.${operation} failed:`, error);
    
    // Map Supabase errors to application errors
    if (error.code === 'PGRST116') {
      throw new NotFoundError(`Resource not found in ${operation}`);
    }
    
    if (error.code === '23505') {
      throw new ConflictError(`Duplicate resource in ${operation}`);
    }
    
    if (error.code === '23503') {
      throw new ReferenceError(`Invalid reference in ${operation}`);
    }
    
    throw new DataProviderError(`${operation} failed: ${error.message}`);
  }

  async getWorkItem(workItemId: string): Promise<WorkItem> {
    try {
      const { data, error } = await this.supabase
        .from('work_items')
        .select('*')
        .eq('id', workItemId)
        .single();

      if (error) this.handleError('getWorkItem', error);
      if (!data) throw new NotFoundError(`Work item ${workItemId} not found`);
      
      return this.mapWorkItem(data);
    } catch (error) {
      if (error instanceof DataProviderError) throw error;
      this.handleError('getWorkItem', error);
    }
  }
}
```

### 9.2 UI Error States

**Error Boundary Strategy:**
```typescript
// Page-level error boundary
<ErrorBoundary fallback={<PageErrorFallback />}>
  <OverviewCommandCenterPage />
</ErrorBoundary>

// Widget-level error boundary
<ErrorBoundary fallback={<WidgetErrorFallback widgetName="KPI" />}>
  <KPIWidget config={config} />
</ErrorBoundary>
```

**Error Display Components:**
- `PageErrorFallback` - Full page error with retry
- `WidgetErrorFallback` - Widget-level error, doesn't break page
- `InlineError` - Inline error message for forms
- `Toast` - Transient error notifications

### 9.3 Edge Cases

**Empty States:**
- No dashboards configured → Show "Create your first dashboard" prompt
- No work items → Show "All caught up!" message
- No notifications → Show "No new notifications" message
- No integrations → Show "Connect your first integration" guide

**Missing References:**
- Work item with invalid source_id → Show "Source no longer available"
- Alert triage with deleted alert → Handle gracefully, show archived state
- Scope default with deleted stream → Fall back to tenant default

**Concurrent Updates:**
- Optimistic UI updates with rollback on error
- Show "This item was updated by another user" message
- Offer to reload or merge changes

---

## 10. Testing Strategy

### 10.1 Unit Testing

**Data Provider Tests:**
```typescript
describe('SupabaseProvider.getWorkItems', () => {
  it('should fetch work items for tenant', async () => {
    const provider = new SupabaseProvider(mockSupabaseClient);
    const items = await provider.getWorkItems('tenant-123', {});
    expect(items).toHaveLength(12);
  });

  it('should filter by assigned user', async () => {
    const provider = new SupabaseProvider(mockSupabaseClient);
    const items = await provider.getWorkItems('tenant-123', {
      assignedToUserId: 'user-456'
    });
    expect(items.every(item => item.assignedToUserId === 'user-456')).toBe(true);
  });

  it('should handle not found error', async () => {
    const provider = new SupabaseProvider(mockSupabaseClient);
    await expect(provider.getWorkItem('invalid-id'))
      .rejects.toThrow(NotFoundError);
  });
});
```

**Component Tests:**
```typescript
describe('OverviewCommandCenterPage', () => {
  it('should render KPI widgets', async () => {
    render(<OverviewCommandCenterPage />);
    await waitFor(() => {
      expect(screen.getByText('Total Assets')).toBeInTheDocument();
      expect(screen.getByText('Active Alerts')).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    render(<OverviewCommandCenterPage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    mockProvider.getOverviewKPIs.mockRejectedValue(new Error('Failed'));
    render(<OverviewCommandCenterPage />);
    await waitFor(() => {
      expect(screen.getByText(/error loading/i)).toBeInTheDocument();
    });
  });
});
```

### 10.2 Integration Testing

**Database Integration Tests:**
```typescript
describe('Overview & Settings Integration', () => {
  beforeAll(async () => {
    await resetDatabase();
    await runMigrations();
    await runSeeds();
  });

  it('should fetch KPIs from view', async () => {
    const kpis = await supabase
      .from('v_overview_kpis')
      .select('*')
      .eq('tenant_id', testTenantId)
      .single();
    
    expect(kpis.data.total_assets).toBeGreaterThan(0);
    expect(kpis.data.active_alerts).toBeGreaterThanOrEqual(0);
  });

  it('should create work item with deep link', async () => {
    const workItem = await supabase
      .from('work_items')
      .insert({
        tenant_id: testTenantId,
        title: 'Test Work Item',
        type: 'alert_followup',
        status: 'open',
        source_feature_area: 'monitoring',
        deeplink_path: '/monitoring/alerts/123'
      })
      .select()
      .single();
    
    expect(workItem.data.deeplink_path).toBe('/monitoring/alerts/123');
  });
});
```

### 10.3 End-to-End Testing

**Critical User Flows:**
1. View command center dashboard → See KPIs
2. Navigate to alert inbox → Click alert → Route to source
3. View worklist → Click work item → Route to source
4. Edit tenant profile → Save → Verify persistence
5. Configure integration → Save → View health events

**E2E Test Example:**
```typescript
test('User can view and route from alert inbox', async ({ page }) => {
  await page.goto('/overview/alerts');
  await expect(page.locator('h1')).toContainText('Alert Inbox');
  
  await page.click('[data-testid="alert-row-1"]');
  await expect(page).toHaveURL(/\/overview\/alerts\/[a-f0-9-]+/);
  
  await page.click('[data-testid="open-in-source-btn"]');
  await expect(page).toHaveURL(/\/monitoring\/alerts\/[a-f0-9-]+/);
});
```

---

## 11. Security Considerations

### 11.1 Data Access Control

**Tenant Isolation:**
- All queries MUST filter by `tenant_id`
- No cross-tenant data leakage
- Service role used in development (bypasses RLS)
- JWT-based RLS policies in production (future)

**User Scoping:**
- Work items filtered by `assigned_to_user_id`
- Notifications filtered by `user_id`
- User preferences scoped to `user_id`

### 11.2 Input Validation

**Server-Side Validation:**
```typescript
// Example: Validate work item creation
function validateWorkItemCreate(input: WorkItemCreate): void {
  if (!input.title || input.title.trim().length === 0) {
    throw new ValidationError('Title is required');
  }
  
  if (input.title.length > 255) {
    throw new ValidationError('Title must be <= 255 characters');
  }
  
  if (!['open', 'in_progress', 'completed', 'cancelled'].includes(input.status)) {
    throw new ValidationError('Invalid status');
  }
  
  if (input.deeplink_path && !input.deeplink_path.startsWith('/')) {
    throw new ValidationError('Deep link must start with /');
  }
}
```

**Client-Side Validation:**
- Form validation with react-hook-form
- Zod schemas for type-safe validation
- Real-time validation feedback

### 11.3 SQL Injection Prevention

**Parameterized Queries:**
- Supabase client automatically parameterizes queries
- Never concatenate user input into SQL strings
- Use `.eq()`, `.in()`, `.filter()` methods

**Example Safe Query:**
```typescript
// Safe: Parameterized
const { data } = await supabase
  .from('work_items')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('status', userInputStatus);

// Unsafe: String concatenation (DON'T DO THIS)
const { data } = await supabase
  .rpc('raw_query', { 
    query: `SELECT * FROM work_items WHERE status = '${userInputStatus}'` 
  });
```

### 11.4 JSONB Field Security

**Sanitize JSONB Inputs:**
```typescript
function sanitizeConfig(config: any): object {
  // Remove potentially dangerous keys
  const dangerous = ['__proto__', 'constructor', 'prototype'];
  const sanitized = { ...config };
  
  dangerous.forEach(key => delete sanitized[key]);
  
  return sanitized;
}
```

**Validate JSONB Structure:**
```typescript
// Example: Validate widget config
const widgetConfigSchema = z.object({
  filters: z.object({
    siteIds: z.array(z.string().uuid()).optional(),
    streamId: z.string().uuid().optional(),
    timeRange: z.enum(['1h', '24h', '7d', '30d']).optional()
  }).optional(),
  display: z.object({
    showTrend: z.boolean().optional(),
    chartType: z.enum(['line', 'bar', 'pie']).optional()
  }).optional()
});
```

---

## 12. Accessibility Design

### 12.1 WCAG AA Compliance

**Color Contrast:**
- Text: 4.5:1 minimum contrast ratio
- Large text (18pt+): 3:1 minimum
- Interactive elements: 3:1 minimum

**Keyboard Navigation:**
- All interactive elements accessible via Tab
- Logical tab order
- Skip links for main content
- Escape key closes modals/dialogs

**Screen Reader Support:**
- Semantic HTML elements
- ARIA labels where needed
- Live regions for dynamic content
- Descriptive link text (no "click here")

### 12.2 Component Accessibility

**List Components:**
```tsx
<div role="list" aria-label="Work Items">
  {items.map(item => (
    <div key={item.id} role="listitem">
      <a 
        href={`/overview/work/${item.id}`}
        aria-label={`View work item: ${item.title}`}
      >
        {item.title}
      </a>
    </div>
  ))}
</div>
```

**Form Components:**
```tsx
<form onSubmit={handleSubmit}>
  <label htmlFor="stream-name">Stream Name</label>
  <input
    id="stream-name"
    type="text"
    aria-required="true"
    aria-invalid={errors.name ? 'true' : 'false'}
    aria-describedby={errors.name ? 'name-error' : undefined}
  />
  {errors.name && (
    <span id="name-error" role="alert">
      {errors.name.message}
    </span>
  )}
</form>
```

**Widget Components:**
```tsx
<section aria-labelledby="kpi-heading">
  <h2 id="kpi-heading">Total Assets</h2>
  <div aria-live="polite" aria-atomic="true">
    <span className="kpi-value">{kpis.totalAssets}</span>
  </div>
</section>
```

### 12.3 Focus Management

**Modal Dialogs:**
- Focus trap within modal
- Return focus to trigger element on close
- Escape key closes modal

**Route Changes:**
- Announce route changes to screen readers
- Focus management on navigation
- Skip to main content link

---

## 13. Deployment & Rollout Strategy

### 13.1 Phased Rollout

**Phase 0: Infrastructure (Week 1)**
- Create migrations for all tables
- Create seed files
- Test `npx supabase db reset --linked`
- Verify baseline data intact

**Phase 1: Data Layer (Week 2)**
- Implement SupabaseProvider methods
- Add methods to HybridProvider
- Unit test all provider methods
- Integration test with Supabase

**Phase 2: Overview Pages (Week 3-4)**
- Implement command center dashboard
- Implement alert inbox and exceptions
- Implement health findings
- Implement worklist and notifications
- Implement advisor cards

**Phase 3: Settings Pages (Week 5-6)**
- Implement tenant organization pages
- Implement sites and hierarchy pages
- Implement users and teams pages
- Implement integrations pages
- Implement platform defaults pages
- Implement user settings pages

**Phase 4: Polish & Testing (Week 7)**
- End-to-end testing
- Accessibility audit
- Performance optimization
- Bug fixes
- Documentation

### 13.2 Feature Flags

**Gradual Enablement:**
```typescript
// Feature flag configuration
const featureFlags = {
  overviewCommandCenter: true,
  overviewAlertInbox: true,
  overviewHealthFindings: true,
  overviewWorklist: true,
  settingsOrganization: true,
  settingsIntegrations: true,
  settingsUserPreferences: true
};

// Usage in routing
{featureFlags.overviewCommandCenter && (
  <Route path="/overview" element={<OverviewCommandCenterPage />} />
)}
```

### 13.3 Monitoring & Observability

**Key Metrics:**
- Page load times (target: < 2s)
- API response times (target: < 500ms)
- Error rates (target: < 1%)
- User engagement (dashboard views, work item completions)

**Logging:**
```typescript
// Structured logging
logger.info('Work item created', {
  tenantId,
  workItemId,
  type: workItem.type,
  sourceFeatureArea: workItem.sourceFeatureArea
});

logger.error('Failed to fetch KPIs', {
  tenantId,
  error: error.message,
  stack: error.stack
});
```

**Alerts:**
- High error rate (> 5% in 5 minutes)
- Slow queries (> 2s p95)
- Failed migrations
- Seed validation failures

---

## 14. Future Enhancements

### 14.1 Phase 2 Features

**Custom Dashboard Builder:**
- Drag-and-drop widget placement
- Custom widget creation
- Dashboard sharing and templates
- Advanced filtering and scoping

**Advanced Work Management:**
- Work item workflows
- Automated work item creation
- Work item templates
- SLA tracking

**Enhanced Health Monitoring:**
- Real-time health checks
- Automated remediation
- Health trend analysis
- Predictive health scoring

### 14.2 Phase 3 Features

**Collaboration:**
- Comments on work items
- @mentions and notifications
- Team activity feeds
- Shared dashboards

**Analytics:**
- Dashboard usage analytics
- Work item completion metrics
- Alert response time tracking
- Platform health trends

**Mobile:**
- Mobile-optimized views
- Push notifications
- Offline support
- Mobile-specific workflows

---

**End of Design Document**
