# Requirements Document: Operational Excellence (Optimise) - Transmission

## Introduction

This document specifies the requirements for the Operational Excellence (Optimise) feature area for the Power Transmission sector. The feature area encompasses three integrated feature sets:

1. **Lean Execution (SIM)** - Shift Intelligence Management for real-time operational control
2. **Continuous Improvement (CI)** - Structured problem-solving and improvement project management
3. **Optimisation (AI-powered)** - AI-driven opportunity identification and decision support

All three feature sets are designed specifically for transmission grid operations, focusing on reliability, efficiency, and continuous improvement of transmission infrastructure.

## Glossary

- **System**: The Plant4.0 Operational Excellence module for Power Transmission
- **Tenant**: DEWA - Transmission organization
- **SIM**: Shift Intelligence Management - operational control boards
- **CI**: Continuous Improvement - structured improvement methodology
- **RCA**: Root Cause Analysis - systematic problem investigation
- **OEE**: Overall Equipment Effectiveness - performance metric
- **SAIDI**: System Average Interruption Duration Index
- **SAIFI**: System Average Interruption Frequency Index
- **Grid_Node**: Substation or junction point in transmission network
- **Grid_Line**: Transmission line connecting grid nodes
- **Switching_Order**: Planned switching operation on transmission equipment
- **Outage**: Planned or unplanned service interruption
- **Bottleneck**: Transmission constraint limiting power flow
- **Opportunity**: AI-identified optimization potential
- **Playbook**: Standardized optimization procedure
- **Simulation**: Scenario modeling for optimization testing

## Requirements

### Requirement 1: Lean Execution (SIM) - Shift Intelligence Management

**User Story:** As a transmission control center operator, I want to manage shift operations through SIM boards, so that I can track performance, coordinate switching operations, manage outages, and resolve issues in real-time.

#### Acceptance Criteria

1. WHEN a control center operator views SIM boards, THE System SHALL display boards organized by day/shift and optionally by site/region
2. WHEN viewing a SIM board, THE System SHALL display KPI tiles including system loading, alerts count, outages count, switching backlog, and reliability proxy metrics
3. WHEN a SIM board is selected, THE System SHALL display linked switching orders, outages, issues, and actions
4. THE System SHALL allow filtering SIM boards by tenant, site, date range, and shift
5. THE System SHALL persist all SIM board data to Supabase with tenant isolation

### Requirement 2: Switching Orders Management

**User Story:** As a transmission operator, I want to create and track switching orders, so that I can safely execute planned switching operations on transmission equipment.

#### Acceptance Criteria

1. WHEN creating a switching order, THE System SHALL capture order number, description, priority, planned window, assigned owner, and impacted equipment
2. WHEN a switching order is created, THE System SHALL link it to impacted grid nodes, grid lines, and/or assets
3. THE System SHALL track switching order status lifecycle (pending, approved, in-progress, completed, cancelled)
4. WHEN viewing a switching order, THE System SHALL display all linked grid topology and asset impacts
5. THE System SHALL enforce that at least one impact target (node, line, or asset) is specified per switching order
6. THE System SHALL allow updating switching order status and execution timestamps
7. THE System SHALL persist all switching orders to Supabase with tenant isolation

### Requirement 3: Outage Coordination

**User Story:** As a transmission operator, I want to coordinate planned and unplanned outages, so that I can minimize customer impact and track restoration progress.

#### Acceptance Criteria

1. WHEN creating an outage record, THE System SHALL capture outage reference, type (planned/unplanned), start time, estimated restoration time, and impact level
2. WHEN an outage is created, THE System SHALL link it to impacted grid nodes, grid lines, and/or assets
3. THE System SHALL track outage status lifecycle (scheduled, active, resolved)
4. WHEN viewing an outage, THE System SHALL display all linked grid topology and asset impacts
5. THE System SHALL enforce that at least one impact target (node, line, or asset) is specified per outage
6. THE System SHALL allow updating outage status, ETA, and actual restoration time
7. THE System SHALL persist all outages to Supabase with tenant isolation

### Requirement 4: Issues and Actions Management

**User Story:** As a shift supervisor, I want to log issues and create actions with owners and due dates, so that I can track problem resolution and ensure accountability.

#### Acceptance Criteria

1. WHEN logging an issue, THE System SHALL capture issue reference, description, category, priority, and timestamp
2. WHEN creating an action, THE System SHALL capture action reference, description, owner, due date, and status
3. THE System SHALL allow linking actions to issues, switching orders, outages, assets, nodes, and/or lines
4. THE System SHALL enforce that at least one link target is specified per action
5. THE System SHALL track action status (pending, in-progress, completed)
6. THE System SHALL allow escalation of issues based on priority and age
7. THE System SHALL persist all issues and actions to Supabase with tenant isolation

### Requirement 5: Continuous Improvement (CI) - Project Pipeline

**User Story:** As a CI coordinator, I want to manage improvement projects through a kanban-style pipeline, so that I can track projects from identification through verification.

#### Acceptance Criteria

1. WHEN viewing CI projects, THE System SHALL display projects in stages: Backlog, Analysis, Countermeasures, Implementation, Verification, Closed
2. WHEN creating a CI project, THE System SHALL capture project reference, title, stage, site, owner, priority, status, start date, due date, summary, and tags
3. THE System SHALL allow linking CI projects to assets, grid nodes, grid lines, and alerts
4. THE System SHALL enforce that project reference is unique per tenant
5. THE System SHALL allow moving projects between stages
6. THE System SHALL support transmission-specific project templates: relay misoperation reduction, loss reduction, SAIDI/SAIFI improvement, transformer loading, trip cause investigations
7. THE System SHALL persist all CI projects to Supabase with tenant isolation

### Requirement 6: Root Cause Analysis (RCA) Tooling

**User Story:** As a CI analyst, I want to conduct structured root cause analysis, so that I can identify underlying causes of transmission problems.

#### Acceptance Criteria

1. WHEN conducting RCA for a CI project, THE System SHALL support 5-Whys methodology
2. WHEN conducting RCA, THE System SHALL support fishbone-like structured fields for categorizing causes
3. THE System SHALL allow linking RCA to a CI project
4. THE System SHALL allow linking RCA to assets, grid nodes, grid lines, and alerts
5. THE System SHALL store RCA content in JSONB format for flexible structure
6. THE System SHALL enforce that RCA type is unique per project
7. THE System SHALL persist all RCA data to Supabase with tenant isolation

### Requirement 7: Countermeasure Tracking

**User Story:** As a CI project owner, I want to track countermeasures with owners, due dates, and effectiveness, so that I can ensure corrective actions are implemented and validated.

#### Acceptance Criteria

1. WHEN creating a countermeasure, THE System SHALL capture countermeasure reference, project link, owner, status, due date, summary, and effectiveness score
2. THE System SHALL track countermeasure status (planned, in-progress, completed, verified)
3. THE System SHALL allow recording effectiveness scores (0-100) after implementation
4. THE System SHALL enforce that countermeasure reference is unique per tenant
5. THE System SHALL link countermeasures to their parent CI project
6. THE System SHALL persist all countermeasures to Supabase with tenant isolation

### Requirement 8: KPI and Impact Tracking

**User Story:** As a CI coordinator, I want to track KPIs and measure project impact, so that I can demonstrate improvement value and ROI.

#### Acceptance Criteria

1. WHEN defining KPIs for CI projects, THE System SHALL support transmission-specific KPIs: loss percentage, SAIDI/SAIFI proxies, misoperation frequency, transformer loading, trip count
2. WHEN linking KPIs to projects, THE System SHALL allow many-to-many relationships
3. WHEN tracking impact, THE System SHALL capture baseline, target, and actual values for each KPI
4. THE System SHALL calculate impact value as (actual - baseline) / (target - baseline) * 100
5. THE System SHALL allow storing impact notes and context
6. THE System SHALL persist all KPI definitions and impact measurements to Supabase with tenant isolation

### Requirement 9: CI Documents Metadata

**User Story:** As a CI team member, I want to attach document metadata to projects, so that I can reference supporting materials and reports.

#### Acceptance Criteria

1. WHEN attaching documents to CI projects, THE System SHALL capture document reference, name, type, and URL
2. THE System SHALL enforce that document reference is unique per project
3. THE System SHALL support document types: report, analysis, procedure, photo, diagram, other
4. THE System SHALL NOT store actual file content (metadata only)
5. THE System SHALL persist all document metadata to Supabase with tenant isolation

### Requirement 10: Optimisation - Opportunity Inbox

**User Story:** As an optimization analyst, I want to view ranked optimization opportunities with impact estimates, so that I can prioritize improvement initiatives.

#### Acceptance Criteria

1. WHEN viewing opportunities, THE System SHALL display opportunities ranked by impact score
2. WHEN viewing an opportunity, THE System SHALL display opportunity reference, title, category, site, status, rank score, expected impact, confidence, and summary
3. THE System SHALL allow filtering opportunities by site, category, confidence level, and status
4. THE System SHALL track opportunity status (new, under-review, approved, published, rejected)
5. THE System SHALL enforce that opportunity reference is unique per tenant
6. THE System SHALL persist all opportunities to Supabase with tenant isolation

### Requirement 11: AI Recommendations

**User Story:** As an optimization analyst, I want to view AI-generated recommendations for each opportunity, so that I can understand suggested actions and their rationale.

#### Acceptance Criteria

1. WHEN viewing recommendations for an opportunity, THE System SHALL display one-to-many recommendations
2. WHEN viewing a recommendation, THE System SHALL display recommendation reference, text, confidence, expected benefit, assumptions, and risks
3. THE System SHALL store assumptions and risks in JSONB format for flexible structure
4. THE System SHALL enforce that recommendation reference is unique per tenant
5. THE System SHALL link recommendations to their parent opportunity
6. THE System SHALL persist all recommendations to Supabase with tenant isolation

### Requirement 12: Optimization Playbooks

**User Story:** As an optimization team lead, I want to maintain reusable playbook templates, so that I can standardize optimization approaches across similar scenarios.

#### Acceptance Criteria

1. WHEN creating playbooks, THE System SHALL capture playbook code, name, description, and steps
2. THE System SHALL store playbook steps in JSONB format for flexible structure
3. THE System SHALL allow linking playbooks to opportunities (many-to-many)
4. THE System SHALL enforce that playbook code is unique per tenant
5. THE System SHALL support transmission-specific playbook categories: loss reduction, reliability improvement, loading optimization, voltage management
6. THE System SHALL persist all playbooks to Supabase with tenant isolation

### Requirement 13: Simulation Runs

**User Story:** As an optimization analyst, I want to run simulations to test optimization scenarios, so that I can validate approaches before implementation.

#### Acceptance Criteria

1. WHEN creating a simulation run, THE System SHALL capture simulation reference, opportunity link, inputs, outputs, and comparison metrics
2. THE System SHALL store inputs, outputs, and comparison data in JSONB format for flexible structure
3. THE System SHALL link simulations to their parent opportunity
4. THE System SHALL enforce that simulation reference is unique per tenant
5. THE System SHALL timestamp all simulation runs
6. THE System SHALL persist all simulations to Supabase with tenant isolation

### Requirement 14: Publish Actions to Execution

**User Story:** As an optimization coordinator, I want to publish approved opportunities to SIM or CI, so that I can transition from analysis to execution.

#### Acceptance Criteria

1. WHEN publishing an opportunity to SIM, THE System SHALL create a switching order and record a publish event
2. WHEN publishing an opportunity to CI, THE System SHALL create a CI project and record a publish event
3. THE System SHALL capture publish event reference, opportunity link, target type (SIM or CI), target ID, payload, and timestamp
4. THE System SHALL store publish payload in JSONB format for flexible structure
5. THE System SHALL enforce that publish event reference is unique per tenant
6. THE System SHALL allow null target_id with descriptive payload for audit purposes
7. THE System SHALL persist all publish events to Supabase with tenant isolation

### Requirement 15: Hybrid Data Provider Integration

**User Story:** As a developer, I want all Operational Excellence data to be accessed through a hybrid data provider that routes to the appropriate backend based on sector, so that Oil & Gas tenants use mock data while Power Transmission tenants use Supabase.

#### Acceptance Criteria

1. THE System SHALL extend DataProvider interface with SIM methods: getSimBoards, getSimBoardById, getSimKpis, listSwitchingOrders, getSwitchingOrder, createSwitchingOrder, updateSwitchingOrder, listOutages, getOutage, createOutage, updateOutage, listSimIssues, createSimIssue, updateSimIssue, listSimActions, createSimAction, updateSimAction
2. THE System SHALL extend DataProvider interface with CI methods: getCiStages, listCiProjects, getCiProject, createCiProject, updateCiProject, moveCiProjectStage, getCiProjectRca, upsertCiProjectRca, listCiCountermeasures, createCiCountermeasure, updateCiCountermeasure, listCiProjectKpis, upsertCiImpact, listCiDocuments, createCiDocument
3. THE System SHALL extend DataProvider interface with Optimisation methods: listOpportunities, getOpportunity, updateOpportunity, listRecommendations, createSimulation, listSimulations, listPlaybooks, linkPlaybookToOpportunity, publishOpportunityToSim, publishOpportunityToCi
4. THE System SHALL implement all methods in SupabaseProvider with proper tenant filtering for Power Transmission sector
5. THE System SHALL implement all methods in MockProvider returning mock data from mockData.ts for Oil & Gas sector
6. THE System SHALL implement all methods in HybridProvider with sector-based routing logic:
   - Oil & Gas sector tenants → MockProvider (uses src/data/mockData.ts)
   - Power sector tenants with UUID → SupabaseProvider (uses local Supabase database)
   - Power sector tenants without UUID → MockProvider (returns empty arrays)
   - Other sectors → MockProvider
7. THE System SHALL determine tenant sector by calling getTenantById() and checking the sector field
8. THE System SHALL log routing decisions for debugging purposes
9. THE System SHALL handle provider selection errors gracefully by defaulting to MockProvider

### Requirement 16: UI Navigation and Routing

**User Story:** As a transmission operator, I want to navigate between SIM, CI, and Optimisation features, so that I can access all operational excellence tools.

#### Acceptance Criteria

1. WHEN viewing the Optimise feature area, THE System SHALL display four feature sets: Performance, Lean Execution (SIM), Continuous Improvement (CI), Optimisation
2. WHEN navigating to Lean Execution, THE System SHALL display sub-features: SIM Boards, Shift Performance, Issues, Actions
3. WHEN navigating to Continuous Improvement, THE System SHALL display sub-features: CI Projects, RCA, Countermeasures, Impact Tracking, CI Reports
4. WHEN navigating to Optimisation, THE System SHALL display sub-features: Opportunities, Recommendations, Playbooks, Simulations, Execution
5. THE System SHALL update navigation.ts to include all routes
6. THE System SHALL follow nLVE pattern (Navigate, List, View, Edit) for all pages

### Requirement 17: Tenant Context and Filtering

**User Story:** As a system administrator, I want all Operational Excellence data to be tenant-isolated, so that multi-tenant security is maintained.

#### Acceptance Criteria

1. WHEN querying any Operational Excellence data, THE System SHALL filter by tenant_id
2. WHEN creating any Operational Excellence record, THE System SHALL set tenant_id from current context
3. THE System SHALL enforce Row Level Security (RLS) policies on all tables
4. THE System SHALL use the tenant context from AppContext
5. THE System SHALL validate tenant_id matches current user's tenant before any write operation

### Requirement 18: Error Handling and Loading States

**User Story:** As a user, I want clear feedback when data is loading or errors occur, so that I understand system state.

#### Acceptance Criteria

1. WHEN loading data, THE System SHALL display loading indicators
2. WHEN errors occur, THE System SHALL display user-friendly error messages
3. WHEN no data exists, THE System SHALL display appropriate empty states
4. THE System SHALL use ErrorBoundary components to catch and handle React errors
5. THE System SHALL log errors for debugging while showing safe messages to users

### Requirement 19: Data Validation and Constraints

**User Story:** As a data administrator, I want data validation enforced at the database level, so that data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL enforce natural key uniqueness constraints on all tables
2. THE System SHALL enforce check constraints on status enums
3. THE System SHALL enforce referential integrity with foreign keys
4. THE System SHALL enforce that impact links specify at least one target (node, line, or asset)
5. THE System SHALL enforce that resolved records have resolution timestamps
6. THE System SHALL use database triggers for automatic timestamp updates

### Requirement 20: Seed Data and Demo Content

**User Story:** As a developer, I want realistic seed data for demonstration, so that I can showcase features with meaningful content.

#### Acceptance Criteria

1. THE System SHALL provide seed data for minimum 6 SIM boards (2 days × 3 sites)
2. THE System SHALL provide seed data for minimum 12 switching orders
3. THE System SHALL provide seed data for minimum 6 outages
4. THE System SHALL provide seed data for minimum 15 issues and 25 actions
5. THE System SHALL provide seed data for minimum 12 CI projects across all stages
6. THE System SHALL provide seed data for minimum 12 RCA records
7. THE System SHALL provide seed data for minimum 30 countermeasures
8. THE System SHALL provide seed data for minimum 6 KPIs with impact measurements
9. THE System SHALL provide seed data for minimum 20 opportunities
10. THE System SHALL provide seed data for minimum 50 recommendations
11. THE System SHALL provide seed data for minimum 10 playbooks
12. THE System SHALL provide seed data for minimum 12 simulations
13. THE System SHALL provide seed data for minimum 10 publish events
14. THE System SHALL use clean CTE pattern with precondition assertions
15. THE System SHALL use idempotent upserts via natural keys
16. THE System SHALL include post-seed validations to verify minimum counts

### Requirement 22: Hybrid Tenant Management

**User Story:** As a user, I want the tenant list to show both Oil & Gas tenants from mock data and Power Transmission tenants from Supabase, so that I can switch between different sector tenants seamlessly.

#### Acceptance Criteria

1. WHEN calling getTenants(), THE System SHALL merge tenants from both MockProvider and SupabaseProvider
2. WHEN calling getTenants(), THE System SHALL fetch Power Transmission tenants from Supabase using getTransmissionTenants()
3. WHEN calling getTenants(), THE System SHALL fetch all other sector tenants from MockProvider
4. WHEN calling getTenants(), THE System SHALL filter out power sector tenants from MockProvider to avoid duplicates
5. WHEN calling getTenants(), THE System SHALL convert TransmissionTenant format to Tenant format for consistency
6. WHEN calling getTenantsBySector('power'), THE System SHALL return only Power Transmission tenants from Supabase
7. WHEN calling getTenantsBySector() for other sectors, THE System SHALL return tenants from MockProvider
8. WHEN calling getTenantById() with a UUID, THE System SHALL first check SupabaseProvider then fallback to MockProvider
9. WHEN calling getTenantById() with a non-UUID, THE System SHALL check MockProvider only
10. THE System SHALL log tenant routing decisions for debugging purposes

### Requirement 23: Local Development Database Only

**User Story:** As a developer, I want all implementation tasks to use only the local Supabase database, so that I never accidentally modify production or staging data.

#### Acceptance Criteria

1. THE System SHALL execute all migrations only against the local Supabase instance
2. THE System SHALL execute all seed scripts only against the local Supabase instance
3. THE System SHALL NOT connect to remote Supabase instances during implementation tasks
4. THE System SHALL use local environment variables (.env.development or .env.local) for database connections
5. THE System SHALL verify local database connection before running any migrations or seeds
6. THE System SHALL document the local-only approach in all task descriptions
