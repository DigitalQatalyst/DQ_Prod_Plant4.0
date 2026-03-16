# Implementation Plan: Operational Excellence (Optimise) - Transmission

## Overview

This implementation plan covers all three Operational Excellence feature sets for Power Transmission:
1. **Lean Execution (SIM)** - Shift Intelligence Management
2. **Continuous Improvement (CI)** - Structured improvement projects
3. **Optimisation (AI-powered)** - AI-driven opportunity identification

The tasks are organized by feature set and follow a consistent pattern:
- Schema/Migrations → Seeds/Validations → Provider APIs → UI Pages → Testing/Verification

**CRITICAL - LOCAL DATABASE ONLY**: All database migrations and seeds MUST be run against the LOCAL Supabase instance only. Never run these against remote (staging or production) databases. Always verify you're connected to localhost before running any database operations.

## Optional Tasks

Tasks marked with `*` are optional and can be skipped for a faster MVP. These include:
- Advanced UI features (Issues/Actions, RCA tooling, Reports, Recommendations, Playbooks, Simulations)
- Documentation updates

Core functionality (schemas, seeds, providers, main UI pages) is required for a working MVP.

## Tasks

### Feature Set 1: Lean Execution (SIM)

- [x] 1. SIM Schema and Migrations
  - **LOCAL DATABASE ONLY**: Verify local Supabase is running with `npx supabase status`
  - **LOCAL DATABASE ONLY**: Confirm connection to localhost before proceeding
  - Create migration file `supabase/migrations/013_create_sim_tables.sql`
  - Define tables: sim_shifts, sim_boards, sim_kpis, switching_orders, switching_order_impacts, outages, outage_impacts, sim_issues, sim_actions, sim_action_links
  - Add indexes for tenant_id, site_id, status, dates
  - Add RLS policies for all tables
  - Add triggers for automatic timestamp updates
  - Add table comments for documentation
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 17.1, 17.2, 17.3, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_
  - **Acceptance**: Run migration successfully against LOCAL database only, verify all tables exist with correct constraints
  - **SQL Verification**: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'sim_%' OR table_name LIKE '%order%' OR table_name LIKE 'outage%';`

- [x] 2. SIM Seed Data
  - **LOCAL DATABASE ONLY**: Verify local Supabase is running with `npx supabase status`
  - **LOCAL DATABASE ONLY**: Confirm connection to localhost before proceeding
  - Create seed file `supabase/seed/008_sim_seed.sql`
  - Add precondition assertions (tenant exists, sites exist, assets exist, grid nodes exist, grid lines exist)
  - Seed 6 shifts (2 days × 3 sites)
  - Seed 6 SIM boards
  - Seed 30 SIM KPIs across boards
  - Seed 12 switching orders with impacts
  - Seed 6 outages with impacts
  - Seed 15 issues
  - Seed 25 actions with links
  - Use clean CTE pattern with idempotent upserts
  - Add post-seed validations (minimum row counts)
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_
  - **Acceptance**: Seed runs successfully against LOCAL database only, all minimum counts met
  - **SQL Verification**: 
    ```sql
    SELECT 
      (SELECT COUNT(*) FROM sim_boards WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as boards,
      (SELECT COUNT(*) FROM switching_orders WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as orders,
      (SELECT COUNT(*) FROM outages WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as outages,
      (SELECT COUNT(*) FROM sim_issues WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as issues,
      (SELECT COUNT(*) FROM sim_actions WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as actions;
    ```
    Expected: boards >= 6, orders >= 12, outages >= 6, issues >= 15, actions >= 25

- [x] 3. SIM TypeScript Types
  - Add SIM types to `src/types/optimise.ts`
  - Define interfaces: SIMBoard, SwitchingOrder, SwitchingOrderImpact, Outage, OutageImpact, SimIssue, SimAction, SimActionLink, KPIMetric, Shift
  - Define request/response types: CreateSwitchingOrderRequest, UpdateSwitchingOrderRequest, CreateOutageRequest, UpdateOutageRequest, CreateSimIssueRequest, UpdateSimIssueRequest, CreateSimActionRequest, UpdateSimActionRequest
  - Define filter types: SIMBoardFilters, SwitchingOrderFilters, OutageFilters, SimIssueFilters, SimActionFilters
  - _Requirements: 15.1_
  - **Acceptance**: Types compile without errors, match database schema

- [x] 4. SIM DataProvider Interface Extension
  - Extend DataProvider interface in `src/lib/data/DataProvider.ts`
  - Add SIM methods: getSimBoards, getSimBoardById, getSimKpis, listSwitchingOrders, getSwitchingOrder, createSwitchingOrder, updateSwitchingOrder, listOutages, getOutage, createOutage, updateOutage, listSimIssues, createSimIssue, updateSimIssue, listSimActions, createSimAction, updateSimAction
  - Add JSDoc comments with parameter descriptions
  - _Requirements: 15.1_
  - **Acceptance**: Interface compiles, all methods have proper signatures

- [x] 5. SIM SupabaseProvider Implementation
  - Implement SIM methods in `src/lib/data/providers/SupabaseProvider.ts`
  - Implement getSimBoards with filters and pagination
  - Implement getSimBoardById with joined data (site, shift, kpis)
  - Implement getSimKpis for a board
  - Implement listSwitchingOrders with filters and pagination
  - Implement getSwitchingOrder with joined impacts
  - Implement createSwitchingOrder with impact links
  - Implement updateSwitchingOrder
  - Implement listOutages with filters and pagination
  - Implement getOutage with joined impacts
  - Implement createOutage with impact links
  - Implement updateOutage
  - Implement listSimIssues with filters
  - Implement createSimIssue
  - Implement updateSimIssue
  - Implement listSimActions with filters
  - Implement createSimAction with links
  - Implement updateSimAction
  - Add tenant filtering to all queries
  - Add error handling with user-friendly messages
  - _Requirements: 15.4, 17.1, 17.2, 18.1, 18.2_
  - **Acceptance**: All methods work with test tenant, data is properly filtered

- [x] 6. SIM HybridProvider Delegation and MockProvider Implementation
  - Update HybridProvider in `src/lib/data/providers/HybridProvider.ts`
  - Implement sector-based routing logic for all SIM methods
  - For Oil & Gas tenants: delegate to MockProvider
  - For Power Transmission tenants (UUID): delegate to SupabaseProvider  
  - For Power Transmission tenants (non-UUID): delegate to MockProvider (returns empty arrays)
  - For other sectors: delegate to MockProvider
  - Implement SIM methods in MockProvider to return mock data from mockData.ts
  - Add logging for routing decisions
  - Handle provider selection errors gracefully
  - _Requirements: 15.6, 15.7, 15.8, 15.9_
  - **Acceptance**: HybridProvider correctly routes SIM calls based on tenant sector, MockProvider returns appropriate mock data

- [x] 7. SIM Boards UI Page
  - Create/update `src/pages/optimise/sim/SIMBoards.tsx`
  - Implement nLVE pattern: list pane with boards, view pane with tabs
  - Add search and filters (site, date range, status)
  - Add tabs: Board KPIs, Switching Orders, Outages, Issues, Actions
  - Use ErrorAwareListPane and ErrorAwareWorkPane
  - Add loading states and error boundaries
  - Add empty states for no data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 16.1, 16.2, 16.6, 18.1, 18.2, 18.3, 18.4, 18.5_
  - **Acceptance**: Page renders, displays boards, tabs work, filters work
  - **UI Verification**: Navigate to /optimise/sim/boards, verify boards list, select board, verify tabs

- [x] 8. Switching Orders Management UI
  - Create/update `src/pages/optimise/sim/SwitchingOrders.tsx`
  - Implement nLVE pattern: list pane with orders, view pane with details
  - Add filters (status, priority, site, date range)
  - Add tabs: Summary, Impacts, Checklist, Linked Actions, History
  - Add create/edit modals
  - Add status transition buttons
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 16.2, 16.6_
  - **Acceptance**: Page renders, CRUD operations work, status transitions work
  - **UI Verification**: Create new switching order, update status, verify impacts display

- [x] 9. Outages Management UI
  - Create/update `src/pages/optimise/sim/Outages.tsx`
  - Implement nLVE pattern: list pane with outages, view pane with details
  - Add filters (status, type, impact level, site)
  - Add tabs: Summary, Impacts, Timeline, Linked Actions, Alerts
  - Add create/edit modals
  - Add ETA update functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 16.2, 16.6_
  - **Acceptance**: Page renders, CRUD operations work, ETA updates work
  - **UI Verification**: Create new outage, update ETA, verify impacts display

- [ ]* 10. Issues and Actions UI
  - Create/update `src/pages/optimise/sim/Issues.tsx` and `src/pages/optimise/sim/Actions.tsx`
  - Implement issue logging with category and priority
  - Implement action creation with owner and due date
  - Add action linking to issues, orders, outages, assets, nodes, lines
  - Add escalation indicators
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 16.2, 16.6_
  - **Acceptance**: Can create issues, create actions, link actions to various entities
  - **UI Verification**: Create issue, create action, link action to issue and asset

- [x] 11. SIM Navigation Integration
  - Update `src/data/navigation.ts`
  - Add SIM sub-features under Lean Execution: SIM Boards, Shift Performance, Issues, Actions
  - Add routes: /optimise/sim/boards, /optimise/sim/shifts, /optimise/sim/issues, /optimise/sim/actions
  - _Requirements: 16.1, 16.2_
  - **Acceptance**: Navigation displays SIM features, routes work

- [ ] 12. SIM Checkpoint - Verify All Tests Pass
  - **LOCAL DATABASE ONLY**: Verify all operations are against local Supabase instance
  - Run database migrations and seeds against LOCAL database only
  - Verify all SIM tables exist with correct data in LOCAL database
  - Test all SIM provider methods against LOCAL database
  - Test all SIM UI pages with LOCAL database
  - Verify tenant isolation in LOCAL database
  - Verify error handling
  - **Acceptance**: All SIM features work end-to-end with LOCAL database, no errors in console


### Feature Set 2: Continuous Improvement (CI)

- [x] 13. CI Schema and Migrations
  - **LOCAL DATABASE ONLY**: Verify local Supabase is running with `npx supabase status`
  - **LOCAL DATABASE ONLY**: Confirm connection to localhost before proceeding
  - Create migration file `supabase/migrations/014_create_ci_tables.sql`
  - Define tables: ci_stages, ci_projects, ci_project_links, ci_rca, ci_countermeasures, ci_kpis, ci_kpi_links, ci_impacts, ci_documents
  - Add indexes for tenant_id, stage_id, owner, status, due_date
  - Add RLS policies for all tables
  - Add triggers for automatic timestamp updates
  - Add table comments for documentation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 9.1, 9.2, 9.3, 9.4, 9.5, 17.1, 17.2, 17.3, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_
  - **Acceptance**: Run migration successfully against LOCAL database only, verify all tables exist with correct constraints
  - **SQL Verification**: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'ci_%';`

- [x] 14. CI Seed Data
  - **LOCAL DATABASE ONLY**: Verify local Supabase is running with `npx supabase status`
  - **LOCAL DATABASE ONLY**: Confirm connection to localhost before proceeding
  - Create seed file `supabase/seed/009_ci_seed.sql`
  - Add precondition assertions (tenant exists, sites exist, assets exist, alerts exist)
  - Seed 6 CI stages (Backlog, Analysis, Countermeasures, Implementation, Verification, Closed)
  - Seed 12 CI projects across all stages
  - Seed 12 RCA records (5-Whys and Fishbone)
  - Seed 30 countermeasures
  - Seed 6 KPIs (loss %, SAIDI/SAIFI, misoperation frequency, transformer loading, trip count)
  - Seed KPI links to projects
  - Seed 12 impact measurements
  - Seed 20 document metadata records
  - Use clean CTE pattern with idempotent upserts
  - Add post-seed validations (minimum row counts)
  - _Requirements: 20.5, 20.6, 20.7, 20.8, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_
  - **Acceptance**: Seed runs successfully against LOCAL database only, all minimum counts met
  - **SQL Verification**:
    ```sql
    SELECT 
      (SELECT COUNT(*) FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as projects,
      (SELECT COUNT(*) FROM ci_rca WHERE project_id IN (SELECT id FROM ci_projects WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1))) as rca,
      (SELECT COUNT(*) FROM ci_countermeasures WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as countermeasures,
      (SELECT COUNT(*) FROM ci_kpis WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as kpis;
    ```
    Expected: projects >= 12, rca >= 12, countermeasures >= 30, kpis >= 6

- [x] 15. CI TypeScript Types
  - Add CI types to `src/types/optimise.ts`
  - Define interfaces: CIStage, CIProject, CIProjectLink, RootCauseAnalysis, Countermeasure, CIKPI, CIKPILink, CIImpact, CIDocument
  - Define request/response types: CreateCIProjectRequest, UpdateCIProjectRequest, UpsertRCARequest, CreateCountermeasureRequest, UpdateCountermeasureRequest, UpsertImpactRequest, CreateCIDocumentRequest
  - Define filter types: CIProjectFilters, CountermeasureFilters
  - _Requirements: 15.2_
  - **Acceptance**: Types compile without errors, match database schema

- [x] 16. CI DataProvider Interface Extension
  - Extend DataProvider interface in `src/lib/data/DataProvider.ts`
  - Add CI methods: getCiStages, listCiProjects, getCiProject, createCiProject, updateCiProject, moveCiProjectStage, getCiProjectRca, upsertCiProjectRca, listCiCountermeasures, createCiCountermeasure, updateCiCountermeasure, listCiProjectKpis, upsertCiImpact, listCiDocuments, createCiDocument
  - Add JSDoc comments with parameter descriptions
  - _Requirements: 15.2_
  - **Acceptance**: Interface compiles, all methods have proper signatures

- [x] 17. CI SupabaseProvider Implementation
  - Implement CI methods in `src/lib/data/providers/SupabaseProvider.ts`
  - Implement getCiStages
  - Implement listCiProjects with filters and pagination
  - Implement getCiProject with joined data (stage, site, rca, countermeasures, kpis, documents)
  - Implement createCiProject with project links
  - Implement updateCiProject
  - Implement moveCiProjectStage
  - Implement getCiProjectRca
  - Implement upsertCiProjectRca (insert or update based on project_id + rca_type)
  - Implement listCiCountermeasures
  - Implement createCiCountermeasure
  - Implement updateCiCountermeasure
  - Implement listCiProjectKpis with impact data
  - Implement upsertCiImpact (insert or update based on project_id + kpi_id)
  - Implement listCiDocuments
  - Implement createCiDocument
  - Add tenant filtering to all queries
  - Add error handling with user-friendly messages
  - _Requirements: 15.4, 17.1, 17.2, 18.1, 18.2_
  - **Acceptance**: All methods work with test tenant, data is properly filtered

- [x] 18. CI HybridProvider Delegation and MockProvider Implementation
  - Update HybridProvider in `src/lib/data/providers/HybridProvider.ts`
  - Implement sector-based routing logic for all CI methods
  - For Oil & Gas tenants: delegate to MockProvider
  - For Power Transmission tenants (UUID): delegate to SupabaseProvider
  - For Power Transmission tenants (non-UUID): delegate to MockProvider (returns empty arrays)
  - For other sectors: delegate to MockProvider
  - Implement CI methods in MockProvider to return mock data from mockData.ts
  - Add logging for routing decisions
  - Handle provider selection errors gracefully
  - _Requirements: 15.6, 15.7, 15.8, 15.9_
  - **Acceptance**: HybridProvider correctly routes CI calls based on tenant sector, MockProvider returns appropriate mock data

- [x] 19. CI Projects UI Page (Kanban View)
  - Create/update `src/pages/optimise/ci/CIProjects.tsx`
  - Implement kanban board with 6 stages
  - Add filters (owner, priority, site, status)
  - Add drag-and-drop to move projects between stages
  - Add project selection to show details in view pane
  - Add tabs: Overview, RCA, Countermeasures, KPIs, Impact, Documents
  - Add create project modal
  - Use ErrorBoundary and loading states
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 16.1, 16.3, 16.6, 18.1, 18.2, 18.3, 18.4, 18.5_
  - **Acceptance**: Kanban board renders, projects can be moved between stages, details display
  - **UI Verification**: Navigate to /optimise/ci/projects, verify kanban board, move project, verify tabs

- [ ]* 20. RCA Tooling UI
  - Create/update `src/pages/optimise/ci/RCA.tsx`
  - Implement 5-Whys interface (5 levels of "why" questions)
  - Implement Fishbone diagram interface (6 categories: People, Process, Equipment, Materials, Environment, Management)
  - Add save/update functionality
  - Link RCA to parent CI project
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 16.3, 16.6_
  - **Acceptance**: Can create/edit RCA, data persists, displays correctly
  - **UI Verification**: Create RCA for project, add causes, verify save

- [x] 21. Countermeasures Tracking UI
  - Create/update `src/pages/optimise/ci/Countermeasures.tsx`
  - Implement list view with filters (status, owner, due date)
  - Add create/edit modals
  - Add effectiveness scoring (0-100)
  - Link countermeasures to parent CI project
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 16.3, 16.6_
  - **Acceptance**: Can create/edit countermeasures, effectiveness scores work
  - **UI Verification**: Create countermeasure, set effectiveness score, verify display

- [x] 22. Impact Tracking UI
  - Create/update `src/pages/optimise/ci/ImpactTracking.tsx`
  - Implement KPI selection and linking to projects
  - Add baseline, target, actual value inputs
  - Calculate and display impact value: (actual - baseline) / (target - baseline) * 100
  - Display impact charts and trends
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 16.3, 16.6_
  - **Acceptance**: Can link KPIs, enter values, impact calculation works
  - **UI Verification**: Link KPI to project, enter baseline/target/actual, verify impact calculation

- [ ]* 23. CI Reports UI
  - Create/update `src/pages/optimise/ci/CIReports.tsx`
  - Implement report generation (project summary, impact summary, countermeasure effectiveness)
  - Add export functionality (CSV, PDF)
  - Add date range filters
  - _Requirements: 16.3, 16.6_
  - **Acceptance**: Reports generate correctly, export works
  - **UI Verification**: Generate report, verify data, test export

- [x] 24. CI Navigation Integration
  - Update `src/data/navigation.ts`
  - Add CI sub-features under Continuous Improvement: CI Projects, RCA, Countermeasures, Impact Tracking, CI Reports
  - Add routes: /optimise/ci/projects, /optimise/ci/rca, /optimise/ci/countermeasures, /optimise/ci/impact, /optimise/ci/reports
  - _Requirements: 16.1, 16.3_
  - **Acceptance**: Navigation displays CI features, routes work

- [ ] 25. CI Checkpoint - Verify All Tests Pass
  - **LOCAL DATABASE ONLY**: Verify all operations are against local Supabase instance
  - Run database migrations and seeds against LOCAL database only
  - Verify all CI tables exist with correct data in LOCAL database
  - Test all CI provider methods against LOCAL database
  - Test all CI UI pages with LOCAL database
  - Verify tenant isolation in LOCAL database
  - Verify error handling
  - **Acceptance**: All CI features work end-to-end with LOCAL database, no errors in console


### Feature Set 3: Optimisation (AI-powered)

- [x] 26. Optimisation Schema and Migrations
  - **LOCAL DATABASE ONLY**: Verify local Supabase is running with `npx supabase status`
  - **LOCAL DATABASE ONLY**: Confirm connection to localhost before proceeding
  - Create migration file `supabase/migrations/015_create_optimisation_tables.sql`
  - Define tables: opt_opportunities, opt_recommendations, opt_playbooks, opt_opportunity_playbooks, opt_simulations, opt_publish_events
  - Add indexes for tenant_id, status, rank_score, confidence, category
  - Add RLS policies for all tables
  - Add triggers for automatic timestamp updates
  - Add table comments for documentation
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 17.1, 17.2, 17.3, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_
  - **Acceptance**: Run migration successfully against LOCAL database only, verify all tables exist with correct constraints
  - **SQL Verification**: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'opt_%';`

- [x] 27. Optimisation Seed Data
  - **LOCAL DATABASE ONLY**: Verify local Supabase is running with `npx supabase status`
  - **LOCAL DATABASE ONLY**: Confirm connection to localhost before proceeding
  - Create seed file `supabase/seed/010_optimisation_seed.sql`
  - Add precondition assertions (tenant exists, sites exist, assets exist, telemetry_points exist)
  - Seed 20 opportunities (ranked by impact score)
  - Seed 50 recommendations (2-3 per opportunity)
  - Seed 10 playbooks (loss reduction, reliability improvement, loading optimization, voltage management)
  - Seed 20 opportunity-playbook links
  - Seed 12 simulations
  - Seed 10 publish events (5 to SIM, 5 to CI) with target references or descriptive payloads
  - Use clean CTE pattern with idempotent upserts
  - Add post-seed validations (minimum row counts)
  - _Requirements: 20.9, 20.10, 20.11, 20.12, 20.13, 20.14, 20.15, 20.16, 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_
  - **Acceptance**: Seed runs successfully against LOCAL database only, all minimum counts met
  - **SQL Verification**:
    ```sql
    SELECT 
      (SELECT COUNT(*) FROM opt_opportunities WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as opportunities,
      (SELECT COUNT(*) FROM opt_recommendations WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as recommendations,
      (SELECT COUNT(*) FROM opt_playbooks WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as playbooks,
      (SELECT COUNT(*) FROM opt_simulations WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as simulations,
      (SELECT COUNT(*) FROM opt_publish_events WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1)) as publish_events;
    ```
    Expected: opportunities >= 20, recommendations >= 50, playbooks >= 10, simulations >= 12, publish_events >= 10

- [x] 28. Optimisation TypeScript Types
  - Add Optimisation types to `src/types/optimise.ts`
  - Define interfaces: OptimisationOpportunity, AIRecommendation, OptimisationPlaybook, OptimisationSimulation, PublishEvent
  - Define request/response types: UpdateOpportunityRequest, CreateSimulationRequest, PublishToSimRequest, PublishToCiRequest
  - Define filter types: OpportunityFilters, PlaybookFilters
  - _Requirements: 15.3_
  - **Acceptance**: Types compile without errors, match database schema

- [x] 29. Optimisation DataProvider Interface Extension
  - Extend DataProvider interface in `src/lib/data/DataProvider.ts`
  - Add Optimisation methods: listOpportunities, getOpportunity, updateOpportunity, listRecommendations, createSimulation, listSimulations, listPlaybooks, linkPlaybookToOpportunity, publishOpportunityToSim, publishOpportunityToCi
  - Add JSDoc comments with parameter descriptions
  - _Requirements: 15.3_
  - **Acceptance**: Interface compiles, all methods have proper signatures

- [x] 30. Optimisation SupabaseProvider Implementation
  - Implement Optimisation methods in `src/lib/data/providers/SupabaseProvider.ts`
  - Implement listOpportunities with filters and pagination, sorted by rank_score
  - Implement getOpportunity with joined data (site, recommendations, playbooks, simulations)
  - Implement updateOpportunity
  - Implement listRecommendations for an opportunity
  - Implement createSimulation
  - Implement listSimulations for an opportunity
  - Implement listPlaybooks
  - Implement linkPlaybookToOpportunity (insert into opt_opportunity_playbooks)
  - Implement publishOpportunityToSim (create switching order + publish event)
  - Implement publishOpportunityToCi (create CI project + publish event)
  - Add tenant filtering to all queries
  - Add error handling with user-friendly messages
  - _Requirements: 15.4, 17.1, 17.2, 18.1, 18.2_
  - **Acceptance**: All methods work with test tenant, data is properly filtered, publish methods create records in target tables

- [x] 31. Optimisation HybridProvider Delegation and MockProvider Implementation
  - Update HybridProvider in `src/lib/data/providers/HybridProvider.ts`
  - Implement sector-based routing logic for all Optimisation methods
  - For Oil & Gas tenants: delegate to MockProvider
  - For Power Transmission tenants (UUID): delegate to SupabaseProvider
  - For Power Transmission tenants (non-UUID): delegate to MockProvider (returns empty arrays)
  - For other sectors: delegate to MockProvider
  - Implement Optimisation methods in MockProvider to return mock data from mockData.ts
  - Add logging for routing decisions
  - Handle provider selection errors gracefully
  - _Requirements: 15.6, 15.7, 15.8, 15.9_
  - **Acceptance**: HybridProvider correctly routes Optimisation calls based on tenant sector, MockProvider returns appropriate mock data

- [x] 32. Opportunities Inbox UI
  - Create/update `src/pages/optimise/optimisation/Opportunities.tsx`
  - Implement nLVE pattern: list pane with ranked opportunities, view pane with details
  - Add filters (site, category, status, confidence level)
  - Sort by rank_score descending
  - Add tabs: Summary, Data & Trends, Recommendations, Playbooks, Simulation, Actions
  - Display confidence score and expected impact prominently
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 16.1, 16.4, 16.6, 18.1, 18.2, 18.3, 18.4, 18.5_
  - **Acceptance**: Page renders, opportunities display ranked, filters work, tabs work
  - **UI Verification**: Navigate to /optimise/optimisation/opportunities, verify ranking, select opportunity, verify tabs

- [x] 33. Recommendations UI
  - Create/update `src/pages/optimise/optimisation/Recommendations.tsx`
  - Display AI recommendations for selected opportunity
  - Show confidence score, expected benefit, assumptions, risks
  - Add approve/reject actions
  - Link to simulation creation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 16.4, 16.6_
  - **Acceptance**: Recommendations display correctly, assumptions and risks render from JSONB
  - **UI Verification**: View recommendations for opportunity, verify all fields display

- [ ]* 34. Playbooks UI
  - Create/update `src/pages/optimise/optimisation/Playbooks.tsx`
  - Implement list view of playbooks
  - Display playbook steps from JSONB
  - Add link/unlink functionality to opportunities
  - Add create/edit playbook modals
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 16.4, 16.6_
  - **Acceptance**: Playbooks display, can link to opportunities, steps render correctly
  - **UI Verification**: View playbooks, link to opportunity, verify steps display

- [ ]* 35. Simulations UI
  - Create/update `src/pages/optimise/optimisation/Simulations.tsx`
  - Implement simulation creation modal with inputs form
  - Display simulation results (inputs, outputs, comparison from JSONB)
  - Add simulation history for opportunity
  - Add comparison charts
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 16.4, 16.6_
  - **Acceptance**: Can create simulations, results display, JSONB data renders correctly
  - **UI Verification**: Create simulation, enter inputs, verify results display

- [x] 36. Execution (Publish) UI
  - Create/update `src/pages/optimise/optimisation/Execution.tsx`
  - Implement "Publish to SIM" modal with switching order details
  - Implement "Publish to CI" modal with CI project details
  - Display publish history (publish events)
  - Show target links (switching order or CI project)
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 16.4, 16.6_
  - **Acceptance**: Can publish to SIM/CI, records created in target tables, publish events logged
  - **UI Verification**: Publish opportunity to SIM, verify switching order created; publish to CI, verify CI project created

- [x] 37. Optimisation Navigation Integration
  - Update `src/data/navigation.ts`
  - Add Optimisation sub-features: Opportunities, Recommendations, Playbooks, Simulations, Execution
  - Add routes: /optimise/optimisation/opportunities, /optimise/optimisation/recommendations, /optimise/optimisation/playbooks, /optimise/optimisation/simulations, /optimise/optimisation/execution
  - _Requirements: 16.1, 16.4_
  - **Acceptance**: Navigation displays Optimisation features, routes work

- [x] 38. Optimisation Checkpoint - Verify All Tests Pass
  - **LOCAL DATABASE ONLY**: Verify all operations are against local Supabase instance
  - Run database migrations and seeds against LOCAL database only
  - Verify all Optimisation tables exist with correct data in LOCAL database
  - Test all Optimisation provider methods against LOCAL database
  - Test all Optimisation UI pages with LOCAL database
  - Verify publish to SIM creates switching orders in LOCAL database
  - Verify publish to CI creates CI projects in LOCAL database
  - Verify tenant isolation in LOCAL database
  - Verify error handling
  - **Acceptance**: All Optimisation features work end-to-end with LOCAL database, no errors in console

### Integration and Final Verification

- [ ] 39. Cross-Feature Integration Testing
  - Test SIM → CI integration (publish opportunity to CI creates project)
  - Test SIM → Optimisation integration (publish opportunity to SIM creates switching order)
  - Test CI → Optimisation integration (CI project outcomes inform opportunities)
  - Verify data flows correctly between feature sets
  - _Requirements: 14.1, 14.2_
  - **Acceptance**: Data flows correctly, no orphaned records, referential integrity maintained

- [ ]* 40. Documentation Updates
  - Update `docs/SUPABASE_SETUP.md` with Operational Excellence section
  - Add SQL verification queries for all three feature sets
  - Document minimum expected row counts after seeding
  - Document seed order dependencies
  - Add troubleshooting section for common issues
  - _Requirements: All_
  - **Acceptance**: Documentation is complete and accurate

- [ ] 42. Hybrid Tenant Management Implementation
  - **LOCAL DATABASE ONLY**: Verify all operations are against local Supabase instance
  - Update HybridProvider.getTenants() to merge Supabase and Mock tenants
  - Fetch Power Transmission tenants from SupabaseProvider.getTransmissionTenants()
  - Fetch all other sector tenants from MockProvider.getTenants()
  - Filter out power sector tenants from MockProvider to avoid duplicates
  - Convert TransmissionTenant format to Tenant format for consistency
  - Update HybridProvider.getTenantsBySector() for sector-specific routing
  - Update HybridProvider.getTenantById() to check both providers appropriately
  - Add logging for tenant routing decisions
  - Test tenant switching between Oil & Gas and Power sectors
  - Verify tenant isolation (Oil & Gas sees mock data, Power sees Supabase data)
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9, 22.10_
  - **Acceptance**: Tenant list shows both Oil & Gas (mock) and Power (Supabase) tenants, switching works correctly

- [ ] 43. Final End-to-End Verification
  - **LOCAL DATABASE ONLY**: Verify all operations are against local Supabase instance
  - Reset LOCAL database: `npx supabase db reset --local` (NOT --linked)
  - Verify all migrations run successfully against LOCAL database
  - Verify all seeds run successfully against LOCAL database
  - Run SQL verification queries for all feature sets against LOCAL database
  - Test hybrid provider routing:
    - Switch to Oil & Gas tenant → Verify data comes from mockData.ts
    - Switch to Power Transmission tenant → Verify data comes from LOCAL Supabase
    - Verify tenant list shows both Oil & Gas and Power tenants
  - Test complete user workflows with LOCAL database:
    - Oil & Gas tenant: Navigate to optimise pages → Verify mock data displays
    - Power tenant: Create SIM board → Add switching order → Link to issue → Create action
    - Power tenant: Create CI project → Add RCA → Add countermeasures → Track impact
    - Power tenant: View opportunity → Review recommendations → Run simulation → Publish to SIM/CI
  - Verify tenant isolation in LOCAL database (switch tenants, verify data separation)
  - Verify error handling (disconnect network, verify error messages)
  - Verify loading states (slow network, verify loading indicators)
  - **Acceptance**: All workflows complete successfully with LOCAL database, hybrid routing works correctly, no errors, data persists correctly

## Definition of Done

### Data Layer
- ✅ All 3 feature set schemas exist in LOCAL Supabase (SIM, CI, Optimisation)
- ✅ All tables have correct constraints, indexes, and RLS policies in LOCAL database
- ✅ Seeds are idempotent and pass preconditions + validations in LOCAL database
- ✅ After `npx supabase db reset --local`, counts meet minimum thresholds:
  - SIM: boards >= 6, orders >= 12, outages >= 6, issues >= 15, actions >= 25
  - CI: projects >= 12, rca >= 12, countermeasures >= 30, kpis >= 6
  - Optimisation: opportunities >= 20, recommendations >= 50, playbooks >= 10, simulations >= 12, publish_events >= 10
- ✅ **CRITICAL**: All database operations performed ONLY on LOCAL Supabase instance, never remote

### Provider Layer
- ✅ DataProvider interface extended with all SIM, CI, and Optimisation methods
- ✅ SupabaseProvider implements all methods with tenant filtering for Power Transmission sector
- ✅ MockProvider implements all methods returning mock data from mockData.ts for Oil & Gas sector
- ✅ HybridProvider implements sector-based routing logic:
  - Oil & Gas tenants → MockProvider
  - Power Transmission tenants (UUID) → SupabaseProvider  
  - Power Transmission tenants (non-UUID) → MockProvider (empty arrays)
  - Other sectors → MockProvider
- ✅ HybridProvider.getTenants() merges Supabase and Mock tenants correctly
- ✅ All provider methods handle errors gracefully with user-friendly messages
- ✅ Provider routing decisions are logged for debugging

### UI Layer
- ✅ All three feature sets have working nLVE pages
- ✅ Lists filter/sort/paginate correctly
- ✅ View tabs render data from Supabase
- ✅ Edit flows create/update records in Supabase successfully
- ✅ Loading states display during data fetching
- ✅ Error boundaries catch and display errors gracefully
- ✅ Empty states display when no data exists

### Integration
- ✅ Publish to SIM creates switching orders
- ✅ Publish to CI creates CI projects
- ✅ Publish events are logged with correct references
- ✅ Cross-feature data flows work correctly

### Quality Gates
- ✅ Hybrid provider correctly routes based on tenant sector
- ✅ Oil & Gas tenants see mock data from mockData.ts
- ✅ Power Transmission tenants see Supabase data from LOCAL database
- ✅ Tenant list displays both Oil & Gas and Power tenants
- ✅ No changes to src/data/* global mocks (except adding new methods to MockProvider)
- ✅ No hardcoded UUID strings in seeds for UUID fields
- ✅ SQL verification queries documented in docs/SUPABASE_SETUP.md
- ✅ Manual UI verification checklist passes for all pages
- ✅ Tenant isolation verified (data separated by tenant_id)
- ✅ RLS policies enforced (queries fail without tenant context)

