
# KIRO AI IDE MASTER PROMPT — Overview & Settings (Supabase-first)  
**Project:** Plant4.0 (Power → Transmission)  
**Objective:** Generate `requirements.md`, `design.md`, and `tasks.md` to fully implement the **Overview & Settings** feature areas exactly as specified below, using Supabase as SSOT and the existing HybridProvider approach.

---

## 0) Your Role and Output Contract

You are Kiro AI IDE Agent with full repo access.  
You must produce **three files** in `/docs/overview-settings/`:

1) `/docs/overview-settings/requirements.md`  
2) `/docs/overview-settings/design.md`  
3) `/docs/overview-settings/tasks.md`

**Do not write code in this task.** This is planning + architecture + execution plan only.

The deliverables must be **engineer-ready**: explicit, testable, sequenced, and aligned to the existing repo patterns.

---

## 1) Repo & Architecture Context (MUST FOLLOW)

### 1.1 Data Backbone
- Supabase is the single source of truth for all new Overview & Settings work.
- This repo already has:
  - `/supabase/migrations/` and `/supabase/seed/`
  - `supabase/config.toml` controlling seed order
  - HybridProvider routing:
    - Transmission methods → SupabaseProvider
    - Legacy Upstream O&G → MockProvider
- Do not introduce any new global `mockData.ts` usage.
- No feature branch is allowed to add persistent “repo mock” datasets for Overview & Settings.

### 1.2 UI Pattern
- All pages must follow **nLVE**:
  - Navigate (left nav)
  - List pane (browse entities)
  - View pane (details)
  - Edit mode (forms)
- Reuse existing shell layouts, page scaffolds, and list/detail components if present.

### 1.3 Standards (SQL + Seeds)
All schema and seed work must follow the established standards already used in Transmission:
- clean SQL
- CTE-based deterministic inserts
- precondition assertions (RAISE EXCEPTION)
- post-seed validations
- idempotent seeds
- no explicit UUIDs

---

## 2) Baseline Supabase State (DO NOT BREAK)

Remote reset baseline currently yields:
- tenants=1
- sites=3
- asset_types=4
- assets=15
- grid_nodes=5
- grid_lines=6
- grid_asset_links=18
- tags=10
- telemetry_points=30
- alerts=12
- operational_data=11

Your plan must ensure Overview & Settings work can be added without breaking this baseline.

---

## 3) Feature Specification (SOURCE OF TRUTH)

Use the following Feature Specification as the authoritative contract.  
You MUST read it and then generate `requirements.md`, `design.md`, and `tasks.md` that implement it end-to-end.

"
# Feature Specification: Overview & Settings

**Platform:** Plant4.0 (Power → Transmission)
**Data Backbone:** Supabase (single source of truth for these feature areas)
**UI Pattern:** nLVE (Navigate → List → View → Edit)
**Design Rule:** Overview summarizes + routes; Settings configures structure + defaults; Cybersecurity enforces policies.

---

## 0) Scope, Principles, and Non-Goals

### Scope

* Implement **Overview** and **Settings** feature areas as **Supabase-native** modules.
* Support **tenant/site/stream scoping** and role-facing presets.
* Provide a stable contract for other feature areas to “plug in” via shared tables/views:

  * alerts (already exists)
  * work items (new)
  * health findings (new)
  * integrations health (new)

### Non-Goals (for this phase)

* No full custom dashboard builder (Stage 02 = presets + limited edit)
* No full workflow engine inside Overview (work items are *pointers*)
* No permission enforcement in Settings (deep-link to Cybersecurity)
* No fully mature data ingestion monitoring (Stage 02 = computed + basic health checks)

### Compatibility

* Must not break existing Upstream O&G screens (kept on MockProvider).
* Must work in **hybrid mode**: Overview/Settings read from Supabase; other areas may still read from mocks.

---

## 1) Global Data Model Contract

### Existing Core Tables Already Available (do not duplicate)

* `tenants`
* `sites`
* `asset_types`
* `assets`
* `alerts`
* `tags`
* `telemetry_points`
* `grid_nodes`, `grid_lines`, `grid_asset_links`
* `operational_data`

### New Shared Tables Introduced by Overview/Settings

These tables are intentionally **cross-feature** so other squads can reference them later.

**Shared “routing + attention” spine**

* `work_items` (cross-feature work inbox pointers)
* `notifications` (user notification feed)

**Shared “platform visibility” spine**

* `platform_health_checks`
* `platform_health_findings`

**Shared “configuration + scoping” spine**

* `streams`
* `module_toggles`
* `scope_defaults`

**Shared “identity-lite collaboration” spine**

* `user_profiles`
* `teams`, `team_memberships`
* `responsibility_labels`

**Shared “integrations” spine**

* `integration_types`
* `integrations`
* `integration_mappings`
* `integration_health_events`

---

## 2) Feature Area: Overview

### Purpose

A cross-platform **Command Center** answering:

> “What needs attention now, and where do I go to act?”

### Primary Outputs

* A unified command dashboard (KPIs + key exceptions)
* A cross-feature alert summary with “open in source”
* A thin triage/routing front door
* Platform health/data freshness visibility
* My Worklist + Notifications

---

## Overview — Feature Set 1: Command Center Dashboard

### Goal

Instant situational awareness across tenant/site/stream scope with deep links to action.

### Page Inventory (nLVE)

**Navigate**

* `Overview` (left nav entry)

**List**

* `OverviewDashboardsPage`
  Route: `/overview/dashboards`
  Purpose: list role presets + saved views

**View**

* `OverviewCommandCenterPage`
  Route: `/overview`
  Purpose: main command center dashboard

**Edit (Stage 02 limited)**

* `OverviewDashboardEditPage`
  Route: `/overview/dashboards/:dashboardId/edit`
  Purpose: limited edit (toggle widgets, basic filters)

### Table Inventory (new)

* `overview_dashboards`

  * `id`, `tenant_id`, `name`, `preset_type` (ops/reliability/security/energy/executive), `is_default`
  * `scope_defaults` JSONB (default site_ids / stream_id)
* `overview_widgets`

  * `id`, `tenant_id`, `widget_key`, `name`, `description`, `source_feature_area`
* `overview_dashboard_widgets`

  * `id`, `dashboard_id`, `widget_id`, `position` JSONB, `config` JSONB

### Views/Functions (recommended)

* `v_overview_kpis` (assets count, active alerts, data freshness, open work items, automation events)
* `v_overview_top_alerts` (top N by severity/recency)
* `v_overview_data_freshness` (last_seen aggregation by site/stream)

### Seed Expectations

Create seed pack(s) under Overview range:

* `supabase/seed/080_overview_dashboards.sql`

  * dashboards: **5** presets (Ops/Reliability/Security/Energy/Executive)
* `supabase/seed/081_overview_widgets.sql`

  * widgets: **10–20** curated widgets pointing to other areas (alerts, missing metadata, stale telemetry, etc.)
* Validation targets:

  * dashboards ≥ 5
  * widgets ≥ 10
  * dashboard_widget links ≥ 20

---

## Overview — Feature Set 2: Alerts, Exceptions & Work Routing

### Goal

One place to see cross-feature exceptions and route to the owning system.

### Page Inventory (nLVE)

**List**

* `OverviewAlertsInboxPage`
  Route: `/overview/alerts`
  Purpose: unified alert inbox (read-only + route-out)

* `OverviewExceptionsPage`
  Route: `/overview/exceptions`
  Purpose: non-alert operational debt (stale telemetry, missing metadata, integration down)

**View**

* `OverviewAlertSummaryPage`
  Route: `/overview/alerts/:alertId`
  Purpose: thin summary + “Open in Source”

* `OverviewExceptionDetailPage`
  Route: `/overview/exceptions/:exceptionId`

**Edit (thin triage)**

* `OverviewTriageEdit` (inline or page)
  Purpose: New → Acknowledged → Routed

### Table Inventory (new)

* `overview_exceptions`

  * `id`, `tenant_id`, `exception_type`, `severity`, `title`, `description`
  * `owner_team_id` nullable, `due_date`, `status`
  * `source_ref` JSONB (source feature + table + id + deeplink)
* `overview_alert_triage`

  * `id`, `alert_id`, `state`, `routed_to_feature_area`, `routed_to_ref` JSONB
  * `updated_by`, `updated_at`

### Seed Expectations

* `supabase/seed/082_overview_exceptions.sql`

  * exceptions: **8–15** (mix of stale telemetry, missing metadata, integration down)
* `supabase/seed/083_overview_triage_states.sql`

  * optional: seed triage defaults/state labels
* Validation targets:

  * exceptions ≥ 8
  * triage rows optional (0 allowed)

---

## Overview — Feature Set 3: Platform Health & DataOps Visibility

### Goal

Is Plant4.0 receiving data and behaving as expected?

### Page Inventory (nLVE)

**List**

* `PlatformHealthFindingsPage`
  Route: `/overview/health/findings`

* `DataStreamStatusPage`
  Route: `/overview/health/streams`

**View**

* `PlatformHealthFindingDetailPage`
  Route: `/overview/health/findings/:findingId`

* `DataStreamDetailPage`
  Route: `/overview/health/streams/:streamId`

### Table Inventory (new)

* `platform_health_checks`

  * `id`, `tenant_id`, `check_key`, `name`, `enabled`, `params` JSONB
* `platform_health_findings`

  * `id`, `tenant_id`, `check_key`, `severity`, `status`
  * `first_seen`, `last_seen`, `details` JSONB

### Seed Expectations

* `supabase/seed/084_overview_platform_health.sql`

  * checks: **6–10** (telemetry freshness, missing tags, integration down, etc.)
  * findings: **5–12** (some “open”, some “resolved”)
* Validation targets:

  * health_checks ≥ 6
  * health_findings ≥ 5

---

## Overview — Feature Set 4: Tasks, Notifications & Worklist

### Goal

Single “work inbox” across Plant4.0 with pointer-based items.

### Page Inventory (nLVE)

**List**

* `MyWorklistPage`
  Route: `/overview/work`

* `NotificationsCenterPage`
  Route: `/overview/notifications`

**View**

* `WorkItemDetailPage`
  Route: `/overview/work/:workItemId`

### Table Inventory (new)

* `work_items`

  * `id`, `tenant_id`, `title`, `type`, `status`, `priority`
  * `assigned_to_user_id`, `due_at`
  * `source_feature_area`, `source_table`, `source_id`, `deeplink_path`
* `notifications`

  * `id`, `tenant_id`, `user_id`, `type`, `payload` JSONB
  * `created_at`, `read_at`

### Seed Expectations

* `supabase/seed/085_overview_work_notifications.sql`

  * work_items: **12–25**
  * notifications: **20–40**
* Validation targets:

  * work_items ≥ 12
  * notifications ≥ 20

---

## Overview — Feature Set 5: Guidance, Insights & Help

### Goal

Lightweight advisor layer producing actionable routing (no heavy AI).

### Page Inventory

* `AdvisorCardsPage`
  Route: `/overview/advisor`

* `RecommendedActionsPage`
  Route: `/overview/recommended-actions`

* `PlatformHelpChangeLogPage`
  Route: `/overview/help`

### Table Inventory (new)

* `advisor_cards`

  * `id`, `tenant_id`, `card_key`, `title`, `severity`
  * `rationale`, `recommended_action`, `deeplink_path`, `params` JSONB

### Seed Expectations

* `supabase/seed/086_overview_advisor_cards.sql`

  * advisor_cards: **10–20**
* Validation targets:

  * advisor_cards ≥ 10

---

## 3) Feature Area: Settings

### Purpose

Configure tenant governance + platform plumbing + defaults + preferences.
Security (Cybersecurity feature area) owns **policies + enforcement**.

---

## Settings — Feature Set 1: Tenant & Organization Setup

### Goal

Define “who you are” and basic governance defaults.

### Page Inventory (nLVE)

**View/Edit**

* `SettingsOrganizationPage`
  Route: `/settings/organization`

**List/View/Edit**

* `SettingsStreamsProgramsPage`
  Route: `/settings/streams`

**Edit (thin)**

* `SettingsNamingStandardsPage`
  Route: `/settings/naming-standards`

### Table Inventory (new)

* `tenant_profile`

  * `tenant_id` (PK/FK), `logo_url`, `region`, `timezone`, `currency_code`
  * `regulatory_profile` JSONB
* `streams`

  * `id`, `tenant_id`, `code` (Main/Pilot/R&D), `name`, `kind`, `status`, `is_default`
* `programs`

  * `id`, `tenant_id`, `name`, `description`, `status`
* `naming_standards` (thin)

  * `tenant_id`, `rules` JSONB (required fields, naming patterns, tag vocab)

### Seed Expectations

* `supabase/seed/090_settings_tenant_profile.sql`

  * tenant_profile: **1**
  * streams: **3** (Main/Pilot/R&D)
  * programs: **2–4**
* Validation targets:

  * streams ≥ 3
  * tenant_profile = 1

---

## Settings — Feature Set 2: Sites, Locations & Operational Context

### Goal

Shared hierarchy every feature area can reference.

### Page Inventory (nLVE)

**List/View/Edit**

* `SettingsSitesPage`
  Route: `/settings/sites`

* `SettingsOperationalHierarchyPage`
  Route: `/settings/hierarchy`

**Edit**

* `SettingsScopeDefaultsPage`
  Route: `/settings/scope-defaults`

### Table Inventory (new)

* `site_hierarchy_nodes`

  * `id`, `tenant_id`, `site_id`, `parent_id`
  * `node_type` (area/unit/line/group), `name`, `path`, `metadata` JSONB
* `scope_defaults`

  * `id`, `tenant_id`, `principal_type` (role/team/user), `principal_id`
  * `default_site_ids` UUID[], `default_stream_id`, `default_dashboard_id`

### Seed Expectations

* `supabase/seed/091_settings_hierarchy_scope.sql`

  * hierarchy nodes: **20–40** across the 3 sites
  * scope defaults: **5** (one per preset role)
* Validation targets:

  * hierarchy_nodes ≥ 20
  * scope_defaults ≥ 5

---

## Settings — Feature Set 3: Users, Teams & Delegation

### Goal

Collaboration setup without duplicating policy enforcement.

### Page Inventory (nLVE)

**List/View/Edit**

* `SettingsUsersTeamsPage`
  Route: `/settings/users`

**View**

* `SettingsUserDetailPage`
  Route: `/settings/users/:userId`

**Edit**

* `SettingsResponsibilitiesPage`
  Route: `/settings/responsibilities`

### Table Inventory (new)

* `user_profiles`

  * `user_id`, `tenant_id`, `display_name`, `persona_label`, `preferences` JSONB
* `teams`

  * `id`, `tenant_id`, `name`, `on_call_label` nullable
* `team_memberships`

  * `team_id`, `user_id`, `role` (lead/member)
* `responsibility_labels`

  * `id`, `tenant_id`, `code`, `name`

### Seed Expectations

* `supabase/seed/092_settings_users_teams.sql`

  * user_profiles: **8–15**
  * teams: **3–6**
  * memberships: **>= user_profiles**
  * responsibility labels: **8–12**
* Validation targets:

  * user_profiles ≥ 8
  * teams ≥ 3

---

## Settings — Feature Set 4: Integrations & Connectivity

### Goal

Manage connected systems and operational readiness.

### Page Inventory (nLVE)

**List**

* `SettingsIntegrationsCatalogPage`
  Route: `/settings/integrations`

**View**

* `SettingsIntegrationDetailPage`
  Route: `/settings/integrations/:integrationId`

**Edit**

* `SettingsIntegrationConfigPage`
  Route: `/settings/integrations/:integrationId/edit`

### Table Inventory (new)

* `integration_types`

  * `code`, `name`, `category` (CMMS/ERP/SCADA/Historian/Ticketing/etc.)
* `integrations`

  * `id`, `tenant_id`, `type_code`, `name`, `status`, `last_sync_at`, `config` JSONB
* `integration_mappings`

  * `id`, `integration_id`, `site_id`, `stream_id`, `mapping` JSONB
* `integration_health_events`

  * `id`, `tenant_id`, `integration_id`, `status`, `timestamp`, `details` JSONB

### Seed Expectations

* `supabase/seed/093_settings_integrations.sql`

  * integration_types: **8–12**
  * integrations: **3–6**
  * mappings: **>= integrations**
  * health_events: **10–20**
* Validation targets:

  * integration_types ≥ 8
  * integrations ≥ 3

---

## Settings — Feature Set 5: Data & Platform Defaults

### Goal

Control platform behavior, units, retention posture, enabled module footprint.

### Page Inventory (nLVE)

**View/Edit**

* `SettingsPlatformDefaultsPage`
  Route: `/settings/platform-defaults`

* `SettingsModulesTogglesPage`
  Route: `/settings/modules`

### Table Inventory (new)

* `tenant_units`

  * `tenant_id`, `unit_system` JSONB (°C/°F, kW/MW, bar/psi, date formats)
* `module_toggles`

  * `id`, `tenant_id`, `stream_id`, `feature_area`, `enabled`, `readiness_state`

### Seed Expectations

* `supabase/seed/094_settings_defaults_modules.sql`

  * tenant_units: **1**
  * module_toggles: **(feature areas × streams)** e.g., 8 feature areas × 3 streams = **24**
* Validation targets:

  * module_toggles ≥ 20

---

## Settings — Feature Set 6: User Settings

### Goal

Personalize experience without changing tenant governance.

### Page Inventory (nLVE)

**View/Edit**

* `SettingsMyProfilePage`
  Route: `/settings/me`

* `SettingsMyPreferencesPage`
  Route: `/settings/me/preferences`

* `SettingsMyNotificationsPage`
  Route: `/settings/me/notifications`

* `SettingsAccessibilityThemePage`
  Route: `/settings/me/accessibility`

### Table Inventory (new)

* `user_preferences`

  * `user_id`, `tenant_id`, `defaults` JSONB
* `notification_preferences`

  * `user_id`, `tenant_id`, `channels` JSONB, `digest_frequency`, `quiet_hours` JSONB

### Seed Expectations

* `supabase/seed/095_settings_user_prefs.sql`

  * user_preferences: **8–15** (match user_profiles)
  * notification_preferences: **8–15**
* Validation targets:

  * user_preferences ≥ 8

---

## 4) Data Governance & Implementation Rules

### Multi-tenant scoping

* All tables must include `tenant_id` unless they’re true global catalogs (e.g., `integration_types`).
* Seed must pin to tenant natural key and use UUID resolution.

### RLS (recommended baseline)

* Enable RLS on all tenant-scoped tables.
* Policies: tenant match based on JWT claims (later), while dev service role bypasses.

### Views over heavy UI aggregation

* Overview should read KPIs from **views** (`v_overview_kpis`) to keep the UI stable and avoid duplicating business logic in TS.

---

## 5) Seed Pack Standards (mandatory for these feature areas)

All seeds must follow your established standard:

* BEGIN/COMMIT
* precondition assertions (fail loudly)
* clean CTE pattern
* dependency-safe CTE ordering (lookup CTE referencing upsert CTE where needed)
* idempotent upserts (ON CONFLICT if unique exists; else WHERE NOT EXISTS)
* post-seed validation counts

---

## 6) Acceptance Criteria (per feature set)

A feature set is “done” only when:

1. Schema migrations applied cleanly to remote dev
2. `npx supabase db reset --linked` completes
3. Seed validations pass and row counts meet thresholds
4. Pages render end-to-end in **hybrid mode** using SupabaseProvider calls (no mock imports)
5. Deep links route into owning feature areas (even if those areas are still on mocks)

---
"

---

## 4) What You Must Generate

### 4.1 requirements.md (must be testable)
Produce a structured requirements doc with:
- scope + non-goals + assumptions
- functional requirements grouped by:
  - Overview feature sets (1–5)
  - Settings feature sets (1–6)
- explicit acceptance criteria per feature set:
  - “Given/When/Then” style where possible
- data requirements:
  - table-level requirements (columns, keys, constraints)
  - view/function requirements for KPI aggregation
- operational requirements:
  - multi-tenant scoping (tenant_id everywhere required)
  - seed idempotency + validation thresholds
  - deep-link routing requirements (“Open in Source”)
- “Out of scope” reminders (policy enforcement remains in CS feature area)

### 4.2 design.md (architecture + UX + data)
Produce a design doc that includes:
- high-level architecture (UI → DataProvider → Supabase)
- data model design
  - tables and relationships (describe joins, natural keys, tenant scoping)
  - which entities should be tables vs views vs JSONB
- query strategy
  - preferred views for KPIs (v_overview_kpis, etc.)
  - index strategy (tenant_id, created_at, status)
- RLS strategy (phase-appropriate)
  - RLS enabled + minimal policies placeholder
- UI design patterns
  - nLVE flows per page
  - routing map (routes for each page)
  - widget strategy (curated widgets now; configurable later)
- integration points
  - how Overview reads alerts/work items from other feature areas
  - how Settings links to Cybersecurity for enforcement pages
- seed pack strategy
  - naming conventions, order, validation counts

### 4.3 tasks.md (execution plan)
This must be a detailed, PR-friendly implementation plan, ordered to minimize risk.

**Format requirements for tasks.md**
- Split into phases by feature set and dependencies:
  - Phase 0: scaffolding / shared models
  - Phase 1: Settings foundations (streams, tenant_profile, user_profiles)
  - Phase 2: Overview foundations (dashboards/widgets/views)
  - Phase 3: Work items + notifications
  - Phase 4: platform health
  - Phase 5: integrations
  - Phase 6: remaining pages & polish
- Each task must include:
  - purpose
  - files to create/modify
  - acceptance check (how to verify)
  - seed expectations (what counts should change)
- Include checkpoints:
  - `supabase db reset --linked` passes
  - `VITE_DATA_BACKEND=hybrid` renders key Overview + Settings pages
- Include a “Definition of Done” checklist at the end.

**Very important:** tasks must include building:
- migrations for new tables/views
- new seed packs (080–095 ranges suggested by spec)
- SupabaseProvider methods (add methods to DataProvider for Overview & Settings)
- Pages for all routes listed in the spec

---

## 5) Constraints You Must Respect

- DO NOT implement security policy enforcement in Settings (link to CS pages only).
- DO NOT add new mock dataset files for Overview & Settings.
- DO NOT break existing Upstream O&G behavior.
- Ensure multi-tenant scoping on all new entities.
- Avoid “giant JSON config blob” anti-pattern; use JSONB only for flexible config fields.
- Keep schema evolvable for later sectors, but implement specifically for Power Transmission now.
- Match existing naming conventions and folder structure.

---

## 6) Output Formatting Rules

- Write the three documents as clean markdown.
- Use consistent headings and numbering.
- Use tables where helpful (pages list, tables list, seed list).
- Include explicit file paths for tasks and deliverables.
- Be precise: no placeholders like “do something here.”

---

## 7) Final Instruction

Proceed to generate:
- `/docs/overview-settings/requirements.md`
- `/docs/overview-settings/design.md`
- `/docs/overview-settings/tasks.md`

Use the Feature Specification pasted above as the single source of truth.
```
