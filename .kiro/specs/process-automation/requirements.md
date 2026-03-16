# Process Automation - Requirements

**Feature Name:** `process-automation`  
**Target Sector:** Power → Transmission  
**Data Backend:** Supabase (local only, via HybridProvider)  
**Created:** 2026-01-23

---

## 1. Overview

The Process Automation (PA) feature area provides a comprehensive suite of tools for managing industrial automation in Power Transmission systems. It enables operators and engineers to configure, monitor, and control automated processes across substations, transformers, breakers, and other transmission equipment.

### 1.1 Problem Statement

Power transmission operators currently face challenges with manual configuration of automation systems, leading to:
- Time-consuming setup and maintenance of automation rules
- Configuration errors that can impact system reliability
- Lack of visibility into automation execution and performance
- Difficulty tracking changes and maintaining audit trails for compliance
- Limited ability to test automation logic before deployment

### 1.2 Business Goals

- **Reduce manual configuration time** by 50% through automated workflows
- **Increase automation coverage** to 80% of transmission processes
- **Reduce configuration errors** by 70% through validation and simulation
- **Improve change management** with version control and approval workflows
- **Enhance auditability** with comprehensive audit logging

### 1.3 Target Users

- **Control Engineers:** Configure automation logic, workflows, and control rules
- **Operations Staff:** Monitor automation execution, respond to alerts
- **Maintenance Engineers:** Create maintenance workflows and sequences
- **System Administrators:** Manage approvals, versions, and audit logs
- **Compliance Officers:** Review audit trails and approval history

### 1.4 Key Features Summary

This feature area includes 5 major feature sets:
- **Integrate & Model:** Tag mapping, control models, and action bindings for connecting physical equipment to automation logic
- **Monitor & Detect:** Triggers, alarm rules, and event patterns for event-driven automation
- **Automate & Control:** Workflows, sequences, and control rules for orchestrating complex operations
- **Govern & Assure:** Versions, approvals, simulations, and audit logs for governance and compliance
- **Dashboard & Monitoring:** Real-time dashboards and alert management for operational visibility

---

## 2. Functional Requirements

### Feature Set A: Integrate & Model

**Purpose:** Build foundational data model for connecting physical equipment to automation logic.

#### 2.1 Tag Mapping

**User Story:** As a control engineer, I want to map physical sensor/actuator tags to logical variables so that automation logic can reference standardized variable names.

**Acceptance Criteria:**
- AC 2.1.1: Can create tag mappings with source tag, target variable, data type, unit, and scaling factor
- AC 2.1.2: Can view list of all tag mappings filtered by status and data type
- AC 2.1.3: Can edit existing tag mappings and update configuration
- AC 2.1.4: Can archive tag mappings that are no longer needed
- AC 2.1.5: System validates unique source_tag + target_variable per tenant
- AC 2.1.6: Can view linked assets using each tag mapping
- AC 2.1.7: Can view change history for each tag mapping

#### 2.2 Control Models

**User Story:** As a control engineer, I want to define state machines for equipment so that automation can track and control equipment operational states.

**Acceptance Criteria:**
- AC 2.2.1: Can create control models with multiple states and transitions
- AC 2.2.2: Can view list of all control models filtered by status
- AC 2.2.3: Can edit states and transitions with visual state diagram
- AC 2.2.4: Can set current state for each control model
- AC 2.2.5: System validates at least 2 states per model
- AC 2.2.6: Can view assets using each control model
- AC 2.2.7: Can view state change history

#### 2.3 Action Bindings

**User Story:** As a control engineer, I want to define executable actions on actuators so that automation workflows can trigger physical operations.

**Acceptance Criteria:**
- AC 2.3.1: Can create action bindings with action, actuator, and parameters
- AC 2.3.2: Can categorize actions as control, safety, or maintenance
- AC 2.3.3: Can view list of all action bindings filtered by category and status
- AC 2.3.4: Can edit action parameters using JSON editor
- AC 2.3.5: System validates required fields and JSON syntax
- AC 2.3.6: Can view systems using each action binding
- AC 2.3.7: Can view action execution history

---

### Feature Set B: Monitor & Detect

**Purpose:** Build detection layer for event-driven automation and alarm management.

#### 2.4 Triggers

**User Story:** As a control engineer, I want to define event-driven automation rules so that the system automatically responds to operational conditions.

**Acceptance Criteria:**
- AC 2.4.1: Can create triggers with condition expression and action bindings
- AC 2.4.2: Can set priority level (low, medium, high, critical)
- AC 2.4.3: Can categorize triggers as safety, operational, or maintenance
- AC 2.4.4: Can enable/disable triggers without deleting them
- AC 2.4.5: Can view list of triggers filtered by priority, type, and enabled status
- AC 2.4.6: Can edit trigger conditions using code editor with syntax highlighting
- AC 2.4.7: Can view trigger execution history from audit logs

#### 2.5 Alarm Rules

**User Story:** As an operations engineer, I want to define alarm classification and routing rules so that alarms are properly prioritized and routed to the right personnel.

**Acceptance Criteria:**
- AC 2.5.1: Can create alarm rules with classification and severity
- AC 2.5.2: Can configure routing destinations (email, SMS, webhook)
- AC 2.5.3: Can set auto-acknowledge and escalation time
- AC 2.5.4: Can view list of alarm rules filtered by classification and severity
- AC 2.5.5: Can edit routing destinations and escalation settings
- AC 2.5.6: System validates routing destination formats
- AC 2.5.7: Can view alarm activation history

#### 2.6 Event Patterns (Advanced)

**User Story:** As a control engineer, I want to detect complex event patterns so that the system can identify trends, sequences, and anomalies.

**Acceptance Criteria:**
- AC 2.6.1: Can create event patterns with pattern type (trend, sequence, oscillation, degradation)
- AC 2.6.2: Can configure time window for pattern matching
- AC 2.6.3: Can define match conditions and actions
- AC 2.6.4: Can view list of event patterns filtered by type and status
- AC 2.6.5: Can edit pattern configuration with visualization
- AC 2.6.6: System validates at least 2 events for sequence patterns
- AC 2.6.7: Can view pattern detection history

---

### Feature Set C: Automate & Control

**Purpose:** Build orchestration layer for multi-step procedures and continuous control.

#### 2.7 Workflows

**User Story:** As a control engineer, I want to define multi-step automated procedures so that complex operations can be executed reliably and consistently.

**Acceptance Criteria:**
- AC 2.7.1: Can create workflows with multiple steps
- AC 2.7.2: Can configure trigger type (manual, automatic, scheduled)
- AC 2.7.3: Can set approval requirement for safety-critical workflows
- AC 2.7.4: Can execute manual workflows with single button click
- AC 2.7.5: Can view workflow execution status (idle, running, completed, failed)
- AC 2.7.6: Can view list of workflows filtered by trigger type and execution status
- AC 2.7.7: Can edit workflow steps with add/remove/reorder functionality
- AC 2.7.8: Can view workflow execution history with results

#### 2.8 Sequences

**User Story:** As a control engineer, I want to define detailed step-by-step procedures with precise timing so that coordinated equipment operations are executed correctly.

**Acceptance Criteria:**
- AC 2.8.1: Can create sequences with ordered steps
- AC 2.8.2: Can set execution mode (sequential, parallel, conditional)
- AC 2.8.3: Can configure step duration and conditions
- AC 2.8.4: System auto-calculates total duration from step durations
- AC 2.8.5: Can view list of sequences filtered by execution mode and status
- AC 2.8.6: Can edit sequence steps with timeline visualization
- AC 2.8.7: Can view sequence execution history

#### 2.9 Control Rules

**User Story:** As a control engineer, I want to define continuous control logic so that the system maintains operational parameters automatically.

**Acceptance Criteria:**
- AC 2.9.1: Can create control rules with rule type (if-then, when-then, continuous)
- AC 2.9.2: Can configure condition expression and action bindings
- AC 2.9.3: Can set priority level and enable/disable rules
- AC 2.9.4: Can view list of control rules filtered by type, priority, and enabled status
- AC 2.9.5: Can edit rule conditions using code editor
- AC 2.9.6: System validates condition syntax
- AC 2.9.7: Can view rule execution history

---

### Feature Set D: Govern & Assure

**Purpose:** Build governance layer for version control, approvals, simulation, and audit trails.

#### 2.10 Versions

**User Story:** As a system administrator, I want to track versions of automation configurations so that changes are documented and can be rolled back if needed.

**Acceptance Criteria:**
- AC 2.10.1: Can create versions with semantic version numbers (X.Y.Z)
- AC 2.10.2: Can document change type (major, minor, patch) and description
- AC 2.10.3: Can link affected components (workflows, triggers, etc.)
- AC 2.10.4: Can view list of versions filtered by change type and approval status
- AC 2.10.5: System validates semantic versioning format
- AC 2.10.6: Can view version history chain (previous versions)
- AC 2.10.7: Can navigate to affected components from version details

#### 2.11 Approvals

**User Story:** As a system administrator, I want to manage approval workflows for changes so that safety-critical modifications are reviewed before deployment.

**Acceptance Criteria:**
- AC 2.11.1: Can create approval requests with approver list
- AC 2.11.2: Can link approval to related PA record (workflow, trigger, etc.)
- AC 2.11.3: Can approve or reject pending approvals with reason
- AC 2.11.4: Can view list of approvals filtered by status and requester
- AC 2.11.5: Can view approval workflow visualization showing current step
- AC 2.11.6: System tracks approval timeline (requested → reviewed → approved/rejected)
- AC 2.11.7: Can navigate to related PA record from approval details

#### 2.12 Simulations

**User Story:** As a control engineer, I want to simulate automation components before deployment so that I can validate behavior and identify issues.

**Acceptance Criteria:**
- AC 2.12.1: Can create simulations for workflows, triggers, sequences, and control rules
- AC 2.12.2: Can configure input parameters and expected outcome
- AC 2.12.3: Can execute simulations with single button click
- AC 2.12.4: Can view simulation status (pending, running, completed, failed)
- AC 2.12.5: Can view simulation results and compare with expected outcome
- AC 2.12.6: Can view list of simulations filtered by type and status
- AC 2.12.7: System calculates and displays simulation duration

#### 2.13 Audit Logs

**User Story:** As a compliance officer, I want to view comprehensive audit trails so that all automation operations are traceable for compliance and troubleshooting.

**Acceptance Criteria:**
- AC 2.13.1: System automatically logs all create, update, delete, execute, approve, reject events
- AC 2.13.2: Can view list of audit logs filtered by event type, record type, user, and date range
- AC 2.13.3: Can view before/after changes for update events
- AC 2.13.4: Can view execution results for execute events
- AC 2.13.5: Can view user information (name, IP address, user agent)
- AC 2.13.6: Can export filtered audit logs to CSV
- AC 2.13.7: Audit logs are read-only (cannot be edited or deleted)

---

### Feature Set E: Dashboard & Monitoring

**Purpose:** Provide high-level monitoring and alert management for automation operations.

#### 2.14 Automation Dashboard

**User Story:** As an operations engineer, I want to view a dashboard of automation metrics so that I can monitor system health and performance at a glance.

**Acceptance Criteria:**
- AC 2.14.1: Dashboard displays KPI cards for workflows, triggers, alarm rules, approvals, simulations, and audit events
- AC 2.14.2: Dashboard displays charts for workflow execution timeline, trigger activation heatmap, approval status distribution, and audit event types
- AC 2.14.3: Can filter dashboard by time range (last 24h, 7 days, 30 days, custom)
- AC 2.14.4: Can manually refresh dashboard data
- AC 2.14.5: Can enable auto-refresh (every 30 seconds)
- AC 2.14.6: Can navigate to detail pages from dashboard quick actions
- AC 2.14.7: Running items show pulse indicator for visual feedback

#### 2.15 Automation Alerts

**User Story:** As an operations engineer, I want to view and respond to automation alerts so that I can quickly address issues and incidents.

**Acceptance Criteria:**
- AC 2.15.1: Can view list of alerts filtered by type, severity, and status
- AC 2.15.2: System generates alerts for trigger activations, workflow failures, and approval requests
- AC 2.15.3: Can acknowledge open alerts
- AC 2.15.4: Can resolve acknowledged alerts
- AC 2.15.5: Can view alert details with timeline (created → acknowledged → resolved)
- AC 2.15.6: Can navigate to related PA record from alert details
- AC 2.15.7: Can perform bulk actions (acknowledge/resolve multiple alerts)

---

## 3. Non-Functional Requirements

### 3.1 Performance

- NFR 3.1.1: List pages load in < 2 seconds
- NFR 3.1.2: Detail pages load in < 1 second
- NFR 3.1.3: Filters respond in < 500ms
- NFR 3.1.4: Charts render in < 1 second
- NFR 3.1.5: Dashboard auto-refresh doesn't cause UI lag

### 3.2 Security

- NFR 3.2.1: All queries scoped to tenant_id (no cross-tenant access)
- NFR 3.2.2: All user actions logged in audit logs
- NFR 3.2.3: All sensitive operations require confirmation
- NFR 3.2.4: All input sanitized (no SQL injection, XSS)
- NFR 3.2.5: All JSONB fields validated

### 3.3 Accessibility

- NFR 3.3.1: All pages keyboard navigable
- NFR 3.3.2: All interactive elements have focus indicators
- NFR 3.3.3: All form inputs have labels
- NFR 3.3.4: All error messages announced to screen readers
- NFR 3.3.5: All badges have accessible text (not just color)

### 3.4 Data Integrity

- NFR 3.4.1: All FK constraints enforced (no orphaned records)
- NFR 3.4.2: All unique constraints enforced (no duplicates)
- NFR 3.4.3: All check constraints enforced (valid enum values)
- NFR 3.4.4: All JSONB fields validated (no malformed JSON)
- NFR 3.4.5: All timestamps use ISO 8601 format

### 3.5 Maintainability

- NFR 3.5.1: All tables prefixed with `pa_`
- NFR 3.5.2: All indexes follow naming convention
- NFR 3.5.3: All TypeScript interfaces documented with JSDoc
- NFR 3.5.4: All DataProvider methods documented
- NFR 3.5.5: All seed data includes precondition assertions

---

## 4. Constraints

### 4.1 Technical Constraints

- **CRITICAL:** MUST use local Supabase only (never `--linked` or remote database)
- **CRITICAL:** NEVER run migrations against remote/production database
- **CRITICAL:** All development and testing MUST be local only (`npx supabase start`)
- **CRITICAL:** MUST NOT modify existing mock data files in `src/data/*` - mock data is READ-ONLY
- **CRITICAL:** MUST use HybridProvider routing:
  - **Power Transmission sector** → SupabaseProvider (local Supabase)
  - **Oil & Gas Upstream sector** → MockProvider (existing mock data)
  - **All other sectors** → MockProvider (existing mock data)
- MUST follow nLVE pattern (Navigate → List → View → Edit)
- MUST implement iteratively (complete data + API + UI + verification per feature set)
- NO Row-Level Security (RLS) policies - all tables unrestricted for local development
- NO authentication/authorization checks - permissive local access only

### 4.2 Data Constraints

- MUST preserve existing baseline (tenants, sites, assets, grid_nodes, grid_lines)
- MUST NOT break existing seed data row counts
- MUST maintain FK integrity with core tables
- MUST scope all queries to tenant_id
- MUST use JSONB for flexible/nested data structures
- **CRITICAL:** MUST NOT modify mock data files (`src/data/mockData.ts`, `src/data/upstreamMockData.ts`, etc.)
- **CRITICAL:** Mock data is READ-ONLY - only add Supabase data for Power Transmission
- **CRITICAL:** Oil & Gas and other sectors continue using existing mock data unchanged

### 4.3 UI Constraints

- MUST follow existing design patterns (StatusBadge, EmptyState, LoadingState)
- MUST use existing UI components from `src/components/ui`
- MUST implement all tabs per PROCESS_AUTOMATION_PAGES.md
- MUST provide empty/loading/error states for all pages
- MUST implement cross-linking between related records

---

## 5. Dependencies

### 5.1 External Dependencies

- **Local Supabase ONLY** - running via `npx supabase start` (NEVER remote/linked)
- Core tables seeded (tenants, sites, assets, telemetry_points, alerts)
- HybridProvider configured in `.env.development`
- **Existing mock data files** - READ-ONLY, no modifications allowed
- **NO remote database access** - all work local only
- **NO RLS policies** - tables unrestricted for local development

### 5.2 HybridProvider Routing Strategy

The HybridProvider MUST route data requests based on sector:

```typescript
// Power Transmission → SupabaseProvider (local Supabase)
if (sector === 'Power' && subsector === 'Transmission') {
  return supabaseProvider.getProcessAutomationData();
}

// Oil & Gas Upstream → MockProvider (existing mock data)
if (sector === 'Oil & Gas' && subsector === 'Upstream') {
  return mockProvider.getProcessAutomationData();
}

// All other sectors → MockProvider (existing mock data)
return mockProvider.getProcessAutomationData();
```

**Key Points:**
- Power Transmission uses NEW Supabase data (local only)
- Oil & Gas Upstream uses EXISTING mock data (unchanged)
- All other sectors use EXISTING mock data (unchanged)
- NO modifications to mock data files

### 5.3 Internal Dependencies

- Feature Set A → Feature Set B (triggers depend on action bindings)
- Feature Set B → Feature Set C (workflows depend on triggers)
- Feature Set C → Feature Set D (versions/approvals depend on workflows)
- Feature Set D → Feature Set E (dashboard depends on audit logs)
- **HybridProvider** → Must correctly route Power Transmission to Supabase, others to MockProvider

---

## 6. Out of Scope

The following are explicitly OUT OF SCOPE for this implementation:

- **Remote/Production Database** - NO changes to remote Supabase (local only)
- **Row-Level Security (RLS)** - NO RLS policies (unrestricted local access)
- **Authentication/Authorization** - NO auth checks (permissive local development)
- Real-time workflow execution (WebSocket updates) - Future Phase 2
- Integration with external SCADA systems - Future Phase 3
- Multi-tenant collaboration (shared workflows) - Future Phase 3
- AI-powered automation recommendations - Future Phase 2
- Mobile app for field operations - Future Phase 2
- Remote Supabase deployment - Local only for now

---

## 7. Success Criteria

The Process Automation feature area is considered successful when:

1. All 13 PA tables created and seeded with demo data
2. All 60+ DataProvider methods implemented in SupabaseProvider
3. All 15 pages implemented following nLVE pattern
4. All acceptance criteria met (AC 2.1.1 through AC 2.15.7)
5. All non-functional requirements met (NFR 3.1.1 through NFR 3.5.5)
6. All SQL verification queries pass
7. All UI verification steps pass
8. Zero console errors or TypeScript errors
9. Build passes and dev server runs
10. No changes to existing mock data files

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-23  
**Status:** Ready for Design

