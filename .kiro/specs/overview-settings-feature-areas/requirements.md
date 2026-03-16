# Requirements: Overview & Settings Feature Areas

**Project:** Plant4.0 (Power → Transmission)  
**Feature:** Overview & Settings  
**Data Backbone:** Supabase (single source of truth)  
**UI Pattern:** nLVE (Navigate → List → View → Edit)  
**Status:** Planning Phase

---

## 1. Executive Summary

### 1.1 Purpose
Implement two foundational feature areas for Plant4.0 Transmission:
- **Overview**: Cross-platform command center providing situational awareness, unified alerts, platform health visibility, and work routing
- **Settings**: Tenant governance, organizational setup, user/team management, integrations, and platform configuration

### 1.2 Scope
- Implement Overview and Settings as Supabase-native modules
- Support tenant/site/stream scoping and role-facing presets
- Provide stable contracts for other feature areas via shared tables/views
- Maintain compatibility with existing Upstream O&G screens (MockProvider)
- Operate in hybrid mode: Overview/Settings use SupabaseProvider; other areas may use MockProvider

### 1.3 Non-Goals (This Phase)
- No full custom dashboard builder (Stage 02 = presets + limited edit)
- No full workflow engine inside Overview (work items are pointers)
- No permission enforcement in Settings (deep-link to Cybersecurity)
- No fully mature data ingestion monitoring (Stage 02 = computed + basic health checks)

### 1.4 Assumptions
- Supabase remote dev environment is accessible and operational
- Existing baseline state preserved: tenants=1, sites=3, assets=15, alerts=12, etc.
- HybridProvider routing already established in codebase
- Existing UI patterns (nLVE, shell layouts) can be reused
- Multi-tenant architecture with tenant_id scoping required throughout

---

## 2. Data Requirements

### 2.1 Existing Core Tables (Do Not Duplicate)
The following tables already exist and must be referenced:
- `tenants`, `sites`, `asset_types`, `assets`
- `alerts`, `tags`, `telemetry_points`
- `grid_nodes`, `grid_lines`, `grid_asset_links`
- `operational_data`

### 2.2 New Shared Tables (Cross-Feature Contract)

#### 2.2.1 Routing & Attention Spine
**Table: `work_items`**
- Purpose: Cross-feature work inbox with pointer-based items
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `title` (TEXT, NOT NULL)
  - `type` (TEXT, NOT NULL) - e.g., 'alert_followup', 'maintenance_task', 'review_required'
  - `status` (TEXT, NOT NULL) - e.g., 'open', 'in_progress', 'completed', 'cancelled'
  - `priority` (TEXT) - e.g., 'low', 'medium', 'high', 'critical'
  - `assigned_to_user_id` (UUID, nullable)
  - `due_at` (TIMESTAMPTZ, nullable)
  - `source_feature_area` (TEXT, NOT NULL) - e.g., 'monitoring', 'automation', 'energy'
  - `source_table` (TEXT, nullable)
  - `source_id` (UUID, nullable)
  - `deeplink_path` (TEXT, nullable)
  - `created_at` (TIMESTAMPTZ, NOT NULL, default NOW())
  - `updated_at` (TIMESTAMPTZ, NOT NULL, default NOW())
- Constraints:
  - Unique index on (tenant_id, id)
  - Index on (tenant_id, assigned_to_user_id, status)
  - Index on (tenant_id, due_at) where status != 'completed'

**Table: `notifications`**
- Purpose: User notification feed
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `user_id` (UUID, NOT NULL)
  - `type` (TEXT, NOT NULL) - e.g., 'alert', 'work_assigned', 'mention', 'system'
  - `payload` (JSONB, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL, default NOW())
  - `read_at` (TIMESTAMPTZ, nullable)
- Constraints:
  - Index on (tenant_id, user_id, read_at) for unread queries
  - Index on (tenant_id, user_id, created_at DESC)

#### 2.2.2 Platform Visibility Spine
**Table: `platform_health_checks`**
- Purpose: Define automated health checks
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `check_key` (TEXT, NOT NULL) - unique identifier for check type
  - `name` (TEXT, NOT NULL)
  - `description` (TEXT)
  - `enabled` (BOOLEAN, NOT NULL, default true)
  - `params` (JSONB) - check-specific configuration
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, check_key)

**Table: `platform_health_findings`**
- Purpose: Store health check results and issues
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `check_key` (TEXT, NOT NULL, FK to platform_health_checks)
  - `severity` (TEXT, NOT NULL) - e.g., 'info', 'warning', 'error', 'critical'
  - `status` (TEXT, NOT NULL) - e.g., 'open', 'acknowledged', 'resolved'
  - `first_seen` (TIMESTAMPTZ, NOT NULL)
  - `last_seen` (TIMESTAMPTZ, NOT NULL)
  - `details` (JSONB) - finding-specific data
  - `resolved_at` (TIMESTAMPTZ, nullable)
- Constraints:
  - Index on (tenant_id, status, severity)
  - Index on (tenant_id, check_key, status)

#### 2.2.3 Configuration & Scoping Spine
**Table: `streams`**
- Purpose: Define operational streams (Main/Pilot/R&D)
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `code` (TEXT, NOT NULL) - e.g., 'MAIN', 'PILOT', 'RND'
  - `name` (TEXT, NOT NULL)
  - `kind` (TEXT, NOT NULL) - e.g., 'production', 'pilot', 'research'
  - `status` (TEXT, NOT NULL) - e.g., 'active', 'inactive'
  - `is_default` (BOOLEAN, NOT NULL, default false)
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, code)
  - Only one is_default=true per tenant

**Table: `module_toggles`**
- Purpose: Control feature area availability per stream
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `stream_id` (UUID, FK to streams, nullable)
  - `feature_area` (TEXT, NOT NULL) - e.g., 'monitoring', 'automation', 'energy'
  - `enabled` (BOOLEAN, NOT NULL, default true)
  - `readiness_state` (TEXT) - e.g., 'alpha', 'beta', 'ga'
- Constraints:
  - Unique index on (tenant_id, stream_id, feature_area)

**Table: `scope_defaults`**
- Purpose: Default scoping preferences per role/team/user
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `principal_type` (TEXT, NOT NULL) - 'role', 'team', or 'user'
  - `principal_id` (TEXT, NOT NULL) - role name, team_id, or user_id
  - `default_site_ids` (UUID[], nullable)
  - `default_stream_id` (UUID, FK to streams, nullable)
  - `default_dashboard_id` (UUID, nullable)
- Constraints:
  - Unique index on (tenant_id, principal_type, principal_id)

#### 2.2.4 Identity-Lite Collaboration Spine
**Table: `user_profiles`**
- Purpose: Extended user information beyond auth
- Required columns:
  - `user_id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `display_name` (TEXT, NOT NULL)
  - `persona_label` (TEXT) - e.g., 'operator', 'engineer', 'manager'
  - `preferences` (JSONB) - user-specific settings
  - `created_at` (TIMESTAMPTZ, NOT NULL)

**Table: `teams`**
- Purpose: Organizational teams for collaboration
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `name` (TEXT, NOT NULL)
  - `on_call_label` (TEXT, nullable)
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, name)

**Table: `team_memberships`**
- Purpose: User-team associations
- Required columns:
  - `team_id` (UUID, FK to teams, NOT NULL)
  - `user_id` (UUID, NOT NULL)
  - `role` (TEXT, NOT NULL) - 'lead' or 'member'
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Primary key on (team_id, user_id)

**Table: `responsibility_labels`**
- Purpose: Standardized responsibility categories
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `code` (TEXT, NOT NULL)
  - `name` (TEXT, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, code)

#### 2.2.5 Integrations Spine
**Table: `integration_types`**
- Purpose: Catalog of integration categories
- Required columns:
  - `code` (TEXT, PK)
  - `name` (TEXT, NOT NULL)
  - `category` (TEXT, NOT NULL) - e.g., 'CMMS', 'ERP', 'SCADA', 'Historian', 'Ticketing'

**Table: `integrations`**
- Purpose: Configured integration instances
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `type_code` (TEXT, FK to integration_types, NOT NULL)
  - `name` (TEXT, NOT NULL)
  - `status` (TEXT, NOT NULL) - e.g., 'active', 'inactive', 'error'
  - `last_sync_at` (TIMESTAMPTZ, nullable)
  - `config` (JSONB) - integration-specific configuration
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, name)

**Table: `integration_mappings`**
- Purpose: Map integrations to sites/streams
- Required columns:
  - `id` (UUID, PK)
  - `integration_id` (UUID, FK to integrations, NOT NULL)
  - `site_id` (UUID, FK to sites, nullable)
  - `stream_id` (UUID, FK to streams, nullable)
  - `mapping` (JSONB) - field mappings and transformations
- Constraints:
  - Index on (integration_id, site_id)

**Table: `integration_health_events`**
- Purpose: Track integration health over time
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `integration_id` (UUID, FK to integrations, NOT NULL)
  - `status` (TEXT, NOT NULL) - e.g., 'healthy', 'degraded', 'down'
  - `timestamp` (TIMESTAMPTZ, NOT NULL)
  - `details` (JSONB) - event-specific data
- Constraints:
  - Index on (tenant_id, integration_id, timestamp DESC)


### 2.3 Overview-Specific Tables

**Table: `overview_dashboards`**
- Purpose: Dashboard configurations and presets
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `name` (TEXT, NOT NULL)
  - `preset_type` (TEXT, nullable) - 'ops', 'reliability', 'security', 'energy', 'executive'
  - `is_default` (BOOLEAN, NOT NULL, default false)
  - `scope_defaults` (JSONB) - default site_ids, stream_id
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, name)
  - Only one is_default=true per tenant

**Table: `overview_widgets`**
- Purpose: Widget catalog
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `widget_key` (TEXT, NOT NULL)
  - `name` (TEXT, NOT NULL)
  - `description` (TEXT)
  - `source_feature_area` (TEXT, NOT NULL)
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, widget_key)

**Table: `overview_dashboard_widgets`**
- Purpose: Widget placement on dashboards
- Required columns:
  - `id` (UUID, PK)
  - `dashboard_id` (UUID, FK to overview_dashboards, NOT NULL)
  - `widget_id` (UUID, FK to overview_widgets, NOT NULL)
  - `position` (JSONB, NOT NULL) - {x, y, w, h}
  - `config` (JSONB) - widget-specific configuration
- Constraints:
  - Unique index on (dashboard_id, widget_id)

**Table: `overview_exceptions`**
- Purpose: Non-alert operational issues
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `exception_type` (TEXT, NOT NULL) - e.g., 'stale_telemetry', 'missing_metadata', 'integration_down'
  - `severity` (TEXT, NOT NULL)
  - `title` (TEXT, NOT NULL)
  - `description` (TEXT)
  - `owner_team_id` (UUID, FK to teams, nullable)
  - `due_date` (DATE, nullable)
  - `status` (TEXT, NOT NULL) - e.g., 'new', 'acknowledged', 'resolved'
  - `source_ref` (JSONB) - {feature_area, table, id, deeplink}
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Index on (tenant_id, status, severity)

**Table: `overview_alert_triage`**
- Purpose: Track alert routing and triage state
- Required columns:
  - `id` (UUID, PK)
  - `alert_id` (UUID, FK to alerts, NOT NULL)
  - `state` (TEXT, NOT NULL) - e.g., 'new', 'acknowledged', 'routed', 'closed'
  - `routed_to_feature_area` (TEXT, nullable)
  - `routed_to_ref` (JSONB, nullable)
  - `updated_by` (UUID, nullable)
  - `updated_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (alert_id)

**Table: `advisor_cards`**
- Purpose: Actionable guidance cards
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `card_key` (TEXT, NOT NULL)
  - `title` (TEXT, NOT NULL)
  - `severity` (TEXT, NOT NULL)
  - `rationale` (TEXT)
  - `recommended_action` (TEXT)
  - `deeplink_path` (TEXT)
  - `params` (JSONB)
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, card_key)


### 2.4 Settings-Specific Tables

**Table: `tenant_profile`**
- Purpose: Extended tenant configuration
- Required columns:
  - `tenant_id` (UUID, PK, FK to tenants)
  - `logo_url` (TEXT, nullable)
  - `region` (TEXT)
  - `timezone` (TEXT, NOT NULL)
  - `currency_code` (TEXT, NOT NULL)
  - `regulatory_profile` (JSONB) - compliance requirements
- Constraints:
  - One row per tenant

**Table: `programs`**
- Purpose: Organizational programs
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `name` (TEXT, NOT NULL)
  - `description` (TEXT)
  - `status` (TEXT, NOT NULL) - e.g., 'active', 'planned', 'archived'
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, name)

**Table: `naming_standards`**
- Purpose: Tenant naming conventions
- Required columns:
  - `tenant_id` (UUID, PK, FK to tenants)
  - `rules` (JSONB, NOT NULL) - {required_fields, naming_patterns, tag_vocab}

**Table: `site_hierarchy_nodes`**
- Purpose: Operational hierarchy within sites
- Required columns:
  - `id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `site_id` (UUID, FK to sites, NOT NULL)
  - `parent_id` (UUID, FK to site_hierarchy_nodes, nullable)
  - `node_type` (TEXT, NOT NULL) - 'area', 'unit', 'line', 'group'
  - `name` (TEXT, NOT NULL)
  - `path` (TEXT, NOT NULL) - materialized path for queries
  - `metadata` (JSONB)
  - `created_at` (TIMESTAMPTZ, NOT NULL)
- Constraints:
  - Unique index on (tenant_id, site_id, path)
  - Index on (tenant_id, site_id, parent_id)

**Table: `tenant_units`**
- Purpose: Unit system preferences
- Required columns:
  - `tenant_id` (UUID, PK, FK to tenants)
  - `unit_system` (JSONB, NOT NULL) - {temperature, power, pressure, date_format}

**Table: `user_preferences`**
- Purpose: User-specific preferences
- Required columns:
  - `user_id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `defaults` (JSONB) - {default_site_id, default_stream_id, theme, language}

**Table: `notification_preferences`**
- Purpose: User notification settings
- Required columns:
  - `user_id` (UUID, PK)
  - `tenant_id` (UUID, FK to tenants, NOT NULL)
  - `channels` (JSONB) - {email, in_app, sms}
  - `digest_frequency` (TEXT) - 'realtime', 'hourly', 'daily'
  - `quiet_hours` (JSONB) - {start_time, end_time, timezone}

### 2.5 Views and Functions

**View: `v_overview_kpis`**
- Purpose: Aggregate KPIs for command center
- Columns:
  - `tenant_id`
  - `total_assets`
  - `active_alerts`
  - `critical_alerts`
  - `open_work_items`
  - `stale_telemetry_count`
  - `integration_health_score`
  - `last_updated`

**View: `v_overview_top_alerts`**
- Purpose: Top N alerts by severity/recency
- Columns:
  - All alert columns
  - `rank` (ordered by severity, then created_at DESC)
- Limit: Top 20 per tenant

**View: `v_overview_data_freshness`**
- Purpose: Telemetry freshness by site/stream
- Columns:
  - `tenant_id`
  - `site_id`
  - `stream_id`
  - `last_telemetry_at`
  - `staleness_minutes`
  - `status` (computed: 'fresh', 'stale', 'critical')

**Function: `fn_compute_platform_health_score`**
- Purpose: Calculate overall platform health
- Parameters: `p_tenant_id UUID`
- Returns: `NUMERIC` (0-100 score)
- Logic: Weighted average of integration health, data freshness, alert severity

---

## 3. Functional Requirements

### 3.1 Overview Feature Set 1: Command Center Dashboard

**FR-OV-1.1: Dashboard Presets**
- Given a user with a specific role (ops/reliability/security/energy/executive)
- When they navigate to `/overview`
- Then they see a role-appropriate dashboard preset with relevant widgets

**FR-OV-1.2: Dashboard List**
- Given a user navigates to `/overview/dashboards`
- When the page loads
- Then they see a list of available dashboards (presets + saved views)
- And can select a dashboard to view

**FR-OV-1.3: KPI Widgets**
- Given a command center dashboard is displayed
- When the page loads
- Then KPI widgets show: total assets, active alerts, open work items, data freshness status
- And all KPIs are scoped to the user's default tenant/site/stream

**FR-OV-1.4: Widget Configuration**
- Given a user is viewing a dashboard
- When they access edit mode (Stage 02)
- Then they can toggle widget visibility and adjust basic filters
- But cannot create fully custom widgets (out of scope)

**Acceptance Criteria:**
- [ ] 5 dashboard presets seeded (Ops, Reliability, Security, Energy, Executive)
- [ ] 10-20 widgets seeded and linked to dashboards
- [ ] `/overview` route renders command center with KPIs
- [ ] `/overview/dashboards` route lists available dashboards
- [ ] KPIs read from `v_overview_kpis` view
- [ ] All queries scoped by tenant_id

### 3.2 Overview Feature Set 2: Alerts, Exceptions & Work Routing

**FR-OV-2.1: Unified Alert Inbox**
- Given a user navigates to `/overview/alerts`
- When the page loads
- Then they see all alerts across feature areas in a unified list
- And can filter by severity, status, feature area, site

**FR-OV-2.2: Alert Detail with Deep Link**
- Given a user clicks an alert in the inbox
- When the alert detail page loads at `/overview/alerts/:alertId`
- Then they see alert summary information
- And a prominent "Open in Source" button that routes to the owning feature area

**FR-OV-2.3: Exception Tracking**
- Given operational issues exist (stale telemetry, missing metadata, integration down)
- When a user navigates to `/overview/exceptions`
- Then they see a list of non-alert exceptions
- And can view details at `/overview/exceptions/:exceptionId`

**FR-OV-2.4: Alert Triage**
- Given a user is viewing an alert
- When they change the triage state (New → Acknowledged → Routed)
- Then the state is persisted in `overview_alert_triage`
- And the alert can be routed to a specific feature area with reference data

**Acceptance Criteria:**
- [ ] 8-15 exceptions seeded
- [ ] `/overview/alerts` renders unified alert list from existing `alerts` table
- [ ] `/overview/alerts/:alertId` shows alert detail with "Open in Source" button
- [ ] `/overview/exceptions` renders exception list
- [ ] Triage state changes persist to database
- [ ] Deep links route to correct feature area pages

### 3.3 Overview Feature Set 3: Platform Health & DataOps Visibility

**FR-OV-3.1: Health Checks Configuration**
- Given platform health checks are defined
- When the system runs scheduled checks
- Then findings are recorded in `platform_health_findings`
- And checks include: telemetry freshness, missing tags, integration status

**FR-OV-3.2: Health Findings List**
- Given a user navigates to `/overview/health/findings`
- When the page loads
- Then they see a list of health findings grouped by severity
- And can filter by status (open/resolved), check type, severity

**FR-OV-3.3: Data Stream Status**
- Given a user navigates to `/overview/health/streams`
- When the page loads
- Then they see data freshness status per site/stream
- And can identify stale telemetry sources

**FR-OV-3.4: Health Finding Detail**
- Given a user clicks a health finding
- When the detail page loads at `/overview/health/findings/:findingId`
- Then they see finding details, history, and resolution status

**Acceptance Criteria:**
- [ ] 6-10 health checks seeded
- [ ] 5-12 health findings seeded (mix of open/resolved)
- [ ] `/overview/health/findings` renders findings list
- [ ] `/overview/health/streams` shows data freshness per site/stream
- [ ] `v_overview_data_freshness` view provides staleness calculations
- [ ] Health score function returns 0-100 score

### 3.4 Overview Feature Set 4: Tasks, Notifications & Worklist

**FR-OV-4.1: Work Items Inbox**
- Given a user has assigned work items
- When they navigate to `/overview/work`
- Then they see their worklist with items from all feature areas
- And can filter by status, priority, due date

**FR-OV-4.2: Work Item Detail**
- Given a user clicks a work item
- When the detail page loads at `/overview/work/:workItemId`
- Then they see work item details and a deep link to the source system

**FR-OV-4.3: Notifications Center**
- Given a user has notifications
- When they navigate to `/overview/notifications`
- Then they see a chronological notification feed
- And can mark notifications as read

**FR-OV-4.4: Work Item Pointer Architecture**
- Given work items are created from various feature areas
- When stored in `work_items` table
- Then they include source_feature_area, source_table, source_id, deeplink_path
- And clicking the work item routes to the owning system

**Acceptance Criteria:**
- [ ] 12-25 work items seeded across feature areas
- [ ] 20-40 notifications seeded for test users
- [ ] `/overview/work` renders worklist with filtering
- [ ] `/overview/work/:workItemId` shows detail with deep link
- [ ] `/overview/notifications` renders notification feed
- [ ] Notifications can be marked as read

### 3.5 Overview Feature Set 5: Guidance, Insights & Help

**FR-OV-5.1: Advisor Cards**
- Given the system detects actionable conditions
- When a user navigates to `/overview/advisor`
- Then they see advisor cards with rationale and recommended actions
- And each card includes a deep link to take action

**FR-OV-5.2: Recommended Actions**
- Given advisor cards exist
- When a user navigates to `/overview/recommended-actions`
- Then they see a prioritized list of recommended actions
- And can dismiss or act on recommendations

**FR-OV-5.3: Platform Help**
- Given a user needs guidance
- When they navigate to `/overview/help`
- Then they see platform help content and changelog

**Acceptance Criteria:**
- [ ] 10-20 advisor cards seeded
- [ ] `/overview/advisor` renders advisor cards
- [ ] `/overview/recommended-actions` shows prioritized actions
- [ ] `/overview/help` displays help content
- [ ] Advisor cards include severity, rationale, and deep links

### 3.6 Settings Feature Set 1: Tenant & Organization Setup

**FR-ST-1.1: Organization Profile**
- Given a user navigates to `/settings/organization`
- When the page loads
- Then they see tenant profile information (logo, region, timezone, currency)
- And can edit these settings (view/edit mode)

**FR-ST-1.2: Streams Management**
- Given a user navigates to `/settings/streams`
- When the page loads
- Then they see a list of streams (Main, Pilot, R&D)
- And can view/edit stream details including status and default flag

**FR-ST-1.3: Programs Management**
- Given a user navigates to `/settings/streams`
- When viewing the programs section
- Then they see organizational programs
- And can create/edit program details

**FR-ST-1.4: Naming Standards**
- Given a user navigates to `/settings/naming-standards`
- When the page loads
- Then they see naming convention rules
- And can edit required fields, naming patterns, and tag vocabulary

**Acceptance Criteria:**
- [ ] 1 tenant_profile seeded
- [ ] 3 streams seeded (Main, Pilot, R&D)
- [ ] 2-4 programs seeded
- [ ] `/settings/organization` renders and allows editing
- [ ] `/settings/streams` lists streams with view/edit capability
- [ ] `/settings/naming-standards` displays and allows editing rules
- [ ] One stream marked as default

### 3.7 Settings Feature Set 2: Sites, Locations & Operational Context

**FR-ST-2.1: Sites Management**
- Given a user navigates to `/settings/sites`
- When the page loads
- Then they see a list of sites (existing sites table)
- And can view/edit site details

**FR-ST-2.2: Operational Hierarchy**
- Given a user navigates to `/settings/hierarchy`
- When the page loads
- Then they see the site hierarchy tree (areas, units, lines, groups)
- And can view/edit hierarchy nodes

**FR-ST-2.3: Scope Defaults**
- Given a user navigates to `/settings/scope-defaults`
- When the page loads
- Then they see default scoping rules per role/team/user
- And can edit default site_ids, stream_id, dashboard_id per principal

**Acceptance Criteria:**
- [ ] 20-40 hierarchy nodes seeded across 3 sites
- [ ] 5 scope defaults seeded (one per preset role)
- [ ] `/settings/sites` lists existing sites
- [ ] `/settings/hierarchy` displays hierarchy tree
- [ ] `/settings/scope-defaults` allows editing defaults
- [ ] Hierarchy nodes use materialized path for efficient queries

### 3.8 Settings Feature Set 3: Users, Teams & Delegation

**FR-ST-3.1: Users & Teams List**
- Given a user navigates to `/settings/users`
- When the page loads
- Then they see a list of user profiles and teams
- And can view user/team details

**FR-ST-3.2: User Detail**
- Given a user clicks a user profile
- When the detail page loads at `/settings/users/:userId`
- Then they see user profile, persona, team memberships
- And can edit user details

**FR-ST-3.3: Responsibilities Management**
- Given a user navigates to `/settings/responsibilities`
- When the page loads
- Then they see responsibility labels
- And can create/edit responsibility categories

**FR-ST-3.4: Team Memberships**
- Given teams and users exist
- When viewing a team
- Then team memberships show with roles (lead/member)
- And memberships can be edited

**Acceptance Criteria:**
- [ ] 8-15 user_profiles seeded
- [ ] 3-6 teams seeded
- [ ] Team memberships >= user_profiles count
- [ ] 8-12 responsibility labels seeded
- [ ] `/settings/users` lists users and teams
- [ ] `/settings/users/:userId` shows user detail
- [ ] `/settings/responsibilities` manages responsibility labels
- [ ] No policy enforcement (links to Cybersecurity feature area)

### 3.9 Settings Feature Set 4: Integrations & Connectivity

**FR-ST-4.1: Integrations Catalog**
- Given a user navigates to `/settings/integrations`
- When the page loads
- Then they see a list of configured integrations
- And can view integration status and last sync time

**FR-ST-4.2: Integration Detail**
- Given a user clicks an integration
- When the detail page loads at `/settings/integrations/:integrationId`
- Then they see integration configuration, mappings, and health events

**FR-ST-4.3: Integration Configuration**
- Given a user navigates to `/settings/integrations/:integrationId/edit`
- When the page loads
- Then they can edit integration config, status, and mappings

**FR-ST-4.4: Integration Health Tracking**
- Given integrations are configured
- When health events are recorded
- Then integration health status is visible in the catalog and detail pages

**Acceptance Criteria:**
- [ ] 8-12 integration_types seeded
- [ ] 3-6 integrations seeded
- [ ] Integration mappings >= integrations count
- [ ] 10-20 integration_health_events seeded
- [ ] `/settings/integrations` lists integrations with status
- [ ] `/settings/integrations/:integrationId` shows detail
- [ ] `/settings/integrations/:integrationId/edit` allows configuration
- [ ] Health events display in integration detail

### 3.10 Settings Feature Set 5: Data & Platform Defaults

**FR-ST-5.1: Platform Defaults**
- Given a user navigates to `/settings/platform-defaults`
- When the page loads
- Then they see tenant-wide defaults (units, retention, behavior)
- And can edit these settings

**FR-ST-5.2: Module Toggles**
- Given a user navigates to `/settings/modules`
- When the page loads
- Then they see feature area toggles per stream
- And can enable/disable feature areas and set readiness state

**FR-ST-5.3: Unit System Configuration**
- Given a user is editing platform defaults
- When they configure unit systems
- Then they can set temperature (°C/°F), power (kW/MW), pressure (bar/psi), date formats

**Acceptance Criteria:**
- [ ] 1 tenant_units record seeded
- [ ] 20+ module_toggles seeded (feature areas × streams)
- [ ] `/settings/platform-defaults` displays and allows editing
- [ ] `/settings/modules` shows feature area toggles
- [ ] Unit system preferences apply tenant-wide

### 3.11 Settings Feature Set 6: User Settings

**FR-ST-6.1: My Profile**
- Given a user navigates to `/settings/me`
- When the page loads
- Then they see their profile information
- And can edit display name, persona label

**FR-ST-6.2: My Preferences**
- Given a user navigates to `/settings/me/preferences`
- When the page loads
- Then they see personal preferences (default site, stream, theme, language)
- And can edit these preferences

**FR-ST-6.3: My Notifications**
- Given a user navigates to `/settings/me/notifications`
- When the page loads
- Then they see notification preferences (channels, digest frequency, quiet hours)
- And can edit notification settings

**FR-ST-6.4: Accessibility & Theme**
- Given a user navigates to `/settings/me/accessibility`
- When the page loads
- Then they see accessibility and theme options
- And can adjust settings for personal use

**Acceptance Criteria:**
- [ ] 8-15 user_preferences seeded (matching user_profiles)
- [ ] 8-15 notification_preferences seeded
- [ ] `/settings/me` displays user profile
- [ ] `/settings/me/preferences` allows editing preferences
- [ ] `/settings/me/notifications` manages notification settings
- [ ] `/settings/me/accessibility` provides accessibility options
- [ ] User settings do not override tenant governance

---

## 4. Operational Requirements

### 4.1 Multi-Tenant Scoping
- **OP-1**: All tenant-scoped tables MUST include `tenant_id` column with NOT NULL constraint
- **OP-2**: All queries MUST filter by `tenant_id` to ensure data isolation
- **OP-3**: Indexes MUST include `tenant_id` as first column for optimal query performance
- **OP-4**: Global catalog tables (e.g., `integration_types`) may omit `tenant_id`

### 4.2 Data Provider Integration
- **OP-5**: All Overview and Settings data access MUST use SupabaseProvider methods
- **OP-6**: No direct imports from `mockData.ts` for Overview/Settings features
- **OP-7**: HybridProvider MUST route Overview/Settings to SupabaseProvider
- **OP-8**: Existing Upstream O&G features remain on MockProvider (no breaking changes)

### 4.3 Seed Data Requirements
- **OP-9**: All seed files MUST be idempotent (safe to run multiple times)
- **OP-10**: Seed files MUST include precondition assertions (RAISE EXCEPTION on failure)
- **OP-11**: Seed files MUST include post-seed validation counts
- **OP-12**: Seed files MUST use CTE-based deterministic inserts
- **OP-13**: Seed files MUST NOT use explicit UUIDs (use natural key resolution)

### 4.4 Database Standards
- **OP-14**: All migrations MUST be reversible (include DOWN migration)
- **OP-15**: All tables MUST have `created_at` timestamp (default NOW())
- **OP-16**: Updated entities SHOULD have `updated_at` timestamp with trigger
- **OP-17**: Foreign keys MUST be defined with appropriate ON DELETE behavior
- **OP-18**: RLS MUST be enabled on all tenant-scoped tables (policies TBD)

### 4.5 Deep Link Routing
- **OP-19**: All work items MUST include `deeplink_path` for routing to source system
- **OP-20**: All exceptions MUST include `source_ref` JSONB with routing information
- **OP-21**: Alert triage MUST support routing to owning feature area
- **OP-22**: "Open in Source" buttons MUST navigate to correct feature area pages

### 4.6 Validation Thresholds
After `npx supabase db reset --linked`, the following minimum counts MUST be met:

**Overview Tables:**
- `overview_dashboards` >= 5
- `overview_widgets` >= 10
- `overview_dashboard_widgets` >= 20
- `overview_exceptions` >= 8
- `work_items` >= 12
- `notifications` >= 20
- `platform_health_checks` >= 6
- `platform_health_findings` >= 5
- `advisor_cards` >= 10

**Settings Tables:**
- `tenant_profile` = 1
- `streams` >= 3
- `programs` >= 2
- `site_hierarchy_nodes` >= 20
- `scope_defaults` >= 5
- `user_profiles` >= 8
- `teams` >= 3
- `team_memberships` >= 8
- `responsibility_labels` >= 8
- `integration_types` >= 8
- `integrations` >= 3
- `integration_health_events` >= 10
- `module_toggles` >= 20
- `user_preferences` >= 8
- `notification_preferences` >= 8

---

## 5. UI/UX Requirements

### 5.1 nLVE Pattern Compliance
- **UX-1**: All feature pages MUST follow nLVE pattern (Navigate → List → View → Edit)
- **UX-2**: List panes MUST support filtering, sorting, and search where applicable
- **UX-3**: View panes MUST display entity details with related data
- **UX-4**: Edit mode MUST be clearly distinguished from view mode
- **UX-5**: Navigation MUST use existing left nav structure

### 5.2 Responsive Design
- **UX-6**: All pages MUST be responsive and work on tablet/desktop
- **UX-7**: List/View panes MUST adapt to screen size
- **UX-8**: Mobile-first approach for critical workflows

### 5.3 Accessibility
- **UX-9**: All interactive elements MUST be keyboard accessible
- **UX-10**: All form inputs MUST have proper labels
- **UX-11**: Color contrast MUST meet WCAG AA standards
- **UX-12**: Screen reader support for all content

### 5.4 Loading & Error States
- **UX-13**: All data-loading pages MUST show loading indicators
- **UX-14**: All error states MUST display user-friendly messages
- **UX-15**: Empty states MUST provide guidance on next actions

---

## 6. Out of Scope

### 6.1 Security & Policy Enforcement
- User authentication (handled by Supabase Auth)
- Role-based access control policies (Cybersecurity feature area)
- Permission enforcement in Settings (link to Cybersecurity pages)
- Audit logging of user actions (future phase)

### 6.2 Advanced Features (Future Phases)
- Full custom dashboard builder (Stage 02 = presets only)
- Workflow engine for work items (pointers only in this phase)
- Advanced data ingestion monitoring (basic health checks only)
- Real-time collaboration features
- Advanced analytics and reporting
- Mobile native applications

### 6.3 Integration Implementations
- Actual integration connectors (catalog and health tracking only)
- Data transformation pipelines
- Real-time data sync mechanisms
- Integration authentication flows

---

## 7. Dependencies

### 7.1 External Dependencies
- Supabase remote dev environment operational
- Existing baseline schema and seed data intact
- HybridProvider routing configured
- React Router for navigation
- Existing UI component library (shadcn/ui)

### 7.2 Internal Dependencies
- Existing `tenants`, `sites`, `assets`, `alerts` tables
- Existing DataProvider interface and implementations
- Existing page shell and layout components
- Existing navigation structure

---

## 8. Success Criteria

### 8.1 Technical Success
- [ ] All migrations apply cleanly to remote dev
- [ ] `npx supabase db reset --linked` completes successfully
- [ ] All seed validation thresholds met
- [ ] All Overview pages render in hybrid mode
- [ ] All Settings pages render in hybrid mode
- [ ] No breaking changes to existing Upstream O&G features
- [ ] All deep links route correctly

### 8.2 Functional Success
- [ ] Users can view command center dashboard with KPIs
- [ ] Users can access unified alert inbox and route to source
- [ ] Users can view platform health findings
- [ ] Users can manage their worklist
- [ ] Users can configure tenant organization settings
- [ ] Users can manage sites and operational hierarchy
- [ ] Users can view and edit user/team information
- [ ] Users can configure integrations
- [ ] Users can set platform defaults and module toggles
- [ ] Users can personalize their preferences

### 8.3 Quality Success
- [ ] All pages follow nLVE pattern consistently
- [ ] All queries properly scoped by tenant_id
- [ ] All seed data meets validation thresholds
- [ ] All deep links function correctly
- [ ] Loading and error states handled gracefully
- [ ] Accessibility standards met (WCAG AA)
- [ ] Responsive design works on tablet/desktop

---

## 9. Risks and Mitigations

### 9.1 Data Migration Risk
**Risk**: Existing baseline data could be corrupted during schema changes  
**Mitigation**: Test all migrations on dev environment first; ensure reversible migrations

### 9.2 Performance Risk
**Risk**: Complex views and aggregations could impact query performance  
**Mitigation**: Proper indexing strategy; use materialized views where appropriate; monitor query performance

### 9.3 Scope Creep Risk
**Risk**: Feature requests could expand beyond defined scope  
**Mitigation**: Strict adherence to requirements; defer advanced features to Stage 02

### 9.4 Integration Complexity Risk
**Risk**: HybridProvider routing could introduce bugs  
**Mitigation**: Comprehensive testing of routing logic; clear separation between Supabase and Mock providers

### 9.5 User Experience Risk
**Risk**: nLVE pattern may not fit all use cases  
**Mitigation**: Adapt pattern where necessary while maintaining consistency; gather user feedback early

---

## 10. Glossary

- **nLVE**: Navigate → List → View → Edit UI pattern
- **SSOT**: Single Source of Truth (Supabase for Overview/Settings)
- **Hybrid Mode**: Mixed data provider approach (Supabase + Mock)
- **Deep Link**: Navigation path to source system/feature area
- **Pointer-based**: Work items reference source data without duplication
- **Preset Dashboard**: Pre-configured dashboard for specific role
- **Stream**: Operational stream (Main/Pilot/R&D)
- **Scope Defaults**: Default tenant/site/stream selection per user/role
- **Health Check**: Automated platform health validation
- **Finding**: Result of a health check (issue or status)
- **Exception**: Non-alert operational issue requiring attention
- **Triage**: Process of acknowledging and routing alerts/exceptions
- **Advisor Card**: Actionable guidance recommendation
- **Module Toggle**: Feature area enable/disable control
- **Hierarchy Node**: Element in operational hierarchy (area/unit/line/group)
- **Materialized Path**: Denormalized path string for efficient tree queries

---

**End of Requirements Document**
