# Process Automation - Implementation Tasks

**Feature Name:** `process-automation`  
**Target Sector:** Power → Transmission  
**Data Backend:** Supabase (local only, via HybridProvider)  
**Created:** 2026-01-23

---

## ⚠️ CRITICAL: LOCAL DEVELOPMENT ONLY

**ALL DATABASE WORK MUST BE LOCAL ONLY**

- ✅ **USE:** `npx supabase start` (local database)
- ✅ **USE:** `npx supabase db reset` (local reset)
- ❌ **NEVER:** `npx supabase db reset --linked` (remote)
- ❌ **NEVER:** `npx supabase db push --linked` (remote)
- ❌ **NEVER:** Any remote database connections
- ✅ **NO RLS:** All tables unrestricted for local development
- ✅ **NO AUTH:** Permissive local access only

**Before starting any task, verify:**
```bash
# Check Supabase is running locally
npx supabase status

# Should show local URLs (127.0.0.1 or localhost)
# Should NOT show any remote/production URLs
```

---

## Task Status Legend
- `[ ]` Not started
- `[~]` Queued
- `[-]` In progress
- `[x]` Completed

---

## Phase 0: Foundation - Shared Infrastructure

### 1. TypeScript Type Definitions & DataProvider Interface

- [x] 1.1 Create PA type definitions file
  - **Requirements:** All functional requirements
  - **File:** `src/types/processAutomation.ts`
  - **Details:** Define all interfaces from design section 3.2 (TagMapping, ControlModel, ActionBinding, Trigger, AlarmRule, EventPattern, Workflow, Sequence, ControlRule, Version, Approval, Simulation, AuditLog)

- [x] 1.2 Update DataProvider interface with PA methods
  - **Requirements:** All functional requirements
  - **File:** `src/lib/data/DataProvider.ts`
  - **Details:** Add all PA method signatures from design section 3.1

- [x] 1.3 Configure HybridProvider to route PA methods to SupabaseProvider
  - **Requirements:** All functional requirements
  - **File:** `src/lib/data/providers/HybridProvider.ts`
  - **Details:** Add routing logic for all PA methods to delegate to SupabaseProvider ONLY for Power Transmission sector. Oil & Gas and other sectors MUST continue using MockProvider with existing mock data (READ-ONLY, no modifications)
  - **Routing Logic:**
    ```typescript
    // Power Transmission → SupabaseProvider
    if (sector === 'Power' && subsector === 'Transmission') {
      return this.supabaseProvider.getTagMappings(filters);
    }
    // Oil & Gas and others → MockProvider (existing data)
    return this.mockProvider.getTagMappings(filters);
    ```

---

## Feature Set A: Integrate & Model (Tag Mapping, Control Models, Action Bindings)

### 2. Database Schema - Integrate & Model

- [x] 2.1 Create migration for pa_tag_mappings table
  - **Requirements:** AC 2.1.1-2.1.7
  - **File:** `supabase/migrations/012_create_pa_tag_mappings.sql`
  - **Details:** Create table with all columns, constraints, and indexes per design section 2.2.1
  - **CRITICAL:** LOCAL ONLY - NO RLS policies, unrestricted access

- [x] 2.2 Create migration for pa_control_models table
  - **Requirements:** AC 2.2.1-2.2.7
  - **File:** `supabase/migrations/013_create_pa_control_models.sql`
  - **Details:** Create table with JSONB fields for states/transitions per design section 2.2.2
  - **CRITICAL:** LOCAL ONLY - NO RLS policies, unrestricted access

- [x] 2.3 Create migration for pa_action_bindings table
  - **Requirements:** AC 2.3.1-2.3.7
  - **File:** `supabase/migrations/014_create_pa_action_bindings.sql`
  - **Details:** Create table with JSONB parameters field per design section 2.2.3
  - **CRITICAL:** LOCAL ONLY - NO RLS policies, unrestricted access

### 3. Seed Data - Integrate & Model

- [x] 3.1 Create seed data for pa_tag_mappings
  - **Requirements:** AC 2.1.1-2.1.7
  - **File:** `supabase/seed/007_pa_tag_mappings.sql`
  - **Details:** Create 10-15 realistic tag mappings for Transmission tenant with various data types

- [x] 3.2 Create seed data for pa_control_models
  - **Requirements:** AC 2.2.1-2.2.7
  - **File:** `supabase/seed/008_pa_control_models.sql`
  - **Details:** Create 5-8 control models with state machines for breakers, transformers, etc.

- [x] 3.3 Create seed data for pa_action_bindings
  - **Requirements:** AC 2.3.1-2.3.7
  - **File:** `supabase/seed/009_pa_action_bindings.sql`
  - **Details:** Create 10-12 action bindings for control, safety, and maintenance operations

### 4. SupabaseProvider Implementation - Integrate & Model

- [x] 4.1 Implement Tag Mapping methods in SupabaseProvider
  - **Requirements:** AC 2.1.1-2.1.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getTagMappings, getTagMapping, createTagMapping, updateTagMapping, archiveTagMapping

- [x] 4.2 Implement Control Model methods in SupabaseProvider
  - **Requirements:** AC 2.2.1-2.2.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getControlModels, getControlModel, createControlModel, updateControlModel, updateControlModelState

- [x] 4.3 Implement Action Binding methods in SupabaseProvider
  - **Requirements:** AC 2.3.1-2.3.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getActionBindings, getActionBinding, createActionBinding, updateActionBinding

### 5. UI Pages - Integrate & Model

- [x] 5.1 Update TagMappingPage to use SupabaseProvider
  - **Requirements:** AC 2.1.1-2.1.7
  - **File:** `src/pages/automate/TagMappingPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement create/update/archive functionality

- [x] 5.2 Update ControlModelsPage to use SupabaseProvider
  - **Requirements:** AC 2.2.1-2.2.7
  - **File:** `src/pages/automate/ControlModelsPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement state machine editor

- [x] 5.3 Update ActionBindingsPage to use SupabaseProvider
  - **Requirements:** AC 2.3.1-2.3.7
  - **File:** `src/pages/automate/ActionBindingsPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement JSON parameter editor

### 6. Verification - Integrate & Model

- [ ] 6.1 Verify Integrate & Model database schema
  - **Requirements:** AC 2.1.1-2.3.7
  - **Command:** `npx supabase db reset` (LOCAL ONLY - never use --linked)
  - **Details:** Verify pa_tag_mappings, pa_control_models, pa_action_bindings tables created with correct schema, NO RLS policies

- [ ] 6.2 Verify Integrate & Model seed data
  - **Requirements:** AC 2.1.1-2.3.7
  - **Command:** SQL queries to count rows
  - **Details:** Verify expected row counts and data quality for tag mappings, control models, action bindings

- [ ] 6.3 Test Integrate & Model API methods
  - **Requirements:** AC 2.1.1-2.3.7
  - **Details:** Test all CRUD operations for tag mappings, control models, action bindings

- [ ] 6.4 Test Integrate & Model UI pages
  - **Requirements:** AC 2.1.1-2.3.7
  - **Details:** Test TagMappingPage, ControlModelsPage, ActionBindingsPage - verify data loads, create/update/delete works

---

## Feature Set B: Monitor & Detect (Triggers, Alarm Rules, Event Patterns)

### 7. Database Schema - Monitor & Detect

- [ ] 7.1 Create migration for pa_triggers table
  - **Requirements:** AC 2.4.1-2.4.7
  - **File:** `supabase/migrations/015_create_pa_triggers.sql`
  - **Details:** Create table with action_binding_ids array per design section 2.2.4

- [ ] 7.2 Create migration for pa_alarm_rules table
  - **Requirements:** AC 2.5.1-2.5.7
  - **File:** `supabase/migrations/016_create_pa_alarm_rules.sql`
  - **Details:** Create table with routing_destinations JSONB per design section 2.2.5

- [ ] 7.3 Create migration for pa_event_patterns table
  - **Requirements:** AC 2.6.1-2.6.7
  - **File:** `supabase/migrations/017_create_pa_event_patterns.sql`
  - **Details:** Create table with match_conditions JSONB per design section 2.2.6

### 8. Seed Data - Monitor & Detect

- [ ] 8.1 Create seed data for pa_triggers
  - **Requirements:** AC 2.4.1-2.4.7
  - **File:** `supabase/seed/010_pa_triggers.sql`
  - **Details:** Create 8-10 triggers with various priorities and types, reference action bindings from Feature Set A

- [ ] 8.2 Create seed data for pa_alarm_rules
  - **Requirements:** AC 2.5.1-2.5.7
  - **File:** `supabase/seed/011_pa_alarm_rules.sql`
  - **Details:** Create 6-8 alarm rules with routing configurations

- [ ] 8.3 Create seed data for pa_event_patterns
  - **Requirements:** AC 2.6.1-2.6.7
  - **File:** `supabase/seed/012_pa_event_patterns.sql`
  - **Details:** Create 4-6 event patterns for trend, sequence, oscillation detection

### 9. SupabaseProvider Implementation - Monitor & Detect

- [ ] 9.1 Implement Trigger methods in SupabaseProvider
  - **Requirements:** AC 2.4.1-2.4.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getTriggers, getTrigger, createTrigger, updateTrigger, toggleTrigger

- [ ] 9.2 Implement Alarm Rule methods in SupabaseProvider
  - **Requirements:** AC 2.5.1-2.5.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getAlarmRules, getAlarmRule, createAlarmRule, updateAlarmRule

- [ ] 9.3 Implement Event Pattern methods in SupabaseProvider
  - **Requirements:** AC 2.6.1-2.6.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getEventPatterns, getEventPattern, createEventPattern, updateEventPattern

### 10. UI Pages - Monitor & Detect

- [ ] 10.1 Update TriggersPage to use SupabaseProvider
  - **Requirements:** AC 2.4.1-2.4.7
  - **File:** `src/pages/automate/TriggersPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement condition expression editor, enable/disable toggle

- [ ] 10.2 Update AlarmRulesPage to use SupabaseProvider
  - **Requirements:** AC 2.5.1-2.5.7
  - **File:** `src/pages/automate/AlarmRulesPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement routing configuration editor

- [ ] 10.3 Update EventPatternsPage to use SupabaseProvider
  - **Requirements:** AC 2.6.1-2.6.7
  - **File:** `src/pages/automate/EventPatternsPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement pattern configuration editor

### 11. Verification - Monitor & Detect

- [ ] 11.1 Verify Monitor & Detect database schema
  - **Requirements:** AC 2.4.1-2.6.7
  - **Command:** `npx supabase db reset` (local only)
  - **Details:** Verify pa_triggers, pa_alarm_rules, pa_event_patterns tables created with correct schema

- [ ] 11.2 Verify Monitor & Detect seed data
  - **Requirements:** AC 2.4.1-2.6.7
  - **Command:** SQL queries to count rows
  - **Details:** Verify expected row counts and FK relationships to action bindings

- [ ] 11.3 Test Monitor & Detect API methods
  - **Requirements:** AC 2.4.1-2.6.7
  - **Details:** Test all CRUD operations for triggers, alarm rules, event patterns

- [ ] 11.4 Test Monitor & Detect UI pages
  - **Requirements:** AC 2.4.1-2.6.7
  - **Details:** Test TriggersPage, AlarmRulesPage, EventPatternsPage - verify data loads, create/update/delete works

---

## Feature Set C: Automate & Control (Workflows, Sequences, Control Rules)

### 12. Database Schema - Automate & Control

- [ ] 12.1 Create migration for pa_workflows table
  - **Requirements:** AC 2.7.1-2.7.8
  - **File:** `supabase/migrations/018_create_pa_workflows.sql`
  - **Details:** Create table with steps JSONB array per design section 2.2.7

- [ ] 12.2 Create migration for pa_sequences table
  - **Requirements:** AC 2.8.1-2.8.7
  - **File:** `supabase/migrations/019_create_pa_sequences.sql`
  - **Details:** Create table with steps JSONB and execution modes per design section 2.2.8

- [ ] 12.3 Create migration for pa_control_rules table
  - **Requirements:** AC 2.9.1-2.9.7
  - **File:** `supabase/migrations/020_create_pa_control_rules.sql`
  - **Details:** Create table with rule types and conditions per design section 2.2.9

### 13. Seed Data - Automate & Control

- [ ] 13.1 Create seed data for pa_workflows
  - **Requirements:** AC 2.7.1-2.7.8
  - **File:** `supabase/seed/013_pa_workflows.sql`
  - **Details:** Create 6-8 workflows with multi-step procedures

- [ ] 13.2 Create seed data for pa_sequences
  - **Requirements:** AC 2.8.1-2.8.7
  - **File:** `supabase/seed/014_pa_sequences.sql`
  - **Details:** Create 5-7 sequences with timing and execution modes

- [ ] 13.3 Create seed data for pa_control_rules
  - **Requirements:** AC 2.9.1-2.9.7
  - **File:** `supabase/seed/015_pa_control_rules.sql`
  - **Details:** Create 6-8 control rules with various rule types

### 14. SupabaseProvider Implementation - Automate & Control

- [ ] 14.1 Implement Workflow methods in SupabaseProvider
  - **Requirements:** AC 2.7.1-2.7.8
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getWorkflows, getWorkflow, createWorkflow, updateWorkflow, executeWorkflow

- [ ] 14.2 Implement Sequence methods in SupabaseProvider
  - **Requirements:** AC 2.8.1-2.8.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getSequences, getSequence, createSequence, updateSequence

- [ ] 14.3 Implement Control Rule methods in SupabaseProvider
  - **Requirements:** AC 2.9.1-2.9.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getControlRules, getControlRule, createControlRule, updateControlRule, toggleControlRule

### 15. UI Pages - Automate & Control

- [ ] 15.1 Update WorkflowsPage to use SupabaseProvider
  - **Requirements:** AC 2.7.1-2.7.8
  - **File:** `src/pages/automate/WorkflowsPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement workflow step editor, execute button

- [ ] 15.2 Update SequencesPage to use SupabaseProvider
  - **Requirements:** AC 2.8.1-2.8.7
  - **File:** `src/pages/automate/SequencesPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement timeline visualization

- [ ] 15.3 Update ControlRulesPage to use SupabaseProvider
  - **Requirements:** AC 2.9.1-2.9.7
  - **File:** `src/pages/automate/ControlRulesPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement rule editor, enable/disable toggle

### 16. Verification - Automate & Control

- [ ] 16.1 Verify Automate & Control database schema
  - **Requirements:** AC 2.7.1-2.9.7
  - **Command:** `npx supabase db reset` (local only)
  - **Details:** Verify pa_workflows, pa_sequences, pa_control_rules tables created with correct schema

- [ ] 16.2 Verify Automate & Control seed data
  - **Requirements:** AC 2.7.1-2.9.7
  - **Command:** SQL queries to count rows
  - **Details:** Verify expected row counts and data quality for workflows, sequences, control rules

- [ ] 16.3 Test Automate & Control API methods
  - **Requirements:** AC 2.7.1-2.9.7
  - **Details:** Test all CRUD operations for workflows, sequences, control rules, test executeWorkflow

- [ ] 16.4 Test Automate & Control UI pages
  - **Requirements:** AC 2.7.1-2.9.7
  - **Details:** Test WorkflowsPage, SequencesPage, ControlRulesPage - verify data loads, create/update/delete works, test execute button

---

## Feature Set D: Govern & Assure (Versions, Approvals, Simulations, Audit Logs)

### 17. Database Schema - Govern & Assure

- [ ] 17.1 Create migration for pa_versions table
  - **Requirements:** AC 2.10.1-2.10.7
  - **File:** `supabase/migrations/021_create_pa_versions.sql`
  - **Details:** Create table with semantic versioning and affected_components JSONB per design section 2.2.10

- [ ] 17.2 Create migration for pa_approvals table
  - **Requirements:** AC 2.11.1-2.11.7
  - **File:** `supabase/migrations/022_create_pa_approvals.sql`
  - **Details:** Create table with polymorphic references per design section 2.2.11

- [ ] 17.3 Create migration for pa_simulations table
  - **Requirements:** AC 2.12.1-2.12.7
  - **File:** `supabase/migrations/023_create_pa_simulations.sql`
  - **Details:** Create table with input/output parameters per design section 2.2.12

- [ ] 17.4 Create migration for pa_audit_logs table
  - **Requirements:** AC 2.13.1-2.13.7
  - **File:** `supabase/migrations/024_create_pa_audit_logs.sql`
  - **Details:** Create immutable audit log table per design section 2.2.13

### 18. Seed Data - Govern & Assure

- [ ] 18.1 Create seed data for pa_versions
  - **Requirements:** AC 2.10.1-2.10.7
  - **File:** `supabase/seed/016_pa_versions.sql`
  - **Details:** Create 4-6 version records with semantic versioning, reference workflows/triggers from previous feature sets

- [ ] 18.2 Create seed data for pa_approvals
  - **Requirements:** AC 2.11.1-2.11.7
  - **File:** `supabase/seed/017_pa_approvals.sql`
  - **Details:** Create 3-5 approval records in various states, reference workflows from Feature Set C

- [ ] 18.3 Create seed data for pa_simulations
  - **Requirements:** AC 2.12.1-2.12.7
  - **File:** `supabase/seed/018_pa_simulations.sql`
  - **Details:** Create 4-6 simulation records with results, reference workflows/triggers from previous feature sets

- [ ] 18.4 Create seed data for pa_audit_logs
  - **Requirements:** AC 2.13.1-2.13.7
  - **File:** `supabase/seed/019_pa_audit_logs.sql`
  - **Details:** Create 10-15 audit log entries for various operations across all PA entities

### 19. SupabaseProvider Implementation - Govern & Assure

- [ ] 19.1 Implement Version methods in SupabaseProvider
  - **Requirements:** AC 2.10.1-2.10.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getVersions, getVersion, createVersion

- [ ] 19.2 Implement Approval methods in SupabaseProvider
  - **Requirements:** AC 2.11.1-2.11.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getApprovals, getApproval, createApproval, approveApproval, rejectApproval

- [ ] 19.3 Implement Simulation methods in SupabaseProvider
  - **Requirements:** AC 2.12.1-2.12.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getSimulations, getSimulation, createSimulation, executeSimulation

- [ ] 19.4 Implement Audit Log methods in SupabaseProvider
  - **Requirements:** AC 2.13.1-2.13.7
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Implement getAuditLogs, exportAuditLogs

### 20. UI Pages - Govern & Assure

- [ ] 20.1 Update VersionsPage to use SupabaseProvider
  - **Requirements:** AC 2.10.1-2.10.7
  - **File:** `src/pages/automate/VersionsPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement version history view

- [ ] 20.2 Update ApprovalsPage to use SupabaseProvider
  - **Requirements:** AC 2.11.1-2.11.7
  - **File:** `src/pages/automate/ApprovalsPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement approve/reject actions

- [ ] 20.3 Update SimulationPage to use SupabaseProvider
  - **Requirements:** AC 2.12.1-2.12.7
  - **File:** `src/pages/automate/SimulationPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement execute simulation button

- [ ] 20.4 Update AuditLogsPage to use SupabaseProvider
  - **Requirements:** AC 2.13.1-2.13.7
  - **File:** `src/pages/automate/AuditLogsPage.tsx`
  - **Details:** Replace mock data with useDataProvider hook, implement export to CSV functionality

### 21. Verification - Govern & Assure

- [ ] 21.1 Verify Govern & Assure database schema
  - **Requirements:** AC 2.10.1-2.13.7
  - **Command:** `npx supabase db reset` (LOCAL ONLY - never use --linked)
  - **Details:** Verify pa_versions, pa_approvals, pa_simulations, pa_audit_logs tables created with correct schema, NO RLS policies

- [ ] 21.2 Verify Govern & Assure seed data
  - **Requirements:** AC 2.10.1-2.13.7
  - **Command:** SQL queries to count rows
  - **Details:** Verify expected row counts and FK relationships to other PA entities

- [ ] 21.3 Test Govern & Assure API methods
  - **Requirements:** AC 2.10.1-2.13.7
  - **Details:** Test all CRUD operations, test approve/reject, test executeSimulation, test exportAuditLogs

- [ ] 21.4 Test Govern & Assure UI pages
  - **Requirements:** AC 2.10.1-2.13.7
  - **Details:** Test VersionsPage, ApprovalsPage, SimulationPage, AuditLogsPage - verify all functionality works

---

## Feature Set E: Dashboard & Monitoring (Automation Dashboard, Automation Alerts)

### 22. Dashboard & Alerts Implementation

- [x] 22.1 Create AutomationDashboard page
  - **Requirements:** AC 2.14.1-2.14.7
  - **File:** `src/pages/automation/AutomationDashboard.tsx`
  - **Details:** Implement KPI cards (workflows, triggers, approvals, simulations, alarm rules, audit events), charts (workflow timeline, trigger heatmap, approval distribution, audit event types), auto-refresh, time range selector
- [x] 22.2 Create AutomationAlerts page
  - **Requirements:** AC 2.15.1-2.15.7
  - **File:** `src/pages/automation/AutomationAlerts.tsx`
  - **Details:** Implement alert list with filters, acknowledge/resolve actions, bulk operations, real-time updates
- [x] 22.3 Verify Dashboard & Alerts routes
  - **Requirements:** AC 2.14.1-2.15.7
  - **File:** `src/App.tsx`
  - **Details:** Verify routes for /automation/dashboard and /automation/alerts work correctly

### 23. Verification - Dashboard & Monitoring

- [ ] 23.1 Test AutomationDashboard functionality
  - **Requirements:** AC 2.14.1-2.14.7
  - **Details:** Test KPI cards display correct data, charts render correctly, auto-refresh works, time range selector works, quick actions navigate correctly

- [ ] 23.2 Test AutomationAlerts functionality
  - **Requirements:** AC 2.15.1-2.15.7
  - **Details:** Test alert list displays correctly, filters work, acknowledge/resolve actions work, bulk operations work

---

## Phase 6: Integration & End-to-End Testing

### 24. Cross-Feature Integration Testing

- [ ] 24.1 Test end-to-end workflow: Create → Execute → Audit
  - **Requirements:** AC 2.7.1-2.7.8, AC 2.13.1-2.13.7
  - **Details:** Create workflow, execute it, verify audit log entry created

- [ ] 24.2 Test approval workflow
  - **Requirements:** AC 2.11.1-2.11.7
  - **Details:** Create workflow requiring approval, submit for approval, approve/reject, verify status updates

- [ ] 24.3 Test simulation workflow
  - **Requirements:** AC 2.12.1-2.12.7
  - **Details:** Create simulation for workflow, execute it, verify results recorded

- [ ] 24.4 Test cross-linking between records
  - **Requirements:** AC 2.1.6, AC 2.2.6, AC 2.3.6, AC 2.10.7, AC 2.11.7
  - **Details:** Verify links work: trigger → action bindings, version → affected components, approval → related records, audit log → related records

- [ ] 24.5 Test trigger activation with action bindings
  - **Requirements:** AC 2.4.1-2.4.7, AC 2.3.1-2.3.7
  - **Details:** Create trigger referencing action bindings, verify relationship works correctly

### 25. Database Integrity Verification

- [ ] 25.1 Verify all 13 PA tables exist
  - **Requirements:** All database requirements
  - **Command:** SQL query to list all pa_* tables (LOCAL database only)
  - **Details:** Verify all tables created: pa_tag_mappings, pa_control_models, pa_action_bindings, pa_triggers, pa_alarm_rules, pa_event_patterns, pa_workflows, pa_sequences, pa_control_rules, pa_versions, pa_approvals, pa_simulations, pa_audit_logs. Verify NO RLS policies exist.

- [ ] 25.2 Verify foreign key integrity across all tables
  - **Requirements:** NFR 3.4.1
  - **Command:** SQL queries to check FK relationships
  - **Details:** Verify no orphaned records, all FKs resolve correctly across all PA tables

- [ ] 25.3 Verify unique constraints across all tables
  - **Requirements:** NFR 3.4.2
  - **Command:** SQL queries to check for duplicates
  - **Details:** Verify no duplicate records violating unique constraints in any PA table

- [ ] 25.4 Verify tenant isolation
  - **Requirements:** NFR 3.2.1
  - **Command:** SQL queries to verify tenant_id scoping
  - **Details:** Verify all queries properly filter by tenant_id, no cross-tenant data leakage

### 26. Performance Testing

- [ ] 26.1 Test list page load times
  - **Requirements:** NFR 3.1.1
  - **Details:** Measure load time for each list page (all 13 pages), verify < 2 seconds

- [ ] 26.2 Test detail page load times
  - **Requirements:** NFR 3.1.2
  - **Details:** Measure load time for detail views, verify < 1 second

- [ ] 26.3 Test filter response times
  - **Requirements:** NFR 3.1.3
  - **Details:** Measure filter response time on all pages, verify < 500ms

- [ ] 26.4 Test dashboard auto-refresh performance
  - **Requirements:** NFR 3.1.5
  - **Details:** Enable auto-refresh on dashboard, verify no UI lag or performance degradation

### 27. Accessibility Testing

- [ ] 27.1 Test keyboard navigation across all PA pages
  - **Requirements:** NFR 3.3.1
  - **Details:** Test tab navigation, Enter key actions, Escape key actions on all 15 PA pages

- [ ] 27.2 Test focus indicators
  - **Requirements:** NFR 3.3.2
  - **Details:** Verify all interactive elements have visible focus indicators

- [ ] 27.3 Test form labels and error messages
  - **Requirements:** NFR 3.3.3, NFR 3.3.4
  - **Details:** Verify all form inputs have labels, error messages are announced to screen readers

- [ ] 27.4 Test status badges accessibility
  - **Requirements:** NFR 3.3.5
  - **Details:** Verify all badges have accessible text, not just color coding

---

## Phase 7: Documentation & Cleanup

### 28. Code Documentation

- [ ] 28.1 Document SupabaseProvider PA methods
  - **Requirements:** NFR 3.5.4
  - **File:** `src/lib/data/providers/SupabaseProvider.ts`
  - **Details:** Add JSDoc comments to all PA methods (60+ methods)

- [ ] 28.2 Document TypeScript interfaces
  - **Requirements:** NFR 3.5.3
  - **File:** `src/types/processAutomation.ts`
  - **Details:** Add JSDoc comments to all PA interfaces

- [ ] 28.3 Document database schema
  - **Requirements:** NFR 3.5.2
  - **Files:** All migration files
  - **Details:** Add comments to all tables, columns, and constraints

### 29. Verification Report

- [ ] 29.1 Create PA feature verification report
  - **Requirements:** All success criteria
  - **File:** `docs/PA_VERIFICATION_REPORT.md`
  - **Details:** Document all verification steps, results, screenshots, and any issues found. Include:
    - Database schema verification
    - Seed data verification
    - API method verification
    - UI page verification
    - Integration test results
    - Performance test results
    - Accessibility test results

### 30. Final Cleanup

- [ ] 30.1 Verify LOCAL ONLY database configuration
  - **Requirements:** Critical constraint
  - **Command:** `npx supabase status`
  - **Details:** Verify all URLs are local (127.0.0.1 or localhost), NO remote URLs, NO --linked configuration

- [ ] 30.2 Verify mock data files are unchanged
  - **Requirements:** Constraint 4.2.2
  - **Files:** `src/data/mockData.ts`, `src/data/upstreamMockData.ts`, etc.
  - **Details:** Verify NO modifications to mock data files. Oil & Gas and other sectors MUST continue using existing mock data unchanged.

- [ ] 30.3 Verify HybridProvider routing works correctly
  - **Requirements:** All functional requirements
  - **Command:** Manual testing by switching sectors
  - **Details:** Verify Power Transmission uses Supabase data, Oil & Gas uses mock data, switching sectors works correctly

- [ ] 30.4 Remove PA mock data from mockData.ts (optional)
  - **Requirements:** Constraint 4.2.2
  - **File:** `src/data/mockData.ts`
  - **Details:** OPTIONAL - Can remove PA mock data for Transmission sector only if no longer needed. MUST keep PA mock data for Oil & Gas Upstream sector unchanged.

- [ ] 30.5 Verify no TypeScript errors
  - **Requirements:** Success criteria 4.3
  - **Command:** `npm run type-check`
  - **Details:** Fix any TypeScript errors

- [ ] 30.6 Verify build succeeds
  - **Requirements:** Success criteria 4.4
  - **Command:** `npm run build`
  - **Details:** Fix any build errors

- [ ] 30.7 Verify dev server runs without errors
  - **Requirements:** Success criteria 4.4
  - **Command:** `npm run dev`
  - **Details:** Verify dev server starts, no console errors, all pages load correctly

---

## Summary

**Total Tasks:** 30 major tasks with 100+ subtasks organized by feature set
**Estimated Effort:** 3-4 weeks for full implementation

### Implementation Order (Vertical Slices per Feature Set)

1. **Phase 0: Foundation** (Tasks 1) - Shared types and interfaces
2. **Feature Set A: Integrate & Model** (Tasks 2-6) - Complete DB → API → UI → Verify
3. **Feature Set B: Monitor & Detect** (Tasks 7-11) - Complete DB → API → UI → Verify
4. **Feature Set C: Automate & Control** (Tasks 12-16) - Complete DB → API → UI → Verify
5. **Feature Set D: Govern & Assure** (Tasks 17-21) - Complete DB → API → UI → Verify
6. **Feature Set E: Dashboard & Monitoring** (Tasks 22-23) - Complete implementation and verify
7. **Phase 6: Integration Testing** (Tasks 24-27) - Cross-feature testing
8. **Phase 7: Documentation** (Tasks 28-30) - Final documentation and cleanup

### Key Benefits of This Structure

✅ **Incremental Value:** Each feature set delivers working functionality
✅ **Early Feedback:** Test and verify each feature set before moving on
✅ **Reduced Risk:** Issues caught early in each feature set
✅ **Clear Dependencies:** Each feature set builds on previous ones
✅ **Easier Debugging:** Smaller scope per iteration
✅ **Better Testing:** Verify each vertical slice completely
✅ **Sector Isolation:** Power Transmission uses Supabase, Oil & Gas uses mock data
✅ **No Mock Data Changes:** Existing mock data remains unchanged and functional

### HybridProvider Routing Strategy

**CRITICAL: Sector-Based Data Routing**

The HybridProvider MUST route PA data requests based on the current sector:

| Sector | Subsector | Data Source | Notes |
|--------|-----------|-------------|-------|
| Power | Transmission | SupabaseProvider (local) | NEW Supabase data |
| Oil & Gas | Upstream | MockProvider | EXISTING mock data (READ-ONLY) |
| Oil & Gas | Midstream | MockProvider | EXISTING mock data (READ-ONLY) |
| Oil & Gas | Downstream | MockProvider | EXISTING mock data (READ-ONLY) |
| FMCG | Food & Beverage | MockProvider | EXISTING mock data (READ-ONLY) |
| All others | All | MockProvider | EXISTING mock data (READ-ONLY) |

**Implementation:**
```typescript
// In HybridProvider
async getTagMappings(filters?: TagMappingFilters): Promise<TagMapping[]> {
  const { currentSector, currentSubsector } = this.appContext;
  
  // Power Transmission → Supabase
  if (currentSector.id === 'power' && currentSubsector === 'transmission') {
    return this.supabaseProvider.getTagMappings(filters);
  }
  
  // All others → Mock data
  return this.mockProvider.getTagMappings(filters);
}
```

### Dependencies Between Feature Sets

- **Feature Set A** (Integrate & Model) → Foundation for all other feature sets
- **Feature Set B** (Monitor & Detect) → Depends on Action Bindings from Feature Set A
- **Feature Set C** (Automate & Control) → Can reference Triggers from Feature Set B
- **Feature Set D** (Govern & Assure) → References all previous feature sets
- **Feature Set E** (Dashboard & Monitoring) → Aggregates data from all feature sets

### Success Criteria

- ✓ All 13 PA tables created and seeded
- ✓ All 60+ DataProvider methods implemented
- ✓ All 15 pages functional with real data
- ✓ All acceptance criteria met (AC 2.1.1 - AC 2.15.7)
- ✓ All non-functional requirements met (NFR 3.1.1 - NFR 3.5.5)
- ✓ Zero TypeScript errors
- ✓ Zero console errors
- ✓ Build succeeds
- ✓ All tests passing

---

**Document Version:** 2.0 (Restructured by Feature Set)  
**Last Updated:** 2026-01-23  
**Status:** Ready for Implementation
