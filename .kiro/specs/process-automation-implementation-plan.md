# Process Automation Feature Area - Comprehensive Implementation Plan

**Feature Name:** `process-automation`  
**Target Sector:** Power → Transmission  
**Data Backend:** Supabase (local only, via HybridProvider)  
**Created:** 2026-01-23

---

## Executive Summary

This plan outlines the complete implementation of the Process Automation (PA) feature area for the Plant4.0 Power Transmission sector. The implementation follows a structured, iterative approach organized into 4 feature sets (A-D) with 13 pages total, plus supporting dashboard and alerts pages.

**Key Principles:**
- Local Supabase only (never `--linked`)
- No modifications to existing mock data files
- Hybrid mode: Transmission uses Supabase, O&G uses mocks
- nLVE pattern: Navigate → List → View → Edit
- Iterative: Complete data + API + UI + verification per feature set

---

## 1. ROLLOUT MAP (Ordered by Dependencies)

### Phase 1: Foundation - Feature Set A (Integrate & Model)
**Duration:** ~3-4 days  
**Rationale:** Build the foundational data model that everything else depends on

1. **Tag Mapping** - Maps physical tags to logical variables
2. **Control Models** - Defines equipment state machines
3. **Action Bindings** - Defines executable actions on actuators

**Dependencies:** Core tables (tenants, sites, assets, telemetry_points)  
**Outputs:** `pa_tag_mappings`, `pa_control_models`, `pa_action_bindings` tables

---

### Phase 2: Detection - Feature Set B (Monitor & Detect)
**Duration:** ~3-4 days  
**Rationale:** Build detection layer that references tags and bindings

4. **Triggers** - Event-driven automation rules
5. **Alarm Rules** - Alarm classification and routing
6. **Event Patterns** (Advanced) - Complex event pattern detection

**Dependencies:** Feature Set A (tag mappings, action bindings)  
**Outputs:** `pa_triggers`, `pa_alarm_rules`, `pa_event_patterns` tables

---

### Phase 3: Orchestration - Feature Set C (Automate & Control)
**Duration:** ~4-5 days  
**Rationale:** Build orchestration layer that references bindings and triggers

7. **Workflows** - Multi-step automated procedures
8. **Sequences** - Detailed step-by-step procedures
9. **Control Rules** - Continuous control logic

**Dependencies:** Feature Set A (action bindings), Feature Set B (triggers)  
**Outputs:** `pa_workflows`, `pa_sequences`, `pa_control_rules` tables

---

### Phase 4: Governance - Feature Set D (Govern & Assure)
**Duration:** ~4-5 days  
**Rationale:** Build governance layer that tracks changes to all PA components

10. **Versions** - Version control for PA configurations
11. **Approvals** - Approval workflows for changes
12. **Simulations** - Test and validate PA components
13. **Audit Logs** - Comprehensive audit trail

**Dependencies:** All previous feature sets (references all PA entities)  
**Outputs:** `pa_versions`, `pa_approvals`, `pa_simulations`, `pa_audit_logs` tables

---

### Phase 5: Dashboard & Monitoring
**Duration:** ~2-3 days  
**Rationale:** Build overview and monitoring after core entities exist

14. **Automation Dashboard** - High-level monitoring
15. **Automation Alerts** - Alert inbox and incident response

**Dependencies:** Feature Sets B, C, D (triggers, workflows, audit logs)  
**Outputs:** Dashboard widgets, alert views

---

**Total Estimated Duration:** 16-21 days (3-4 weeks)

---

## 2. FEATURE SET DETAILS


### FEATURE SET A: Integrate & Model

#### A) Data Layer Plan

**Existing Tables to Reuse:**
- `tenants` - Multi-tenant isolation
- `sites` - Physical locations
- `assets` - Equipment and devices
- `telemetry_points` - Sensor/actuator tags

**New Tables to Create:**

##### 1. `pa_tag_mappings`
```sql
CREATE TABLE pa_tag_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_tag TEXT NOT NULL,           -- Physical tag identifier (FK to telemetry_points)
  target_variable TEXT NOT NULL,      -- Logical variable name
  data_type TEXT NOT NULL CHECK (data_type IN ('float', 'boolean', 'string', 'integer')),
  unit TEXT,                          -- Engineering unit
  scaling_factor NUMERIC,             -- Optional scaling factor
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, source_tag, target_variable)
);

CREATE INDEX idx_pa_tag_mappings_tenant ON pa_tag_mappings(tenant_id);
CREATE INDEX idx_pa_tag_mappings_status ON pa_tag_mappings(tenant_id, status);
CREATE INDEX idx_pa_tag_mappings_source ON pa_tag_mappings(source_tag);
```

##### 2. `pa_control_models`
```sql
CREATE TABLE pa_control_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  states JSONB NOT NULL DEFAULT '[]',           -- Array of state names
  current_state TEXT,                           -- Current state
  transitions JSONB DEFAULT '[]',               -- Array of {from, to, condition}
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_pa_control_models_tenant ON pa_control_models(tenant_id);
CREATE INDEX idx_pa_control_models_status ON pa_control_models(tenant_id, status);
```

##### 3. `pa_action_bindings`
```sql
CREATE TABLE pa_action_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  action TEXT NOT NULL,                         -- Action identifier (start, stop, open, close, etc.)
  actuator TEXT NOT NULL,                       -- Target actuator (FK to telemetry_points or assets)
  parameters JSONB DEFAULT '{}',                -- Action parameters
  action_category TEXT CHECK (action_category IN ('control', 'safety', 'maintenance')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_pa_action_bindings_tenant ON pa_action_bindings(tenant_id);
CREATE INDEX idx_pa_action_bindings_status ON pa_action_bindings(tenant_id, status);
CREATE INDEX idx_pa_action_bindings_category ON pa_action_bindings(action_category);
```

**Migration File:** `supabase/migrations/20260123XXXX_pa_feature_set_a.sql`

**Seed File:** `supabase/seed/012_pa_feature_set_a.sql`

**Seed Data Requirements:**
- 10-15 tag mappings for DEWA Transmission tenant
  - Voltage sensors (kV)
  - Current sensors (A)
  - Power flow (MW, MVAr)
  - Breaker status (boolean)
  - Transformer temperature (°C)
- 3-5 control models
  - Breaker states: Open, Closed, Tripped, Maintenance
  - Transformer states: Idle, Energized, Overload, Faulted
  - Bay states: Normal, Isolated, Maintenance
- 8-12 action bindings
  - Control: Open breaker, Close breaker, Adjust tap position
  - Safety: Emergency trip, Isolate bay, Ground equipment
  - Maintenance: Test breaker, Calibrate sensor, Reset alarm

**Precondition Assertions:**
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tenants WHERE sector = 'power' AND subsector = 'transmission') THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No Power Transmission tenant exists. Run 001_transmission_tenant.sql first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM telemetry_points LIMIT 1) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No telemetry points exist. Run 004_telemetry_alerts.sql first.';
  END IF;
END $$;
```

**Post-Seed Validations:**
```sql
DO $$
DECLARE
  tag_count INT;
  model_count INT;
  binding_count INT;
BEGIN
  SELECT COUNT(*) INTO tag_count FROM pa_tag_mappings;
  SELECT COUNT(*) INTO model_count FROM pa_control_models;
  SELECT COUNT(*) INTO binding_count FROM pa_action_bindings;
  
  RAISE NOTICE 'PA Feature Set A seed complete:';
  RAISE NOTICE '  - Tag Mappings: %', tag_count;
  RAISE NOTICE '  - Control Models: %', model_count;
  RAISE NOTICE '  - Action Bindings: %', binding_count;
  
  IF tag_count < 10 THEN
    RAISE WARNING 'Expected at least 10 tag mappings, got %', tag_count;
  END IF;
END $$;
```

---

#### B) API/Query Contract

**TypeScript Interfaces:** `src/types/processAutomation.ts`

```typescript
export interface PATagMapping {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  sourceTag: string;
  targetVariable: string;
  dataType: 'float' | 'boolean' | 'string' | 'integer';
  unit: string;
  scalingFactor?: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PAControlModel {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  states: string[];
  currentState?: string;
  transitions?: Array<{
    from: string;
    to: string;
    condition: string;
  }>;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PAActionBinding {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  action: string;
  actuator: string;
  parameters?: Record<string, any>;
  actionCategory: 'control' | 'safety' | 'maintenance';
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
```

**DataProvider Interface Extensions:**

```typescript
// Add to src/lib/data/DataProvider.ts
export interface DataProvider {
  // ... existing methods ...
  
  // Process Automation - Feature Set A
  getTagMappingsByTenant(tenantId: string): Promise<PATagMapping[]>;
  getTagMappingById(id: string): Promise<PATagMapping | null>;
  createTagMapping(data: Omit<PATagMapping, 'id' | 'createdAt' | 'updatedAt'>): Promise<PATagMapping>;
  updateTagMapping(id: string, data: Partial<PATagMapping>): Promise<PATagMapping>;
  archiveTagMapping(id: string): Promise<void>;
  
  getControlModelsByTenant(tenantId: string): Promise<PAControlModel[]>;
  getControlModelById(id: string): Promise<PAControlModel | null>;
  createControlModel(data: Omit<PAControlModel, 'id' | 'createdAt' | 'updatedAt'>): Promise<PAControlModel>;
  updateControlModel(id: string, data: Partial<PAControlModel>): Promise<PAControlModel>;
  archiveControlModel(id: string): Promise<void>;
  
  getActionBindingsByTenant(tenantId: string): Promise<PAActionBinding[]>;
  getActionBindingById(id: string): Promise<PAActionBinding | null>;
  createActionBinding(data: Omit<PAActionBinding, 'id' | 'createdAt' | 'updatedAt'>): Promise<PAActionBinding>;
  updateActionBinding(id: string, data: Partial<PAActionBinding>): Promise<PAActionBinding>;
  archiveActionBinding(id: string): Promise<void>;
}
```

**SupabaseProvider Implementation:**
- Implement all 15 methods (5 per entity: list, get, create, update, archive)
- Use tenant_id scoping on all queries
- Handle JSONB fields (states, transitions, parameters)
- Return proper error messages

**Query Patterns:**
- List: `SELECT * FROM pa_tag_mappings WHERE tenant_id = $1 AND status != 'archived' ORDER BY name`
- Get: `SELECT * FROM pa_tag_mappings WHERE id = $1`
- Create: `INSERT INTO pa_tag_mappings (...) VALUES (...) RETURNING *`
- Update: `UPDATE pa_tag_mappings SET ..., updated_at = now() WHERE id = $1 RETURNING *`
- Archive: `UPDATE pa_tag_mappings SET status = 'archived', updated_at = now() WHERE id = $1`

**Filters/Sorts/Pagination:**
- Filter by status (active, draft, archived)
- Filter by data_type (tag mappings)
- Filter by action_category (action bindings)
- Sort by name, created_at, updated_at
- Pagination: offset/limit pattern (default 50 per page)

---

#### C) UI Page Plan (nLVE)

##### 1. Tag Mapping Page (`src/pages/automate/TagMappingPage.tsx`)

**Navigate:**
- Route: `/automate/tag-mapping`
- Left nav: Automate → Process Automation → Tag Mapping
- Breadcrumb: Home / Automate / Tag Mapping

**List Pane:**
- Table columns: Name, Source Tag, Target Variable, Data Type, Unit, Status
- Filters: Status dropdown, Data Type dropdown, Search by name
- Bulk actions: Archive selected, Export to CSV
- Create button: "New Tag Mapping"
- Empty state: "No tag mappings found. Create your first tag mapping to connect physical sensors to logical variables."

**View Pane (Tabs):**
- **Overview:** Name, description, source tag, target variable, data type, unit, scaling factor, status, created/updated timestamps
- **Parameters:** Detailed configuration (scaling factor, unit conversion, validation rules)
- **Linked Assets:** Assets using this tag mapping (query via source_tag FK)
- **History:** Change log (from pa_audit_logs)

**Edit Mode:**
- Form fields: Name (required), Description, Source Tag (dropdown from telemetry_points), Target Variable (text), Data Type (dropdown), Unit (text), Scaling Factor (number), Status (dropdown)
- Validation: Required fields, unique source_tag + target_variable per tenant
- Save/Cancel buttons
- Permissions: Check user role (admin, engineer)

**Empty/Error/Loading States:**
- Loading: Skeleton loaders for table rows
- Empty: Friendly message with "Create Tag Mapping" CTA
- Error: Toast notification with retry option

**Cross-linking:**
- Source Tag → Telemetry Points page
- Linked Assets → Asset Detail page
- History → Audit Logs page

---

##### 2. Control Models Page (`src/pages/automate/ControlModelsPage.tsx`)

**Navigate:**
- Route: `/automate/control-models`
- Left nav: Automate → Process Automation → Control Models

**List Pane:**
- Table columns: Name, Current State, # States, # Transitions, Status
- Filters: Status dropdown, Search by name
- Create button: "New Control Model"

**View Pane (Tabs):**
- **Overview:** Name, description, current state, status, created/updated timestamps
- **States:** List of states with visual state diagram, transition rules
- **Linked Assets:** Assets using this control model
- **History:** Change log

**Edit Mode:**
- Form fields: Name (required), Description, States (multi-input), Current State (dropdown from states), Transitions (dynamic form: from state, to state, condition), Status
- State diagram visualization (read-only in view, interactive in edit)
- Validation: At least 2 states, valid transitions

---

##### 3. Action Bindings Page (`src/pages/automate/ActionBindingsPage.tsx`)

**Navigate:**
- Route: `/automate/action-bindings`
- Left nav: Automate → Process Automation → Action Bindings

**List Pane:**
- Table columns: Name, Action, Actuator, Category, Status
- Filters: Status dropdown, Category dropdown, Search by name
- Create button: "New Action Binding"

**View Pane (Tabs):**
- **Overview:** Name, description, action, actuator, category, status, created/updated timestamps
- **Parameters:** Action parameters (JSONB display), parameter schema
- **Linked Assets:** Systems using this action
- **History:** Action execution history (from pa_audit_logs)

**Edit Mode:**
- Form fields: Name (required), Description, Action (dropdown: start, stop, open, close, adjust, trip, isolate, test, calibrate, reset), Actuator (dropdown from assets/telemetry_points), Category (dropdown), Parameters (JSON editor), Status
- Validation: Required fields, valid JSON for parameters

---

#### D) Tasks Checklist (Sequential)

**Feature Set A: Integrate & Model**

1. **Migration: Create PA Feature Set A tables**
   - Create `pa_tag_mappings` table with indexes
   - Create `pa_control_models` table with indexes
   - Create `pa_action_bindings` table with indexes
   - **AC:** Migration runs without errors, tables exist with correct schema

2. **Seed: PA Feature Set A demo data**
   - Add precondition assertions (tenant, telemetry_points)
   - Insert 10-15 tag mappings for DEWA
   - Insert 3-5 control models
   - Insert 8-12 action bindings
   - Add post-seed validations
   - **AC:** Seed runs without errors, expected row counts match

3. **Types: PA Feature Set A TypeScript interfaces**
   - Create `src/types/processAutomation.ts`
   - Define `PATagMapping`, `PAControlModel`, `PAActionBinding` interfaces
   - Export all types
   - **AC:** No TypeScript errors, types are importable

4. **DataProvider: Extend interface for PA Feature Set A**
   - Add 15 method signatures to `DataProvider` interface
   - Update `MockProvider` with stub implementations (throw "not supported for mocks")
   - **AC:** Interface compiles, no breaking changes

5. **SupabaseProvider: Implement Tag Mapping methods**
   - Implement `getTagMappingsByTenant()`
   - Implement `getTagMappingById()`
   - Implement `createTagMapping()`
   - Implement `updateTagMapping()`
   - Implement `archiveTagMapping()`
   - **AC:** All methods return correct data, handle errors gracefully

6. **SupabaseProvider: Implement Control Model methods**
   - Implement `getControlModelsByTenant()`
   - Implement `getControlModelById()`
   - Implement `createControlModel()`
   - Implement `updateControlModel()`
   - Implement `archiveControlModel()`
   - **AC:** All methods work, JSONB fields handled correctly

7. **SupabaseProvider: Implement Action Binding methods**
   - Implement `getActionBindingsByTenant()`
   - Implement `getActionBindingById()`
   - Implement `createActionBinding()`
   - Implement `updateActionBinding()`
   - Implement `archiveActionBinding()`
   - **AC:** All methods work, parameters JSONB handled correctly

8. **UI: Tag Mapping Page - List & View**
   - Create `TagMappingPage.tsx` with list pane
   - Implement table with columns, filters, search
   - Implement view pane with Overview tab
   - Add empty/loading/error states
   - **AC:** Page renders, displays seed data, view shows details

9. **UI: Tag Mapping Page - Edit & Create**
   - Implement edit mode form
   - Implement create new tag mapping
   - Add validation and error handling
   - Wire up save/cancel actions
   - **AC:** Can create and edit tag mappings, validation works

10. **UI: Tag Mapping Page - Additional Tabs**
    - Implement Parameters tab
    - Implement Linked Assets tab (stub for now)
    - Implement History tab (stub for now)
    - **AC:** All tabs render, show appropriate content

11. **UI: Control Models Page - List & View**
    - Create `ControlModelsPage.tsx` with list pane
    - Implement table with columns, filters
    - Implement view pane with Overview and States tabs
    - Add state diagram visualization (read-only)
    - **AC:** Page renders, displays seed data, state diagram shows

12. **UI: Control Models Page - Edit & Create**
    - Implement edit mode form
    - Implement create new control model
    - Add state/transition management UI
    - Wire up save/cancel actions
    - **AC:** Can create and edit control models, transitions work

13. **UI: Action Bindings Page - List & View**
    - Create `ActionBindingsPage.tsx` with list pane
    - Implement table with columns, filters
    - Implement view pane with Overview and Parameters tabs
    - **AC:** Page renders, displays seed data, parameters show

14. **UI: Action Bindings Page - Edit & Create**
    - Implement edit mode form
    - Implement create new action binding
    - Add JSON parameter editor
    - Wire up save/cancel actions
    - **AC:** Can create and edit action bindings, JSON editor works

15. **Navigation: Add PA routes and nav items**
    - Add routes to router config
    - Add "Process Automation" section to left nav under "Automate"
    - Add breadcrumbs
    - **AC:** Navigation works, pages accessible from menu

16. **Verification: Feature Set A integration test**
    - Write SQL verification queries (counts, FK integrity)
    - Test create/read/update/archive flows for all 3 entities
    - Test UI happy paths (list, view, create, edit)
    - Test edge cases (empty state, validation errors)
    - **AC:** All tests pass, no console errors

---

#### E) Testing & Verification

**SQL Verification Queries:**

```sql
-- Verify row counts
SELECT 
  (SELECT COUNT(*) FROM pa_tag_mappings WHERE tenant_id = '<dewa-id>') as tag_mappings,
  (SELECT COUNT(*) FROM pa_control_models WHERE tenant_id = '<dewa-id>') as control_models,
  (SELECT COUNT(*) FROM pa_action_bindings WHERE tenant_id = '<dewa-id>') as action_bindings;

-- Verify FK integrity
SELECT tm.id, tm.name, tm.source_tag
FROM pa_tag_mappings tm
LEFT JOIN telemetry_points tp ON tm.source_tag = tp.tag_name
WHERE tp.id IS NULL;
-- Expected: 0 rows (all source_tags should reference valid telemetry_points)

-- Verify unique constraints
SELECT source_tag, target_variable, COUNT(*)
FROM pa_tag_mappings
WHERE tenant_id = '<dewa-id>'
GROUP BY source_tag, target_variable
HAVING COUNT(*) > 1;
-- Expected: 0 rows (no duplicates)

-- Verify JSONB fields
SELECT id, name, jsonb_array_length(states) as state_count
FROM pa_control_models
WHERE tenant_id = '<dewa-id>';
-- Expected: All models have at least 2 states
```

**UI Verification Steps:**

1. **Tag Mapping Page:**
   - Navigate to /automate/tag-mapping
   - Verify list shows 10-15 tag mappings
   - Filter by status = "active"
   - Search for a specific tag name
   - Click a row to view details
   - Verify Overview tab shows all fields
   - Click Edit, modify description, Save
   - Verify update persists
   - Click "New Tag Mapping", fill form, Save
   - Verify new mapping appears in list

2. **Control Models Page:**
   - Navigate to /automate/control-models
   - Verify list shows 3-5 control models
   - Click a row to view details
   - Verify States tab shows state diagram
   - Click Edit, add a new state, Save
   - Verify state diagram updates

3. **Action Bindings Page:**
   - Navigate to /automate/action-bindings
   - Verify list shows 8-12 action bindings
   - Filter by category = "safety"
   - Click a row to view details
   - Verify Parameters tab shows JSON
   - Click Edit, modify parameters, Save
   - Verify update persists

**Edge Cases:**
- Empty tenant (no PA data) → Shows empty state
- Invalid tenant ID → Shows error message
- Network error → Shows retry option
- Validation errors → Shows inline error messages
- Concurrent edits → Last write wins (no conflict resolution yet)

**No Mock Drift Check:**
```bash
# Verify no changes to mock files
git diff src/data/mockData.ts
git diff src/data/upstreamMockData.ts
git diff src/data/alertData.ts
# Expected: No changes
```

---


### FEATURE SET B: Monitor & Detect

#### A) Data Layer Plan

**Dependencies:**
- Feature Set A tables (pa_tag_mappings, pa_action_bindings)
- Core tables (tenants, assets, telemetry_points, alerts)

**New Tables to Create:**

##### 1. `pa_triggers`
```sql
CREATE TABLE pa_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  condition TEXT NOT NULL,                      -- Trigger condition expression
  actions JSONB NOT NULL DEFAULT '[]',          -- Array of action binding IDs
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  trigger_type TEXT CHECK (trigger_type IN ('safety', 'operational', 'maintenance')),
  enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_pa_triggers_tenant ON pa_triggers(tenant_id);
CREATE INDEX idx_pa_triggers_status ON pa_triggers(tenant_id, status);
CREATE INDEX idx_pa_triggers_priority ON pa_triggers(priority);
CREATE INDEX idx_pa_triggers_enabled ON pa_triggers(enabled);
```

##### 2. `pa_alarm_rules`
```sql
CREATE TABLE pa_alarm_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  classification TEXT NOT NULL,                 -- Alarm classification (process, equipment, safety, security)
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'alarm', 'critical')),
  routing JSONB DEFAULT '[]',                   -- Array of routing destinations
  auto_acknowledge BOOLEAN DEFAULT false,
  escalation_time_seconds INTEGER,              -- Escalation time in seconds
  condition TEXT,                               -- Alarm condition expression
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_pa_alarm_rules_tenant ON pa_alarm_rules(tenant_id);
CREATE INDEX idx_pa_alarm_rules_status ON pa_alarm_rules(tenant_id, status);
CREATE INDEX idx_pa_alarm_rules_severity ON pa_alarm_rules(severity);
CREATE INDEX idx_pa_alarm_rules_classification ON pa_alarm_rules(classification);
```

##### 3. `pa_event_patterns`
```sql
CREATE TABLE pa_event_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('trend', 'sequence', 'oscillation', 'degradation')),
  events JSONB NOT NULL DEFAULT '[]',           -- Array of event identifiers to monitor
  time_window_seconds INTEGER NOT NULL,         -- Time window for pattern matching
  match_condition TEXT NOT NULL,                -- Pattern matching condition
  actions JSONB DEFAULT '[]',                   -- Array of action binding IDs
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_pa_event_patterns_tenant ON pa_event_patterns(tenant_id);
CREATE INDEX idx_pa_event_patterns_status ON pa_event_patterns(tenant_id, status);
CREATE INDEX idx_pa_event_patterns_type ON pa_event_patterns(pattern_type);
```

**Migration File:** `supabase/migrations/20260123XXXX_pa_feature_set_b.sql`

**Seed File:** `supabase/seed/013_pa_feature_set_b.sql`

**Seed Data Requirements:**
- 8-12 triggers for DEWA Transmission tenant
  - Safety: High voltage trip, overcurrent protection, ground fault
  - Operational: Load shedding, voltage regulation, frequency control
  - Maintenance: Scheduled maintenance trigger, calibration due
- 6-10 alarm rules
  - Process: Voltage deviation, power flow imbalance
  - Equipment: Transformer overheating, breaker failure
  - Safety: Protection system activation, arc flash detection
  - Security: Unauthorized access, configuration change
- 3-5 event patterns (advanced)
  - Trend: Gradual voltage decline, increasing load
  - Sequence: Cascading breaker trips
  - Oscillation: Power swing detection
  - Degradation: Transformer aging indicators

**Precondition Assertions:**
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pa_action_bindings LIMIT 1) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No action bindings exist. Run 012_pa_feature_set_a.sql first.';
  END IF;
END $$;
```

---

#### B) API/Query Contract

**TypeScript Interfaces:** Add to `src/types/processAutomation.ts`

```typescript
export interface PATrigger {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  condition: string;
  actions: string[];  // Array of action binding IDs
  priority: 'low' | 'medium' | 'high' | 'critical';
  triggerType: 'safety' | 'operational' | 'maintenance';
  enabled: boolean;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PAAlarmRule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  classification: 'process' | 'equipment' | 'safety' | 'security';
  severity: 'info' | 'warning' | 'alarm' | 'critical';
  routing: string[];  // Array of routing destinations
  autoAcknowledge: boolean;
  escalationTimeSeconds?: number;
  condition?: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PAEventPattern {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  patternType: 'trend' | 'sequence' | 'oscillation' | 'degradation';
  events: string[];  // Array of event identifiers
  timeWindowSeconds: number;
  matchCondition: string;
  actions: string[];  // Array of action binding IDs
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
```

**DataProvider Interface Extensions:**

```typescript
// Add to src/lib/data/DataProvider.ts
export interface DataProvider {
  // ... existing methods ...
  
  // Process Automation - Feature Set B
  getTriggersByTenant(tenantId: string): Promise<PATrigger[]>;
  getTriggerById(id: string): Promise<PATrigger | null>;
  createTrigger(data: Omit<PATrigger, 'id' | 'createdAt' | 'updatedAt'>): Promise<PATrigger>;
  updateTrigger(id: string, data: Partial<PATrigger>): Promise<PATrigger>;
  archiveTrigger(id: string): Promise<void>;
  
  getAlarmRulesByTenant(tenantId: string): Promise<PAAlarmRule[]>;
  getAlarmRuleById(id: string): Promise<PAAlarmRule | null>;
  createAlarmRule(data: Omit<PAAlarmRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PAAlarmRule>;
  updateAlarmRule(id: string, data: Partial<PAAlarmRule>): Promise<PAAlarmRule>;
  archiveAlarmRule(id: string): Promise<void>;
  
  getEventPatternsByTenant(tenantId: string): Promise<PAEventPattern[]>;
  getEventPatternById(id: string): Promise<PAEventPattern | null>;
  createEventPattern(data: Omit<PAEventPattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<PAEventPattern>;
  updateEventPattern(id: string, data: Partial<PAEventPattern>): Promise<PAEventPattern>;
  archiveEventPattern(id: string): Promise<void>;
}
```

---

#### C) UI Page Plan (nLVE)

##### 1. Triggers Page (`src/pages/automate/TriggersPage.tsx`)

**List Pane:**
- Table columns: Name, Priority, Type, Enabled, # Actions, Status
- Filters: Priority dropdown, Type dropdown, Enabled toggle, Status dropdown, Search
- Badge colors: Critical (red), High (orange), Medium (yellow), Low (gray)
- Create button: "New Trigger"

**View Pane (Tabs):**
- **Overview:** Name, description, condition, priority, type, enabled status, created/updated timestamps
- **Parameters:** Condition expression editor, action bindings list (with links)
- **Linked Assets:** Assets affected by this trigger
- **History:** Trigger execution log (from pa_audit_logs)

**Edit Mode:**
- Form fields: Name (required), Description, Condition (code editor with syntax highlighting), Actions (multi-select from action bindings), Priority (dropdown), Type (dropdown), Enabled (toggle), Status
- Condition editor: Monaco editor or similar with autocomplete for tag variables
- Validation: Required fields, valid condition syntax

---

##### 2. Alarm Rules Page (`src/pages/automate/AlarmRulesPage.tsx`)

**List Pane:**
- Table columns: Name, Classification, Severity, Auto-Ack, Escalation Time, Status
- Filters: Classification dropdown, Severity dropdown, Auto-Ack toggle, Status dropdown, Search
- Severity badges: Critical (red), Alarm (orange), Warning (yellow), Info (blue)
- Create button: "New Alarm Rule"

**View Pane (Tabs):**
- **Overview:** Name, description, classification, severity, auto-acknowledge, escalation time, condition, created/updated timestamps
- **Parameters:** Routing destinations, escalation rules, condition expression
- **Linked Assets:** Monitored equipment
- **History:** Alarm activation history

**Edit Mode:**
- Form fields: Name (required), Description, Classification (dropdown), Severity (dropdown), Routing (multi-input for destinations), Auto-Acknowledge (toggle), Escalation Time (number input in seconds), Condition (code editor), Status
- Routing: Add/remove email addresses, SMS numbers, webhook URLs
- Validation: Required fields, valid routing destinations

---

##### 3. Event Patterns Page (`src/pages/automate/EventPatternsPage.tsx`)

**List Pane:**
- Table columns: Name, Pattern Type, Time Window, # Events, # Actions, Status
- Filters: Pattern Type dropdown, Status dropdown, Search
- Badge: "Advanced" indicator
- Create button: "New Event Pattern"

**View Pane (Tabs):**
- **Overview:** Name, description, pattern type, time window, match condition, created/updated timestamps
- **Parameters:** Events to monitor, time window configuration, match condition expression, actions
- **Linked Assets:** Systems monitored by this pattern
- **History:** Pattern detection log

**Edit Mode:**
- Form fields: Name (required), Description, Pattern Type (dropdown), Events (multi-select from available events), Time Window (number input in seconds), Match Condition (code editor), Actions (multi-select from action bindings), Status
- Pattern visualization: Timeline or graph showing pattern detection logic
- Validation: Required fields, at least 2 events for sequence patterns

---

#### D) Tasks Checklist (Sequential)

**Feature Set B: Monitor & Detect**

1. **Migration: Create PA Feature Set B tables**
   - Create `pa_triggers` table with indexes
   - Create `pa_alarm_rules` table with indexes
   - Create `pa_event_patterns` table with indexes
   - **AC:** Migration runs without errors, tables exist with correct schema

2. **Seed: PA Feature Set B demo data**
   - Add precondition assertions (action bindings)
   - Insert 8-12 triggers for DEWA
   - Insert 6-10 alarm rules
   - Insert 3-5 event patterns
   - Add post-seed validations
   - **AC:** Seed runs without errors, expected row counts match

3. **Types: PA Feature Set B TypeScript interfaces**
   - Add `PATrigger`, `PAAlarmRule`, `PAEventPattern` to `processAutomation.ts`
   - Export all types
   - **AC:** No TypeScript errors, types are importable

4. **DataProvider: Extend interface for PA Feature Set B**
   - Add 15 method signatures to `DataProvider` interface
   - Update `MockProvider` with stub implementations
   - **AC:** Interface compiles, no breaking changes

5. **SupabaseProvider: Implement Trigger methods**
   - Implement `getTriggersByTenant()`
   - Implement `getTriggerById()`
   - Implement `createTrigger()`
   - Implement `updateTrigger()`
   - Implement `archiveTrigger()`
   - **AC:** All methods return correct data, JSONB actions handled

6. **SupabaseProvider: Implement Alarm Rule methods**
   - Implement `getAlarmRulesByTenant()`
   - Implement `getAlarmRuleById()`
   - Implement `createAlarmRule()`
   - Implement `updateAlarmRule()`
   - Implement `archiveAlarmRule()`
   - **AC:** All methods work, routing JSONB handled correctly

7. **SupabaseProvider: Implement Event Pattern methods**
   - Implement `getEventPatternsByTenant()`
   - Implement `getEventPatternById()`
   - Implement `createEventPattern()`
   - Implement `updateEventPattern()`
   - Implement `archiveEventPattern()`
   - **AC:** All methods work, events/actions JSONB handled correctly

8. **UI: Triggers Page - List & View**
   - Create `TriggersPage.tsx` with list pane
   - Implement table with columns, filters, priority badges
   - Implement view pane with Overview tab
   - Add enabled/disabled toggle in list
   - **AC:** Page renders, displays seed data, badges show correct colors

9. **UI: Triggers Page - Edit & Create**
   - Implement edit mode form
   - Implement create new trigger
   - Add condition code editor (Monaco or textarea)
   - Add action binding multi-select
   - Wire up save/cancel actions
   - **AC:** Can create and edit triggers, condition editor works

10. **UI: Triggers Page - Additional Tabs**
    - Implement Parameters tab with action bindings list
    - Implement Linked Assets tab (stub)
    - Implement History tab (stub)
    - **AC:** All tabs render, action bindings show with links

11. **UI: Alarm Rules Page - List & View**
    - Create `AlarmRulesPage.tsx` with list pane
    - Implement table with columns, filters, severity badges
    - Implement view pane with Overview tab
    - **AC:** Page renders, displays seed data, severity badges correct

12. **UI: Alarm Rules Page - Edit & Create**
    - Implement edit mode form
    - Implement create new alarm rule
    - Add routing multi-input (add/remove destinations)
    - Add escalation time input
    - Wire up save/cancel actions
    - **AC:** Can create and edit alarm rules, routing works

13. **UI: Event Patterns Page - List & View**
    - Create `EventPatternsPage.tsx` with list pane
    - Implement table with columns, filters
    - Implement view pane with Overview tab
    - Add "Advanced" badge to page header
    - **AC:** Page renders, displays seed data, advanced indicator shows

14. **UI: Event Patterns Page - Edit & Create**
    - Implement edit mode form
    - Implement create new event pattern
    - Add event multi-select
    - Add time window input
    - Add match condition code editor
    - Wire up save/cancel actions
    - **AC:** Can create and edit event patterns, all fields work

15. **Navigation: Add Feature Set B routes**
    - Add routes for Triggers, Alarm Rules, Event Patterns
    - Add nav items to "Process Automation" section
    - **AC:** Navigation works, pages accessible from menu

16. **Verification: Feature Set B integration test**
    - Write SQL verification queries
    - Test create/read/update/archive flows
    - Test UI happy paths
    - Test cross-references (triggers → action bindings)
    - **AC:** All tests pass, no console errors

---

#### E) Testing & Verification

**SQL Verification Queries:**

```sql
-- Verify row counts
SELECT 
  (SELECT COUNT(*) FROM pa_triggers WHERE tenant_id = '<dewa-id>') as triggers,
  (SELECT COUNT(*) FROM pa_alarm_rules WHERE tenant_id = '<dewa-id>') as alarm_rules,
  (SELECT COUNT(*) FROM pa_event_patterns WHERE tenant_id = '<dewa-id>') as event_patterns;

-- Verify FK integrity (triggers → action bindings)
SELECT t.id, t.name, ab_id
FROM pa_triggers t,
     jsonb_array_elements_text(t.actions) ab_id
LEFT JOIN pa_action_bindings ab ON ab.id::text = ab_id
WHERE t.tenant_id = '<dewa-id>' AND ab.id IS NULL;
-- Expected: 0 rows (all action IDs should reference valid action bindings)

-- Verify enabled triggers
SELECT COUNT(*) FROM pa_triggers WHERE tenant_id = '<dewa-id>' AND enabled = true;
-- Expected: At least 5 enabled triggers

-- Verify severity distribution
SELECT severity, COUNT(*) 
FROM pa_alarm_rules 
WHERE tenant_id = '<dewa-id>' 
GROUP BY severity;
-- Expected: Mix of info, warning, alarm, critical
```

**UI Verification Steps:**

1. **Triggers Page:**
   - Navigate to /automate/triggers
   - Verify list shows 8-12 triggers
   - Filter by priority = "critical"
   - Verify badge colors match priority
   - Toggle enabled/disabled for a trigger
   - Click a row to view details
   - Verify Parameters tab shows action bindings with links
   - Click an action binding link → navigates to Action Bindings page
   - Click Edit, modify condition, Save
   - Verify update persists

2. **Alarm Rules Page:**
   - Navigate to /automate/alarm-rules
   - Verify list shows 6-10 alarm rules
   - Filter by severity = "critical"
   - Verify severity badges correct
   - Click a row to view details
   - Verify routing destinations display
   - Click Edit, add a routing destination, Save
   - Verify new destination appears

3. **Event Patterns Page:**
   - Navigate to /automate/event-patterns
   - Verify list shows 3-5 event patterns
   - Verify "Advanced" badge shows
   - Filter by pattern type = "trend"
   - Click a row to view details
   - Verify time window displays correctly
   - Click Edit, modify time window, Save
   - Verify update persists

---


### FEATURE SET C: Automate & Control

#### A) Data Layer Plan

**Dependencies:**
- Feature Set A tables (pa_action_bindings)
- Feature Set B tables (pa_triggers)

**New Tables to Create:**

##### 1. `pa_workflows`
```sql
CREATE TABLE pa_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',            -- Array of {id, name, action, parameters}
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'automatic', 'scheduled')),
  approval_required BOOLEAN DEFAULT false,
  execution_status TEXT DEFAULT 'idle' CHECK (execution_status IN ('idle', 'running', 'completed', 'failed', 'paused')),
  last_execution_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_pa_workflows_tenant ON pa_workflows(tenant_id);
CREATE INDEX idx_pa_workflows_status ON pa_workflows(tenant_id, status);
CREATE INDEX idx_pa_workflows_trigger_type ON pa_workflows(trigger_type);
CREATE INDEX idx_pa_workflows_execution_status ON pa_workflows(execution_status);
```

##### 2. `pa_sequences`
```sql
CREATE TABLE pa_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',            -- Array of {id, order, name, action, duration, condition, parameters}
  execution_mode TEXT DEFAULT 'sequential' CHECK (execution_mode IN ('sequential', 'parallel', 'conditional')),
  total_duration_seconds INTEGER,               -- Estimated total duration
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_pa_sequences_tenant ON pa_sequences(tenant_id);
CREATE INDEX idx_pa_sequences_status ON pa_sequences(tenant_id, status);
CREATE INDEX idx_pa_sequences_execution_mode ON pa_sequences(execution_mode);
```

##### 3. `pa_control_rules`
```sql
CREATE TABLE pa_control_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('if-then', 'when-then', 'continuous')),
  condition TEXT NOT NULL,                      -- Rule condition expression
  actions JSONB NOT NULL DEFAULT '[]',          -- Array of action binding IDs
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  enabled BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, name)
);

CREATE INDEX idx_pa_control_rules_tenant ON pa_control_rules(tenant_id);
CREATE INDEX idx_pa_control_rules_status ON pa_control_rules(tenant_id, status);
CREATE INDEX idx_pa_control_rules_type ON pa_control_rules(rule_type);
CREATE INDEX idx_pa_control_rules_enabled ON pa_control_rules(enabled);
```

**Migration File:** `supabase/migrations/20260123XXXX_pa_feature_set_c.sql`

**Seed File:** `supabase/seed/014_pa_feature_set_c.sql`

**Seed Data Requirements:**
- 6-10 workflows for DEWA Transmission tenant
  - Startup: Substation energization sequence, transformer startup
  - Shutdown: Planned outage procedure, emergency shutdown
  - Maintenance: Breaker testing procedure, transformer oil sampling
  - Emergency: Fault isolation, load restoration
  - Optimization: Voltage optimization, reactive power control
- 4-6 sequences
  - Breaker close sequence (5 steps, 30 seconds)
  - Transformer energization (8 steps, 120 seconds)
  - Bay isolation (6 steps, 45 seconds)
  - Load transfer (10 steps, 180 seconds)
- 8-12 control rules
  - If-then: If voltage > 420kV then reduce tap position
  - When-then: When load > 80% then shed non-critical load
  - Continuous: Maintain voltage within ±5% of setpoint

**Precondition Assertions:**
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pa_action_bindings LIMIT 1) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No action bindings exist. Run 012_pa_feature_set_a.sql first.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pa_triggers LIMIT 1) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No triggers exist. Run 013_pa_feature_set_b.sql first.';
  END IF;
END $$;
```

---

#### B) API/Query Contract

**TypeScript Interfaces:** Add to `src/types/processAutomation.ts`

```typescript
export interface PAWorkflowStep {
  id: string;
  name: string;
  action: string;
  parameters?: Record<string, any>;
}

export interface PAWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  steps: PAWorkflowStep[];
  triggerType: 'manual' | 'automatic' | 'scheduled';
  approvalRequired: boolean;
  executionStatus: 'idle' | 'running' | 'completed' | 'failed' | 'paused';
  lastExecutionAt?: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PASequenceStep {
  id: string;
  order: number;
  name: string;
  action: string;
  duration?: number;
  condition?: string;
  parameters?: Record<string, any>;
}

export interface PASequence {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  steps: PASequenceStep[];
  executionMode: 'sequential' | 'parallel' | 'conditional';
  totalDurationSeconds?: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PAControlRule {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  ruleType: 'if-then' | 'when-then' | 'continuous';
  condition: string;
  actions: string[];  // Array of action binding IDs
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
```

**DataProvider Interface Extensions:**

```typescript
// Add to src/lib/data/DataProvider.ts
export interface DataProvider {
  // ... existing methods ...
  
  // Process Automation - Feature Set C
  getWorkflowsByTenant(tenantId: string): Promise<PAWorkflow[]>;
  getWorkflowById(id: string): Promise<PAWorkflow | null>;
  createWorkflow(data: Omit<PAWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<PAWorkflow>;
  updateWorkflow(id: string, data: Partial<PAWorkflow>): Promise<PAWorkflow>;
  archiveWorkflow(id: string): Promise<void>;
  executeWorkflow(id: string): Promise<void>;  // Trigger workflow execution
  
  getSequencesByTenant(tenantId: string): Promise<PASequence[]>;
  getSequenceById(id: string): Promise<PASequence | null>;
  createSequence(data: Omit<PASequence, 'id' | 'createdAt' | 'updatedAt'>): Promise<PASequence>;
  updateSequence(id: string, data: Partial<PASequence>): Promise<PASequence>;
  archiveSequence(id: string): Promise<void>;
  
  getControlRulesByTenant(tenantId: string): Promise<PAControlRule[]>;
  getControlRuleById(id: string): Promise<PAControlRule | null>;
  createControlRule(data: Omit<PAControlRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PAControlRule>;
  updateControlRule(id: string, data: Partial<PAControlRule>): Promise<PAControlRule>;
  archiveControlRule(id: string): Promise<void>;
}
```

---

#### C) UI Page Plan (nLVE)

##### 1. Workflows Page (`src/pages/automate/WorkflowsPage.tsx`)

**List Pane:**
- Table columns: Name, Trigger Type, # Steps, Execution Status, Last Execution, Status
- Filters: Trigger Type dropdown, Execution Status dropdown, Status dropdown, Search
- Status badges: Running (blue pulse), Completed (green), Failed (red), Idle (gray)
- Actions: Execute button (for manual workflows), Create button
- Empty state: "No workflows found. Create your first workflow to automate multi-step procedures."

**View Pane (Tabs):**
- **Overview:** Name, description, trigger type, approval required, execution status, last execution, created/updated timestamps
- **Parameters:** Step-by-step workflow visualization (flowchart or list), step details
- **Linked Assets:** Equipment involved in workflow
- **History:** Execution history with results (from pa_audit_logs)

**Edit Mode:**
- Form fields: Name (required), Description, Trigger Type (dropdown), Approval Required (toggle), Status
- Step editor: Add/remove/reorder steps, configure step parameters
- Step visualization: Drag-and-drop step ordering
- Validation: At least 1 step, valid action references

**Special Features:**
- Execute button: Trigger workflow execution (only for manual workflows)
- Execution progress: Real-time progress indicator when running
- Approval workflow: If approval required, show approval status

---

##### 2. Sequences Page (`src/pages/automate/SequencesPage.tsx`)

**List Pane:**
- Table columns: Name, Execution Mode, # Steps, Total Duration, Status
- Filters: Execution Mode dropdown, Status dropdown, Search
- Duration display: Format as "2m 30s" or "1h 15m"
- Create button: "New Sequence"

**View Pane (Tabs):**
- **Overview:** Name, description, execution mode, total duration, created/updated timestamps
- **Parameters:** Step-by-step sequence with timing, conditions, parameters
- **Linked Assets:** Equipment in sequence
- **History:** Execution log

**Edit Mode:**
- Form fields: Name (required), Description, Execution Mode (dropdown), Status
- Step editor: Add/remove/reorder steps, set duration, condition, parameters
- Timeline visualization: Gantt chart showing step timing (for sequential mode)
- Duration calculator: Auto-calculate total duration from step durations
- Validation: At least 2 steps, valid durations

---

##### 3. Control Rules Page (`src/pages/automate/ControlRulesPage.tsx`)

**List Pane:**
- Table columns: Name, Rule Type, Priority, Enabled, # Actions, Status
- Filters: Rule Type dropdown, Priority dropdown, Enabled toggle, Status dropdown, Search
- Priority badges: Critical (red), High (orange), Medium (yellow), Low (gray)
- Create button: "New Control Rule"

**View Pane (Tabs):**
- **Overview:** Name, description, rule type, condition, priority, enabled status, created/updated timestamps
- **Parameters:** Condition expression, action bindings list
- **Linked Assets:** Controlled equipment
- **History:** Rule execution log

**Edit Mode:**
- Form fields: Name (required), Description, Rule Type (dropdown), Condition (code editor), Actions (multi-select), Priority (dropdown), Enabled (toggle), Status
- Condition editor: Monaco editor with autocomplete
- Validation: Required fields, valid condition syntax

---

#### D) Tasks Checklist (Sequential)

**Feature Set C: Automate & Control**

1. **Migration: Create PA Feature Set C tables**
   - Create `pa_workflows` table with indexes
   - Create `pa_sequences` table with indexes
   - Create `pa_control_rules` table with indexes
   - **AC:** Migration runs without errors, tables exist with correct schema

2. **Seed: PA Feature Set C demo data**
   - Add precondition assertions (action bindings, triggers)
   - Insert 6-10 workflows for DEWA
   - Insert 4-6 sequences
   - Insert 8-12 control rules
   - Add post-seed validations
   - **AC:** Seed runs without errors, expected row counts match

3. **Types: PA Feature Set C TypeScript interfaces**
   - Add `PAWorkflow`, `PASequence`, `PAControlRule` to `processAutomation.ts`
   - Export all types
   - **AC:** No TypeScript errors, types are importable

4. **DataProvider: Extend interface for PA Feature Set C**
   - Add 16 method signatures to `DataProvider` interface (includes executeWorkflow)
   - Update `MockProvider` with stub implementations
   - **AC:** Interface compiles, no breaking changes

5. **SupabaseProvider: Implement Workflow methods**
   - Implement `getWorkflowsByTenant()`
   - Implement `getWorkflowById()`
   - Implement `createWorkflow()`
   - Implement `updateWorkflow()`
   - Implement `archiveWorkflow()`
   - Implement `executeWorkflow()` (stub: update execution_status, last_execution_at)
   - **AC:** All methods work, steps JSONB handled correctly

6. **SupabaseProvider: Implement Sequence methods**
   - Implement `getSequencesByTenant()`
   - Implement `getSequenceById()`
   - Implement `createSequence()`
   - Implement `updateSequence()`
   - Implement `archiveSequence()`
   - **AC:** All methods work, steps JSONB handled correctly

7. **SupabaseProvider: Implement Control Rule methods**
   - Implement `getControlRulesByTenant()`
   - Implement `getControlRuleById()`
   - Implement `createControlRule()`
   - Implement `updateControlRule()`
   - Implement `archiveControlRule()`
   - **AC:** All methods work, actions JSONB handled correctly

8. **UI: Workflows Page - List & View**
   - Create `WorkflowsPage.tsx` with list pane
   - Implement table with columns, filters, execution status badges
   - Implement view pane with Overview tab
   - Add Execute button for manual workflows
   - **AC:** Page renders, displays seed data, status badges correct

9. **UI: Workflows Page - Edit & Create**
   - Implement edit mode form
   - Implement create new workflow
   - Add step editor (add/remove/reorder steps)
   - Wire up save/cancel actions
   - **AC:** Can create and edit workflows, step editor works

10. **UI: Workflows Page - Additional Tabs & Execution**
    - Implement Parameters tab with step visualization
    - Implement Linked Assets tab (stub)
    - Implement History tab (stub)
    - Wire up Execute button to call `executeWorkflow()`
    - Add execution progress indicator
    - **AC:** All tabs render, Execute button works, progress shows

11. **UI: Sequences Page - List & View**
    - Create `SequencesPage.tsx` with list pane
    - Implement table with columns, filters, duration formatting
    - Implement view pane with Overview tab
    - **AC:** Page renders, displays seed data, durations formatted

12. **UI: Sequences Page - Edit & Create**
    - Implement edit mode form
    - Implement create new sequence
    - Add step editor with duration/condition inputs
    - Add timeline visualization (Gantt chart or list)
    - Add duration calculator
    - Wire up save/cancel actions
    - **AC:** Can create and edit sequences, timeline shows, duration calculates

13. **UI: Control Rules Page - List & View**
    - Create `ControlRulesPage.tsx` with list pane
    - Implement table with columns, filters, priority badges
    - Implement view pane with Overview tab
    - Add enabled/disabled toggle in list
    - **AC:** Page renders, displays seed data, badges correct

14. **UI: Control Rules Page - Edit & Create**
    - Implement edit mode form
    - Implement create new control rule
    - Add condition code editor
    - Add action binding multi-select
    - Wire up save/cancel actions
    - **AC:** Can create and edit control rules, condition editor works

15. **Navigation: Add Feature Set C routes**
    - Add routes for Workflows, Sequences, Control Rules
    - Add nav items to "Process Automation" section
    - **AC:** Navigation works, pages accessible from menu

16. **Verification: Feature Set C integration test**
    - Write SQL verification queries
    - Test create/read/update/archive flows
    - Test UI happy paths
    - Test workflow execution flow
    - **AC:** All tests pass, no console errors

---

#### E) Testing & Verification

**SQL Verification Queries:**

```sql
-- Verify row counts
SELECT 
  (SELECT COUNT(*) FROM pa_workflows WHERE tenant_id = '<dewa-id>') as workflows,
  (SELECT COUNT(*) FROM pa_sequences WHERE tenant_id = '<dewa-id>') as sequences,
  (SELECT COUNT(*) FROM pa_control_rules WHERE tenant_id = '<dewa-id>') as control_rules;

-- Verify workflow steps
SELECT id, name, jsonb_array_length(steps) as step_count
FROM pa_workflows
WHERE tenant_id = '<dewa-id>';
-- Expected: All workflows have at least 1 step

-- Verify sequence durations
SELECT id, name, total_duration_seconds
FROM pa_sequences
WHERE tenant_id = '<dewa-id>'
ORDER BY total_duration_seconds DESC;
-- Expected: Durations range from 30 to 180 seconds

-- Verify enabled control rules
SELECT COUNT(*) FROM pa_control_rules WHERE tenant_id = '<dewa-id>' AND enabled = true;
-- Expected: At least 5 enabled rules
```

**UI Verification Steps:**

1. **Workflows Page:**
   - Navigate to /automate/workflows
   - Verify list shows 6-10 workflows
   - Filter by trigger type = "manual"
   - Click a manual workflow row
   - Click Execute button
   - Verify execution status changes to "running" then "completed"
   - Verify last execution timestamp updates
   - Click Edit, add a new step, Save
   - Verify new step appears in Parameters tab

2. **Sequences Page:**
   - Navigate to /automate/sequences
   - Verify list shows 4-6 sequences
   - Verify durations formatted correctly (e.g., "2m 30s")
   - Click a row to view details
   - Verify Parameters tab shows timeline/Gantt chart
   - Click Edit, modify a step duration, Save
   - Verify total duration recalculates

3. **Control Rules Page:**
   - Navigate to /automate/control-rules
   - Verify list shows 8-12 control rules
   - Filter by priority = "critical"
   - Toggle enabled/disabled for a rule
   - Click a row to view details
   - Verify condition displays in Parameters tab
   - Click Edit, modify condition, Save
   - Verify update persists

---


### FEATURE SET D: Govern & Assure

#### A) Data Layer Plan

**Dependencies:**
- All previous feature sets (references all PA entities)

**New Tables to Create:**

##### 1. `pa_versions`
```sql
CREATE TABLE pa_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version_number TEXT NOT NULL,                 -- Semantic versioning (e.g., "1.2.3")
  previous_version TEXT,                        -- Previous version number
  change_type TEXT NOT NULL CHECK (change_type IN ('major', 'minor', 'patch')),
  change_description TEXT NOT NULL,
  affected_components JSONB DEFAULT '[]',       -- Array of {type, id, name}
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT,
  UNIQUE(tenant_id, name, version_number)
);

CREATE INDEX idx_pa_versions_tenant ON pa_versions(tenant_id);
CREATE INDEX idx_pa_versions_status ON pa_versions(tenant_id, status);
CREATE INDEX idx_pa_versions_approval_status ON pa_versions(approval_status);
CREATE INDEX idx_pa_versions_version_number ON pa_versions(version_number);
```

##### 2. `pa_approvals`
```sql
CREATE TABLE pa_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  request_type TEXT NOT NULL,                   -- Type of approval request
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT now(),
  approvers JSONB NOT NULL DEFAULT '[]',        -- Array of approver identifiers
  current_approver TEXT,
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by JSONB DEFAULT '[]',               -- Array of users who approved
  approved_at TIMESTAMPTZ,
  rejected_by TEXT,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  related_record_id TEXT NOT NULL,              -- ID of related PA record
  related_record_type TEXT NOT NULL,            -- Type of related record (workflow, trigger, etc.)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_pa_approvals_tenant ON pa_approvals(tenant_id);
CREATE INDEX idx_pa_approvals_status ON pa_approvals(tenant_id, status);
CREATE INDEX idx_pa_approvals_approval_status ON pa_approvals(approval_status);
CREATE INDEX idx_pa_approvals_related_record ON pa_approvals(related_record_id, related_record_type);
CREATE INDEX idx_pa_approvals_requested_by ON pa_approvals(requested_by);
```

##### 3. `pa_simulations`
```sql
CREATE TABLE pa_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  simulation_type TEXT NOT NULL CHECK (simulation_type IN ('workflow', 'control_rule', 'sequence', 'trigger')),
  target_record_id TEXT NOT NULL,               -- ID of PA record to simulate
  target_record_name TEXT NOT NULL,
  input_parameters JSONB DEFAULT '{}',          -- Input parameters for simulation
  expected_outcome TEXT,
  actual_outcome TEXT,
  simulation_status TEXT DEFAULT 'pending' CHECK (simulation_status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  results JSONB DEFAULT '{}',                   -- Simulation results
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_pa_simulations_tenant ON pa_simulations(tenant_id);
CREATE INDEX idx_pa_simulations_status ON pa_simulations(tenant_id, status);
CREATE INDEX idx_pa_simulations_simulation_status ON pa_simulations(simulation_status);
CREATE INDEX idx_pa_simulations_type ON pa_simulations(simulation_type);
CREATE INDEX idx_pa_simulations_target ON pa_simulations(target_record_id, simulation_type);
```

##### 4. `pa_audit_logs`
```sql
CREATE TABLE pa_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('create', 'update', 'delete', 'execute', 'approve', 'reject')),
  record_type TEXT NOT NULL,                    -- Type of PA record (tag_mapping, workflow, etc.)
  record_id TEXT NOT NULL,
  record_name TEXT NOT NULL,
  changes JSONB DEFAULT '{}',                   -- {field: {old: value, new: value}}
  execution_result TEXT,                        -- Result of execution (for execute events)
  user_id TEXT NOT NULL,
  user_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pa_audit_logs_tenant ON pa_audit_logs(tenant_id);
CREATE INDEX idx_pa_audit_logs_event_type ON pa_audit_logs(event_type);
CREATE INDEX idx_pa_audit_logs_record ON pa_audit_logs(record_id, record_type);
CREATE INDEX idx_pa_audit_logs_user ON pa_audit_logs(user_id);
CREATE INDEX idx_pa_audit_logs_created_at ON pa_audit_logs(created_at DESC);
```

**Migration File:** `supabase/migrations/20260123XXXX_pa_feature_set_d.sql`

**Seed File:** `supabase/seed/015_pa_feature_set_d.sql`

**Seed Data Requirements:**
- 5-8 versions for DEWA Transmission tenant
  - Major: v2.0.0 - Complete workflow redesign
  - Minor: v1.1.0 - Added new alarm rules
  - Patch: v1.0.1 - Fixed trigger condition bug
  - Mix of approved, pending, rejected
- 6-10 approvals
  - Pending: New workflow approval, control rule change
  - Approved: Tag mapping update, sequence modification
  - Rejected: Unsafe trigger condition, invalid alarm rule
  - Cancelled: Duplicate request
- 4-6 simulations
  - Completed: Workflow simulation (successful)
  - Failed: Control rule simulation (condition error)
  - Running: Sequence simulation (in progress)
  - Pending: Trigger simulation (queued)
- 20-30 audit logs
  - Create events: New workflows, triggers, rules
  - Update events: Modified configurations
  - Execute events: Workflow executions
  - Approve/Reject events: Approval decisions
  - Mix of users, timestamps over past 30 days

**Precondition Assertions:**
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pa_workflows LIMIT 1) THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No workflows exist. Run 014_pa_feature_set_c.sql first.';
  END IF;
END $$;
```

---

#### B) API/Query Contract

**TypeScript Interfaces:** Add to `src/types/processAutomation.ts`

```typescript
export interface PAVersion {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  versionNumber: string;
  previousVersion?: string;
  changeType: 'major' | 'minor' | 'patch';
  changeDescription: string;
  affectedComponents: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PAApproval {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  requestType: string;
  requestedBy: string;
  requestedAt: string;
  approvers: string[];
  currentApprover?: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy: string[];
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  relatedRecordId: string;
  relatedRecordType: string;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PASimulation {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  simulationType: 'workflow' | 'control_rule' | 'sequence' | 'trigger';
  targetRecordId: string;
  targetRecordName: string;
  inputParameters: Record<string, any>;
  expectedOutcome?: string;
  actualOutcome?: string;
  simulationStatus: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  results: Record<string, any>;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface PAAuditLog {
  id: string;
  tenantId: string;
  eventType: 'create' | 'update' | 'delete' | 'execute' | 'approve' | 'reject';
  recordType: string;
  recordId: string;
  recordName: string;
  changes?: Record<string, {
    old: any;
    new: any;
  }>;
  executionResult?: string;
  userId: string;
  userName?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
```

**DataProvider Interface Extensions:**

```typescript
// Add to src/lib/data/DataProvider.ts
export interface DataProvider {
  // ... existing methods ...
  
  // Process Automation - Feature Set D
  getVersionsByTenant(tenantId: string): Promise<PAVersion[]>;
  getVersionById(id: string): Promise<PAVersion | null>;
  createVersion(data: Omit<PAVersion, 'id' | 'createdAt' | 'updatedAt'>): Promise<PAVersion>;
  updateVersion(id: string, data: Partial<PAVersion>): Promise<PAVersion>;
  archiveVersion(id: string): Promise<void>;
  
  getApprovalsByTenant(tenantId: string): Promise<PAApproval[]>;
  getApprovalById(id: string): Promise<PAApproval | null>;
  createApproval(data: Omit<PAApproval, 'id' | 'createdAt' | 'updatedAt'>): Promise<PAApproval>;
  updateApproval(id: string, data: Partial<PAApproval>): Promise<PAApproval>;
  approveApproval(id: string, approver: string): Promise<void>;
  rejectApproval(id: string, rejector: string, reason: string): Promise<void>;
  
  getSimulationsByTenant(tenantId: string): Promise<PASimulation[]>;
  getSimulationById(id: string): Promise<PASimulation | null>;
  createSimulation(data: Omit<PASimulation, 'id' | 'createdAt' | 'updatedAt'>): Promise<PASimulation>;
  updateSimulation(id: string, data: Partial<PASimulation>): Promise<PASimulation>;
  runSimulation(id: string): Promise<void>;  // Start simulation execution
  
  getAuditLogsByTenant(tenantId: string, filters?: {
    eventType?: string;
    recordType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PAAuditLog[]>;
  getAuditLogById(id: string): Promise<PAAuditLog | null>;
  createAuditLog(data: Omit<PAAuditLog, 'id' | 'createdAt'>): Promise<PAAuditLog>;
}
```

---

#### C) UI Page Plan (nLVE)

##### 1. Versions Page (`src/pages/automate/VersionsPage.tsx`)

**List Pane:**
- Table columns: Version Number, Name, Change Type, Approval Status, Approved By, Created At
- Filters: Change Type dropdown, Approval Status dropdown, Search
- Change type badges: Major (red), Minor (yellow), Patch (green)
- Approval status badges: Approved (green), Pending (yellow), Rejected (red)
- Create button: "New Version"

**View Pane (Tabs):**
- **Overview:** Version number, name, description, change type, change description, approval status, approved by/at, created/updated timestamps
- **Parameters:** Affected components list with links to actual records
- **Linked Assets:** Assets affected by this version
- **History:** Version history chain (previous versions)

**Edit Mode:**
- Form fields: Name (required), Description, Version Number (semantic versioning input), Previous Version (dropdown), Change Type (dropdown), Change Description (textarea), Affected Components (multi-select), Status
- Version number validation: Must follow semver format (X.Y.Z)
- Affected components: Select from all PA entities (workflows, triggers, etc.)

---

##### 2. Approvals Page (`src/pages/automate/ApprovalsPage.tsx`)

**List Pane:**
- Table columns: Name, Request Type, Requested By, Approval Status, Current Approver, Requested At
- Filters: Approval Status dropdown, Request Type dropdown, Requested By filter, Search
- Status badges: Pending (yellow), Approved (green), Rejected (red), Cancelled (gray)
- Actions: Approve/Reject buttons (for pending approvals assigned to current user)
- Create button: "New Approval Request"

**View Pane (Tabs):**
- **Overview:** Name, description, request type, requested by/at, approval status, approved/rejected by/at, rejection reason, created/updated timestamps
- **Workflow:** Approval process visualization (flowchart showing approvers, current step)
- **Details:** Related record information (link to actual record), approvers list
- **History:** Approval timeline (requested → reviewed → approved/rejected)

**Edit Mode:**
- Form fields: Name (required), Description, Request Type (text), Approvers (multi-input), Related Record (select from PA entities), Status
- Approve/Reject actions: Modal with confirmation, rejection reason input
- Validation: At least 1 approver, valid related record

---

##### 3. Simulations Page (`src/pages/automate/SimulationPage.tsx`)

**List Pane:**
- Table columns: Name, Simulation Type, Target Record, Simulation Status, Duration, Created At
- Filters: Simulation Type dropdown, Simulation Status dropdown, Search
- Status badges: Running (blue pulse), Completed (green), Failed (red), Pending (gray)
- Actions: Run button (for pending simulations), Create button
- Empty state: "No simulations found. Create a simulation to test PA components before deployment."

**View Pane (Tabs):**
- **Overview:** Name, description, simulation type, target record (with link), simulation status, started/completed at, duration, created/updated timestamps
- **Configuration:** Input parameters (JSON display), expected outcome
- **Results:** Actual outcome, detailed results (JSON display), comparison with expected
- **History:** Simulation run history

**Edit Mode:**
- Form fields: Name (required), Description, Simulation Type (dropdown), Target Record (select from PA entities), Input Parameters (JSON editor), Expected Outcome (textarea), Status
- Run button: Trigger simulation execution
- Validation: Valid target record, valid JSON for input parameters

---

##### 4. Audit Logs Page (`src/pages/automate/AuditLogsPage.tsx`)

**List Pane:**
- Table columns: Event Type, Record Type, Record Name, User, Created At
- Filters: Event Type dropdown, Record Type dropdown, User filter, Date range picker, Search
- Event type badges: Create (blue), Update (yellow), Delete (red), Execute (green), Approve (green), Reject (red)
- No create button (audit logs are system-generated)
- Export button: Export filtered logs to CSV

**View Pane (Tabs):**
- **Overview:** Event type, record type, record name (with link), user, created at
- **Details:** User information (name, IP address, user agent)
- **Changes:** Before/after comparison (for update events), execution result (for execute events)
- **Metadata:** Technical details (tenant ID, record ID, timestamps)

**No Edit Mode:** Audit logs are read-only

---

#### D) Tasks Checklist (Sequential)

**Feature Set D: Govern & Assure**

1. **Migration: Create PA Feature Set D tables**
   - Create `pa_versions` table with indexes
   - Create `pa_approvals` table with indexes
   - Create `pa_simulations` table with indexes
   - Create `pa_audit_logs` table with indexes
   - **AC:** Migration runs without errors, tables exist with correct schema

2. **Seed: PA Feature Set D demo data**
   - Add precondition assertions (workflows)
   - Insert 5-8 versions for DEWA
   - Insert 6-10 approvals
   - Insert 4-6 simulations
   - Insert 20-30 audit logs
   - Add post-seed validations
   - **AC:** Seed runs without errors, expected row counts match

3. **Types: PA Feature Set D TypeScript interfaces**
   - Add `PAVersion`, `PAApproval`, `PASimulation`, `PAAuditLog` to `processAutomation.ts`
   - Export all types
   - **AC:** No TypeScript errors, types are importable

4. **DataProvider: Extend interface for PA Feature Set D**
   - Add 19 method signatures to `DataProvider` interface
   - Update `MockProvider` with stub implementations
   - **AC:** Interface compiles, no breaking changes

5. **SupabaseProvider: Implement Version methods**
   - Implement `getVersionsByTenant()`
   - Implement `getVersionById()`
   - Implement `createVersion()`
   - Implement `updateVersion()`
   - Implement `archiveVersion()`
   - **AC:** All methods work, affected_components JSONB handled

6. **SupabaseProvider: Implement Approval methods**
   - Implement `getApprovalsByTenant()`
   - Implement `getApprovalById()`
   - Implement `createApproval()`
   - Implement `updateApproval()`
   - Implement `approveApproval()`
   - Implement `rejectApproval()`
   - **AC:** All methods work, approvers/approved_by JSONB handled

7. **SupabaseProvider: Implement Simulation methods**
   - Implement `getSimulationsByTenant()`
   - Implement `getSimulationById()`
   - Implement `createSimulation()`
   - Implement `updateSimulation()`
   - Implement `runSimulation()` (stub: update status, timestamps)
   - **AC:** All methods work, input_parameters/results JSONB handled

8. **SupabaseProvider: Implement Audit Log methods**
   - Implement `getAuditLogsByTenant()` with filters
   - Implement `getAuditLogById()`
   - Implement `createAuditLog()`
   - **AC:** All methods work, filters work, changes JSONB handled

9. **UI: Versions Page - List & View**
   - Create `VersionsPage.tsx` with list pane
   - Implement table with columns, filters, change type badges
   - Implement view pane with Overview tab
   - **AC:** Page renders, displays seed data, badges correct

10. **UI: Versions Page - Edit & Create**
    - Implement edit mode form
    - Implement create new version
    - Add semantic versioning input with validation
    - Add affected components multi-select
    - Wire up save/cancel actions
    - **AC:** Can create and edit versions, semver validation works

11. **UI: Approvals Page - List & View**
    - Create `ApprovalsPage.tsx` with list pane
    - Implement table with columns, filters, status badges
    - Implement view pane with Overview and Workflow tabs
    - Add Approve/Reject buttons for pending approvals
    - **AC:** Page renders, displays seed data, workflow visualization shows

12. **UI: Approvals Page - Edit & Approve/Reject**
    - Implement edit mode form
    - Implement create new approval request
    - Implement Approve action (modal with confirmation)
    - Implement Reject action (modal with reason input)
    - Wire up save/cancel actions
    - **AC:** Can create approvals, approve/reject actions work

13. **UI: Simulations Page - List & View**
    - Create `SimulationPage.tsx` with list pane
    - Implement table with columns, filters, status badges
    - Implement view pane with Overview, Configuration, Results tabs
    - Add Run button for pending simulations
    - **AC:** Page renders, displays seed data, results show

14. **UI: Simulations Page - Edit & Run**
    - Implement edit mode form
    - Implement create new simulation
    - Add JSON editor for input parameters
    - Wire up Run button to call `runSimulation()`
    - Add simulation progress indicator
    - Wire up save/cancel actions
    - **AC:** Can create simulations, Run button works, progress shows

15. **UI: Audit Logs Page - List & View**
    - Create `AuditLogsPage.tsx` with list pane
    - Implement table with columns, filters, event type badges
    - Implement view pane with Overview, Details, Changes tabs
    - Add date range picker filter
    - Add Export to CSV button
    - **AC:** Page renders, displays seed data, filters work, export works

16. **Navigation: Add Feature Set D routes**
    - Add routes for Versions, Approvals, Simulations, Audit Logs
    - Add nav items to "Process Automation" section
    - **AC:** Navigation works, pages accessible from menu

17. **Audit Logging Integration: Wire up audit log creation**
    - Add audit log creation to all create/update/delete operations
    - Add audit log creation to workflow execution
    - Add audit log creation to approval actions
    - **AC:** Audit logs created automatically for all operations

18. **Verification: Feature Set D integration test**
    - Write SQL verification queries
    - Test create/read/update/archive flows
    - Test approval workflow (create → approve/reject)
    - Test simulation workflow (create → run → view results)
    - Test audit log filtering and export
    - **AC:** All tests pass, no console errors

---

#### E) Testing & Verification

**SQL Verification Queries:**

```sql
-- Verify row counts
SELECT 
  (SELECT COUNT(*) FROM pa_versions WHERE tenant_id = '<dewa-id>') as versions,
  (SELECT COUNT(*) FROM pa_approvals WHERE tenant_id = '<dewa-id>') as approvals,
  (SELECT COUNT(*) FROM pa_simulations WHERE tenant_id = '<dewa-id>') as simulations,
  (SELECT COUNT(*) FROM pa_audit_logs WHERE tenant_id = '<dewa-id>') as audit_logs;

-- Verify version approval status distribution
SELECT approval_status, COUNT(*) 
FROM pa_versions 
WHERE tenant_id = '<dewa-id>' 
GROUP BY approval_status;
-- Expected: Mix of pending, approved, rejected

-- Verify approval workflow integrity
SELECT a.id, a.name, a.related_record_type, a.related_record_id
FROM pa_approvals a
WHERE a.tenant_id = '<dewa-id>'
  AND a.related_record_type = 'workflow'
  AND NOT EXISTS (
    SELECT 1 FROM pa_workflows w WHERE w.id::text = a.related_record_id
  );
-- Expected: 0 rows (all related records should exist)

-- Verify audit log event type distribution
SELECT event_type, COUNT(*) 
FROM pa_audit_logs 
WHERE tenant_id = '<dewa-id>' 
GROUP BY event_type;
-- Expected: Mix of create, update, execute, approve, reject

-- Verify simulation duration calculations
SELECT id, name, 
  EXTRACT(EPOCH FROM (completed_at - started_at))::INTEGER as calculated_duration,
  duration_seconds
FROM pa_simulations
WHERE tenant_id = '<dewa-id>' AND simulation_status = 'completed';
-- Expected: calculated_duration matches duration_seconds
```

**UI Verification Steps:**

1. **Versions Page:**
   - Navigate to /automate/versions
   - Verify list shows 5-8 versions
   - Filter by change type = "major"
   - Verify change type badges correct
   - Click a row to view details
   - Verify Parameters tab shows affected components with links
   - Click an affected component link → navigates to that record
   - Click Edit, modify change description, Save
   - Verify update persists

2. **Approvals Page:**
   - Navigate to /automate/approvals
   - Verify list shows 6-10 approvals
   - Filter by approval status = "pending"
   - Click a pending approval row
   - Verify Workflow tab shows approval process
   - Click Approve button
   - Confirm in modal
   - Verify approval status changes to "approved"
   - Verify approved_by and approved_at populate
   - Click a different pending approval
   - Click Reject button
   - Enter rejection reason
   - Verify approval status changes to "rejected"

3. **Simulations Page:**
   - Navigate to /automate/simulations
   - Verify list shows 4-6 simulations
   - Filter by simulation status = "pending"
   - Click a pending simulation row
   - Verify Configuration tab shows input parameters
   - Click Run button
   - Verify simulation status changes to "running" then "completed"
   - Verify Results tab shows actual outcome and results
   - Verify duration calculates correctly

4. **Audit Logs Page:**
   - Navigate to /automate/audit-logs
   - Verify list shows 20-30 audit logs
   - Filter by event type = "execute"
   - Verify event type badges correct
   - Select date range (last 7 days)
   - Verify filtered results
   - Click a row to view details
   - Verify Changes tab shows before/after for update events
   - Click Export to CSV button
   - Verify CSV file downloads with filtered data

---


### DASHBOARD & MONITORING

#### A) Data Layer Plan

**Dependencies:**
- Feature Sets B, C, D (triggers, workflows, audit logs)
- Core tables (alerts)

**No New Tables:** Dashboard and alerts pages aggregate data from existing tables.

**Aggregation Queries Needed:**
- Active workflows count
- Running workflows count
- Failed workflows (last 24h)
- Active triggers count
- Enabled triggers count
- Triggered alarms (last 24h)
- Pending approvals count
- Running simulations count
- Recent audit log events (last 24h)

---

#### B) API/Query Contract

**TypeScript Interfaces:** Add to `src/types/processAutomation.ts`

```typescript
export interface PADashboardStats {
  workflows: {
    total: number;
    active: number;
    running: number;
    failed24h: number;
  };
  triggers: {
    total: number;
    enabled: number;
    triggered24h: number;
  };
  alarmRules: {
    total: number;
    active: number;
    triggered24h: number;
  };
  approvals: {
    pending: number;
    approved24h: number;
    rejected24h: number;
  };
  simulations: {
    total: number;
    running: number;
    completed24h: number;
  };
  auditLogs: {
    events24h: number;
    creates24h: number;
    executes24h: number;
  };
}

export interface PAAlert {
  id: string;
  tenantId: string;
  alertType: 'trigger' | 'alarm' | 'workflow_failure' | 'approval_required';
  severity: 'info' | 'warning' | 'alarm' | 'critical';
  title: string;
  message: string;
  relatedRecordId?: string;
  relatedRecordType?: string;
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}
```

**DataProvider Interface Extensions:**

```typescript
// Add to src/lib/data/DataProvider.ts
export interface DataProvider {
  // ... existing methods ...
  
  // Process Automation - Dashboard & Monitoring
  getPADashboardStats(tenantId: string): Promise<PADashboardStats>;
  getPAAlerts(tenantId: string, filters?: {
    alertType?: string;
    severity?: string;
    status?: string;
  }): Promise<PAAlert[]>;
  acknowledgePAAlert(id: string, acknowledgedBy: string): Promise<void>;
  resolvePAAlert(id: string, resolvedBy: string): Promise<void>;
}
```

---

#### C) UI Page Plan (nLVE)

##### 1. Automation Dashboard (`src/pages/automation/AutomationDashboard.tsx`)

**Layout:** Dashboard grid with KPI cards and charts

**KPI Cards:**
- **Workflows:** Total, Active, Running (pulse indicator), Failed (last 24h)
- **Triggers:** Total, Enabled, Triggered (last 24h)
- **Alarm Rules:** Total, Active, Triggered (last 24h)
- **Approvals:** Pending (with alert badge), Approved (last 24h), Rejected (last 24h)
- **Simulations:** Total, Running (pulse indicator), Completed (last 24h)
- **Audit Events:** Events (last 24h), Creates, Executes

**Charts:**
- **Workflow Execution Timeline:** Line chart showing workflow executions over time (last 7 days)
- **Trigger Activation Heatmap:** Heatmap showing trigger activations by hour/day
- **Approval Status Pie Chart:** Distribution of pending/approved/rejected approvals
- **Audit Event Types:** Bar chart showing event type distribution (last 7 days)

**Quick Actions:**
- "View All Workflows" → Workflows page
- "View Pending Approvals" → Approvals page (filtered)
- "View Recent Audit Logs" → Audit Logs page (filtered)

**Filters:**
- Time range selector: Last 24h, Last 7 days, Last 30 days, Custom range
- Refresh button: Manual refresh
- Auto-refresh toggle: Enable/disable auto-refresh (every 30s)

---

##### 2. Automation Alerts (`src/pages/automation/AutomationAlerts.tsx`)

**Layout:** Alert inbox with list and detail panes

**List Pane:**
- Table columns: Severity, Alert Type, Title, Related Record, Status, Created At
- Filters: Alert Type dropdown, Severity dropdown, Status dropdown, Search
- Severity badges: Critical (red), Alarm (orange), Warning (yellow), Info (blue)
- Status badges: Open (red), Acknowledged (yellow), Resolved (green)
- Bulk actions: Acknowledge selected, Resolve selected
- Sort: By severity (desc), by created at (desc)

**Detail Pane:**
- Alert details: Severity, type, title, message, related record (with link), status, timestamps
- Actions: Acknowledge button, Resolve button (if acknowledged)
- Timeline: Created → Acknowledged → Resolved with timestamps and users
- Related information: Link to related PA record (workflow, trigger, etc.)

**Alert Types:**
- **Trigger:** Trigger activated (info/warning/alarm based on trigger priority)
- **Alarm:** Alarm rule triggered (severity from alarm rule)
- **Workflow Failure:** Workflow execution failed (critical)
- **Approval Required:** New approval request (info)

**Empty State:** "No alerts found. Your automation system is running smoothly."

---

#### D) Tasks Checklist (Sequential)

**Dashboard & Monitoring**

1. **DataProvider: Extend interface for Dashboard & Monitoring**
   - Add `getPADashboardStats()` method signature
   - Add `getPAAlerts()` method signature
   - Add `acknowledgePAAlert()` method signature
   - Add `resolvePAAlert()` method signature
   - Update `MockProvider` with stub implementations
   - **AC:** Interface compiles, no breaking changes

2. **SupabaseProvider: Implement Dashboard Stats method**
   - Implement `getPADashboardStats()` with aggregation queries
   - Query workflows, triggers, alarm rules, approvals, simulations, audit logs
   - Calculate counts and 24h metrics
   - **AC:** Method returns correct stats, all counts accurate

3. **SupabaseProvider: Implement PA Alerts methods**
   - Implement `getPAAlerts()` with filters
   - Implement `acknowledgePAAlert()`
   - Implement `resolvePAAlert()`
   - **AC:** All methods work, filters work, status updates persist

4. **UI: Automation Dashboard - KPI Cards**
   - Create `AutomationDashboard.tsx`
   - Implement KPI card grid
   - Fetch dashboard stats from provider
   - Display all KPI cards with correct values
   - Add pulse indicators for running items
   - **AC:** Dashboard renders, KPI cards show correct data

5. **UI: Automation Dashboard - Charts**
   - Implement Workflow Execution Timeline chart
   - Implement Trigger Activation Heatmap
   - Implement Approval Status Pie Chart
   - Implement Audit Event Types Bar Chart
   - Use Recharts or similar library
   - **AC:** All charts render, display correct data

6. **UI: Automation Dashboard - Filters & Actions**
   - Implement time range selector
   - Implement refresh button
   - Implement auto-refresh toggle (30s interval)
   - Implement quick action buttons with navigation
   - **AC:** Filters work, refresh works, auto-refresh works, navigation works

7. **UI: Automation Alerts - List Pane**
   - Create `AutomationAlerts.tsx`
   - Implement alert list table
   - Implement filters (type, severity, status)
   - Implement severity and status badges
   - Implement bulk actions (acknowledge, resolve)
   - **AC:** Alert list renders, filters work, badges correct

8. **UI: Automation Alerts - Detail Pane**
   - Implement alert detail view
   - Display alert information
   - Implement Acknowledge button
   - Implement Resolve button
   - Display timeline
   - Add link to related PA record
   - **AC:** Detail pane shows, actions work, link navigates correctly

9. **Navigation: Add Dashboard & Alerts routes**
   - Add routes for Automation Dashboard and Automation Alerts
   - Add nav items to "Automation" section (top-level, not under Process Automation)
   - Update breadcrumbs
   - **AC:** Navigation works, pages accessible from menu

10. **Alert Generation: Wire up alert creation**
    - Create alerts when triggers activate (from audit logs)
    - Create alerts when workflows fail (from audit logs)
    - Create alerts when approvals are requested
    - **AC:** Alerts created automatically for relevant events

11. **Verification: Dashboard & Monitoring integration test**
    - Verify dashboard stats calculations
    - Verify charts display correct data
    - Test alert filtering and sorting
    - Test acknowledge/resolve workflows
    - Test auto-refresh functionality
    - **AC:** All tests pass, no console errors

---

#### E) Testing & Verification

**SQL Verification Queries:**

```sql
-- Verify dashboard stats calculations
SELECT 
  (SELECT COUNT(*) FROM pa_workflows WHERE tenant_id = '<dewa-id>' AND status = 'active') as active_workflows,
  (SELECT COUNT(*) FROM pa_workflows WHERE tenant_id = '<dewa-id>' AND execution_status = 'running') as running_workflows,
  (SELECT COUNT(*) FROM pa_workflows WHERE tenant_id = '<dewa-id>' AND execution_status = 'failed' AND last_execution_at > now() - interval '24 hours') as failed_workflows_24h,
  (SELECT COUNT(*) FROM pa_triggers WHERE tenant_id = '<dewa-id>' AND enabled = true) as enabled_triggers,
  (SELECT COUNT(*) FROM pa_approvals WHERE tenant_id = '<dewa-id>' AND approval_status = 'pending') as pending_approvals;

-- Verify alert counts by severity
SELECT severity, COUNT(*) 
FROM alerts 
WHERE tenant_id = '<dewa-id>' AND status = 'open'
GROUP BY severity;
-- Expected: Mix of info, warning, alarm, critical

-- Verify recent audit log events
SELECT COUNT(*) 
FROM pa_audit_logs 
WHERE tenant_id = '<dewa-id>' AND created_at > now() - interval '24 hours';
-- Expected: At least 10 events in last 24h (from seed data)
```

**UI Verification Steps:**

1. **Automation Dashboard:**
   - Navigate to /automation/dashboard
   - Verify all KPI cards display with correct values
   - Verify running workflows show pulse indicator
   - Verify all charts render with data
   - Change time range to "Last 7 days"
   - Verify charts update
   - Click "View All Workflows" button
   - Verify navigation to Workflows page
   - Return to dashboard
   - Enable auto-refresh
   - Wait 30 seconds
   - Verify dashboard refreshes automatically

2. **Automation Alerts:**
   - Navigate to /automation/alerts
   - Verify alert list displays
   - Filter by severity = "critical"
   - Verify only critical alerts show
   - Filter by status = "open"
   - Verify only open alerts show
   - Click an open alert row
   - Verify detail pane shows
   - Click Acknowledge button
   - Verify status changes to "acknowledged"
   - Verify Resolve button appears
   - Click Resolve button
   - Verify status changes to "resolved"
   - Click related record link
   - Verify navigation to related PA record

---

## 3. FINAL DEFINITION OF DONE

### Completion Criteria

The Process Automation feature area is considered **COMPLETE** when all of the following criteria are met:

#### A) Data Layer ✅
- [ ] All 13 PA tables created with correct schema
- [ ] All indexes created for performance
- [ ] All FK constraints and check constraints in place
- [ ] All 4 seed files run without errors
- [ ] Seed data meets minimum row count requirements
- [ ] All precondition assertions pass
- [ ] All post-seed validations pass
- [ ] FK integrity verified (no orphaned records)
- [ ] JSONB fields validated (no malformed JSON)
- [ ] Unique constraints enforced (no duplicates)

#### B) API Layer ✅
- [ ] All TypeScript interfaces defined in `src/types/processAutomation.ts`
- [ ] All DataProvider methods implemented in SupabaseProvider
- [ ] All methods handle errors gracefully
- [ ] All methods return correct data types
- [ ] All JSONB fields serialized/deserialized correctly
- [ ] All tenant scoping enforced (no cross-tenant data leaks)
- [ ] All filters, sorts, pagination work correctly
- [ ] MockProvider stubs in place (throw "not supported")
- [ ] HybridProvider delegates PA methods to SupabaseProvider

#### C) UI Layer ✅
- [ ] All 15 pages implemented (13 PA + 2 dashboard/alerts)
- [ ] All pages follow nLVE pattern (Navigate → List → View → Edit)
- [ ] All list panes display correct data
- [ ] All filters and search work
- [ ] All view panes show details in tabs
- [ ] All edit modes allow create/update
- [ ] All validation rules enforced
- [ ] All empty states display friendly messages
- [ ] All loading states show skeleton loaders
- [ ] All error states show retry options
- [ ] All cross-links navigate correctly
- [ ] All badges display correct colors
- [ ] All status indicators work (pulse for running, etc.)

#### D) Navigation ✅
- [ ] All routes added to router config
- [ ] All nav items added to left nav
- [ ] "Process Automation" section under "Automate"
- [ ] "Automation Dashboard" and "Automation Alerts" under "Automation" (top-level)
- [ ] All breadcrumbs display correctly
- [ ] All pages accessible from menu
- [ ] All deep links work (direct URL navigation)

#### E) Integration ✅
- [ ] Audit logging integrated (all create/update/delete/execute operations)
- [ ] Alert generation integrated (triggers, workflow failures, approvals)
- [ ] Approval workflows integrated (version approvals, change approvals)
- [ ] Simulation execution integrated (workflow/trigger/sequence/rule testing)
- [ ] Cross-references work (triggers → action bindings, workflows → sequences, etc.)
- [ ] Dashboard stats calculations accurate
- [ ] Auto-refresh works (dashboard)

#### F) Testing ✅
- [ ] All SQL verification queries pass
- [ ] All UI verification steps pass
- [ ] All happy path flows work (create → view → edit → archive)
- [ ] All edge cases handled (empty tenant, validation errors, network errors)
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] No mock drift (no changes to `src/data/*.ts` files)
- [ ] Build passes (`npm run build`)
- [ ] Dev server runs (`npm run dev`)

#### G) Documentation ✅
- [ ] All tables documented in migration files
- [ ] All seed data documented with comments
- [ ] All TypeScript interfaces documented with JSDoc
- [ ] All DataProvider methods documented
- [ ] README updated with PA feature area info
- [ ] SUPABASE_SETUP.md updated with PA schema info

#### H) Performance ✅
- [ ] All list pages load in < 2 seconds
- [ ] All detail pages load in < 1 second
- [ ] All filters respond in < 500ms
- [ ] All charts render in < 1 second
- [ ] Dashboard auto-refresh doesn't cause UI lag
- [ ] No memory leaks (check with React DevTools Profiler)

#### I) Accessibility ✅
- [ ] All pages keyboard navigable
- [ ] All interactive elements have focus indicators
- [ ] All form inputs have labels
- [ ] All error messages announced to screen readers
- [ ] All badges have accessible text (not just color)
- [ ] All charts have accessible data tables (fallback)

#### J) Security ✅
- [ ] All queries scoped to tenant_id (no cross-tenant access)
- [ ] All user actions logged in audit logs
- [ ] All sensitive operations require confirmation (delete, reject, etc.)
- [ ] All input sanitized (no SQL injection, XSS)
- [ ] All JSONB fields validated (no malicious JSON)

---

## 4. ROLLBACK PLAN

If issues arise during implementation, follow this rollback procedure:

### Rollback Steps

1. **Identify the problematic feature set** (A, B, C, or D)

2. **Rollback database changes:**
   ```bash
   # Rollback specific migration
   npx supabase migration down <migration_file>
   
   # Or reset to previous state
   npx supabase db reset
   # Then re-run migrations up to the last working one
   ```

3. **Rollback code changes:**
   ```bash
   # Revert commits for the feature set
   git revert <commit_hash>
   
   # Or reset to previous commit
   git reset --hard <commit_hash>
   ```

4. **Remove routes and nav items** for the problematic feature set

5. **Test remaining feature sets** to ensure they still work

6. **Document the issue** and plan fixes before re-attempting

### Rollback Safety

- Each feature set is independent (A → B → C → D)
- Rolling back D doesn't affect A, B, C
- Rolling back C requires rolling back D first
- Always test after rollback to ensure stability

---

## 5. MAINTENANCE & FUTURE ENHANCEMENTS

### Maintenance Tasks

**Weekly:**
- Review audit logs for anomalies
- Check dashboard stats for trends
- Monitor simulation success rates
- Review pending approvals

**Monthly:**
- Archive old audit logs (> 90 days)
- Review and archive old versions
- Clean up completed simulations
- Update seed data if needed

**Quarterly:**
- Performance review (query optimization)
- Security audit (access patterns)
- User feedback review
- Feature usage analytics

### Future Enhancements

**Phase 2 (Post-MVP):**
- Real-time workflow execution (WebSocket updates)
- Advanced simulation with digital twins
- AI-powered automation recommendations
- Mobile app for field operations
- Integration with external automation platforms (Siemens, ABB, GE)

**Phase 3 (Advanced):**
- Multi-tenant collaboration (shared workflows)
- Workflow marketplace (template library)
- Advanced analytics (ML-based anomaly detection)
- Predictive maintenance triggers
- Integration with SCADA systems

---

## 6. RISK MITIGATION

### Identified Risks

1. **Risk:** Complex JSONB queries slow down list pages
   - **Mitigation:** Add GIN indexes on JSONB columns, implement pagination

2. **Risk:** Workflow execution blocks UI
   - **Mitigation:** Use async execution with status polling, show progress indicator

3. **Risk:** Audit logs grow too large
   - **Mitigation:** Implement log rotation, archive old logs, add retention policy

4. **Risk:** Cross-tenant data leaks
   - **Mitigation:** Enforce tenant_id scoping in all queries, add RLS policies (future)

5. **Risk:** Seed data doesn't match production scenarios
   - **Mitigation:** Collaborate with domain experts, iterate on seed data

6. **Risk:** UI performance degrades with large datasets
   - **Mitigation:** Implement virtual scrolling, lazy loading, pagination

---

## 7. SUCCESS METRICS

### Key Performance Indicators (KPIs)

**Technical Metrics:**
- Page load time < 2 seconds (95th percentile)
- API response time < 500ms (95th percentile)
- Zero console errors in production
- 100% test coverage for critical paths
- Zero cross-tenant data leaks

**User Metrics:**
- Time to create workflow < 5 minutes
- Time to approve change < 2 minutes
- Time to run simulation < 30 seconds
- User satisfaction score > 4/5
- Feature adoption rate > 70% (of target users)

**Business Metrics:**
- Reduction in manual configuration time (target: 50%)
- Increase in automation coverage (target: 80% of processes)
- Reduction in configuration errors (target: 70%)
- Faster time to deploy changes (target: 50% faster)

---

## 8. STAKEHOLDER SIGN-OFF

### Required Approvals

Before starting implementation, obtain sign-off from:

- [ ] **Product Owner:** Approve feature scope and priorities
- [ ] **Tech Lead:** Approve architecture and data model
- [ ] **DevOps:** Approve deployment strategy and infrastructure
- [ ] **Security:** Approve security controls and audit logging
- [ ] **QA:** Approve testing strategy and acceptance criteria

### Implementation Checkpoints

Schedule reviews at:
- **End of Feature Set A:** Review data model and API design
- **End of Feature Set B:** Review detection logic and UI patterns
- **End of Feature Set C:** Review orchestration workflows
- **End of Feature Set D:** Review governance and audit trails
- **End of Dashboard:** Review overall UX and performance

---

## APPENDIX A: NAMING CONVENTIONS

### Database Objects

**Tables:** `pa_<entity_name>` (e.g., `pa_workflows`, `pa_triggers`)

**Indexes:** `idx_pa_<table>_<column>` (e.g., `idx_pa_workflows_tenant`)

**Constraints:** `<table>_<column>_check` (e.g., `pa_workflows_status_check`)

### Code Files

**Pages:** `<EntityName>Page.tsx` (e.g., `WorkflowsPage.tsx`)

**Types:** `PA<EntityName>` (e.g., `PAWorkflow`, `PATrigger`)

**Provider Methods:** `get<EntityName>sByTenant()`, `get<EntityName>ById()`, `create<EntityName>()`, `update<EntityName>()`, `archive<EntityName>()`

### Routes

**Pattern:** `/automate/<entity-name>` (e.g., `/automate/workflows`, `/automate/triggers`)

**Dashboard:** `/automation/dashboard`

**Alerts:** `/automation/alerts`

---

## APPENDIX B: QUICK REFERENCE

### Supabase Commands

```bash
# Start local Supabase
npx supabase start

# Check status
npx supabase status

# Reset database (apply all migrations + seeds)
npx supabase db reset

# Create new migration
npx supabase migration new <name>

# Apply migrations
npx supabase migration up

# Rollback migration
npx supabase migration down

# Stop Supabase
npx supabase stop
```

### Development Commands

```bash
# Start dev server (hybrid mode)
VITE_DATA_BACKEND=hybrid npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

### Verification Commands

```bash
# Check row counts
psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT COUNT(*) FROM pa_workflows;"

# Check FK integrity
psql -h localhost -p 54322 -U postgres -d postgres -f verify_fk_integrity.sql

# Export audit logs
psql -h localhost -p 54322 -U postgres -d postgres -c "COPY (SELECT * FROM pa_audit_logs WHERE tenant_id = '<dewa-id>') TO '/tmp/audit_logs.csv' CSV HEADER;"
```

---

## CONCLUSION

This comprehensive implementation plan provides a structured, iterative approach to building the Process Automation feature area for Plant4.0 Power Transmission. By following the rollout map, completing each feature set with full data + API + UI + verification, and adhering to the Definition of Done, we ensure a high-quality, maintainable, and scalable implementation.

**Next Steps:**
1. Review and approve this plan with stakeholders
2. Create individual spec files for each feature set (requirements.md, design.md, tasks.md)
3. Begin implementation with Feature Set A
4. Iterate through feature sets B, C, D
5. Complete with Dashboard & Monitoring
6. Conduct final verification and sign-off

**Estimated Timeline:** 16-21 days (3-4 weeks) for full implementation

**Team Size:** 1-2 developers (full-time)

**Dependencies:** Local Supabase setup complete, HybridProvider in place, Core tables seeded

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-23  
**Author:** Kiro AI Assistant  
**Status:** Ready for Review

