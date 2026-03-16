# Process Automation - Design

**Feature Name:** `process-automation`  
**Target Sector:** Power → Transmission  
**Data Backend:** Supabase (local only, via HybridProvider)  
**Created:** 2026-01-23

---

## ⚠️ CRITICAL: LOCAL DEVELOPMENT ONLY

**THIS IMPLEMENTATION IS FOR LOCAL DEVELOPMENT ONLY**

- ✅ **USE:** Local Supabase (`npx supabase start`)
- ❌ **NEVER:** Remote database or `--linked` flag
- ❌ **NEVER:** Production database changes
- ✅ **NO RLS:** All tables unrestricted for local development
- ✅ **NO AUTH:** Permissive local access only

**Commands to use:**
```bash
# ✅ CORRECT - Local only
npx supabase start
npx supabase db reset

# ❌ WRONG - Never use these
npx supabase db reset --linked
npx supabase db push --linked
```

---

## 1. Architecture Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React UI Layer                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Tag      │ │ Control  │ │ Triggers │ │ Workflows│ ...  │
│  │ Mapping  │ │ Models   │ │          │ │          │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  DataProvider Interface                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  HybridProvider (Sector-based Routing)               │  │
│  │  ├─ Power Transmission PA → SupabaseProvider        │  │
│  │  ├─ Oil & Gas Upstream PA → MockProvider (READ-ONLY)│  │
│  │  └─ Other sectors → MockProvider (READ-ONLY)        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Local Supabase (PostgreSQL)                     │
│              ONLY for Power Transmission                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ pa_tag_  │ │ pa_      │ │ pa_      │ │ pa_      │ ...  │
│  │ mappings │ │ triggers │ │ workflows│ │ versions │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

1. **User Action** → UI Component
2. **UI Component** → DataProvider method call
3. **HybridProvider** → Routes based on current sector:
   - **Power Transmission** → SupabaseProvider (local Supabase)
   - **Oil & Gas Upstream** → MockProvider (existing mock data, READ-ONLY)
   - **Other sectors** → MockProvider (existing mock data, READ-ONLY)
4. **SupabaseProvider** (Power Transmission only) → Supabase query
5. **MockProvider** (Oil & Gas and others) → Returns existing mock data
6. **Supabase/Mock** → Returns data
7. **Provider** → Transforms to TypeScript interface
8. **UI Component** → Renders data

**Key Routing Rules:**
- Power Transmission PA data comes from local Supabase (NEW data)
- Oil & Gas Upstream PA data comes from mock files (EXISTING data, unchanged)
- All other sectors use mock files (EXISTING data, unchanged)
- NO modifications to mock data files allowed

### 1.3 Technology Stack

- **Frontend:** React 18, TypeScript, TanStack Query
- **UI Components:** shadcn/ui, Tailwind CSS
- **Database:** PostgreSQL (via Local Supabase ONLY)
- **ORM:** Supabase JS Client
- **Charts:** Recharts
- **Code Editor:** Monaco Editor (for condition expressions)
- **State Management:** React Context + TanStack Query

**CRITICAL DATABASE CONSTRAINTS:**
- ⚠️ **LOCAL ONLY** - All database work MUST be on local Supabase (`npx supabase start`)
- ⚠️ **NEVER use `--linked`** - No remote database connections
- ⚠️ **NO RLS policies** - All tables unrestricted for local development
- ⚠️ **NO authentication** - Permissive local access only

---

## 2. Database Design


### 2.1 Entity Relationship Diagram

```
tenants (existing)
  │
  ├─── pa_tag_mappings
  ├─── pa_control_models
  ├─── pa_action_bindings
  │      │
  │      ├─── pa_triggers (references actions)
  │      ├─── pa_event_patterns (references actions)
  │      └─── pa_control_rules (references actions)
  │
  ├─── pa_alarm_rules
  │
  ├─── pa_workflows
  ├─── pa_sequences
  │
  ├─── pa_versions (references all PA entities)
  ├─── pa_approvals (references all PA entities)
  ├─── pa_simulations (references all PA entities)
  └─── pa_audit_logs (references all PA entities)
```

**Design Rationale:**
- All tables prefixed with `pa_` for clear namespace separation
- Action bindings serve as central hub for executable operations
- Versions, approvals, simulations, and audit logs use polymorphic references to support all PA entity types
- Foreign keys maintain referential integrity with existing tenant infrastructure

### 2.2 Table Schemas

#### 2.2.1 pa_tag_mappings

Maps physical sensor/actuator tags to logical automation variables.

```sql
CREATE TABLE pa_tag_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_tag TEXT NOT NULL,
  target_variable TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('boolean', 'integer', 'float', 'string')),
  unit TEXT,
  scaling_factor NUMERIC DEFAULT 1.0,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, source_tag, target_variable)
);
```

**Design Decisions:**
- `source_tag` + `target_variable` unique per tenant to prevent duplicate mappings
- `scaling_factor` supports unit conversions (e.g., PSI to bar)
- `data_type` enum ensures type safety for automation logic
- `status` allows soft archival without deletion


#### 2.2.2 pa_control_models

Defines state machines for equipment operational states.

```sql
CREATE TABLE pa_control_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  states JSONB NOT NULL,
  transitions JSONB NOT NULL,
  current_state TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

**Design Decisions:**
- JSONB for `states` and `transitions` provides flexibility for complex state machines
- `current_state` tracks runtime state for monitoring
- Validation ensures at least 2 states per model (enforced at application layer)
- Example states: `{"states": ["off", "starting", "running", "stopping", "fault"]}`
- Example transitions: `{"transitions": [{"from": "off", "to": "starting", "condition": "start_command"}]}`

#### 2.2.3 pa_action_bindings

Defines executable actions on actuators.

```sql
CREATE TABLE pa_action_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action_name TEXT NOT NULL,
  actuator_tag TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('control', 'safety', 'maintenance')),
  parameters JSONB,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, action_name, actuator_tag)
);
```

**Design Decisions:**
- `action_type` categorizes actions for filtering and safety checks
- JSONB `parameters` supports flexible action configuration
- Unique constraint prevents duplicate action definitions
- Example parameters: `{"setpoint": 100, "ramp_rate": 5, "timeout": 30}`


#### 2.2.4 pa_triggers

Event-driven automation rules.

```sql
CREATE TABLE pa_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  condition_expression TEXT NOT NULL,
  action_binding_ids UUID[] NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('safety', 'operational', 'maintenance')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

**Design Decisions:**
- `condition_expression` uses domain-specific language (e.g., `temperature > 80 AND pressure < 50`)
- `action_binding_ids` array allows multiple actions per trigger
- `enabled` flag allows temporary deactivation without deletion
- `last_triggered_at` tracks execution history
- `priority` and `trigger_type` support filtering and safety classification

#### 2.2.5 pa_alarm_rules

Alarm classification and routing configuration.

```sql
CREATE TABLE pa_alarm_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  classification TEXT NOT NULL CHECK (classification IN ('process', 'equipment', 'safety', 'environmental')),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'alarm', 'critical')),
  routing_destinations JSONB NOT NULL,
  auto_acknowledge_time INTEGER,
  escalation_time INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

**Design Decisions:**
- `routing_destinations` JSONB supports multiple notification channels
- Example: `{"email": ["ops@example.com"], "sms": ["+1234567890"], "webhook": ["https://api.example.com/alerts"]}`
- `auto_acknowledge_time` and `escalation_time` in seconds for automated workflows
- `classification` and `severity` enable intelligent routing and prioritization


#### 2.2.6 pa_event_patterns

Complex event pattern detection.

```sql
CREATE TABLE pa_event_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('trend', 'sequence', 'oscillation', 'degradation')),
  time_window_seconds INTEGER NOT NULL,
  match_conditions JSONB NOT NULL,
  action_binding_ids UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  last_detected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

**Design Decisions:**
- `pattern_type` supports different detection algorithms
- `time_window_seconds` defines temporal scope for pattern matching
- `match_conditions` JSONB stores pattern-specific configuration
- Example for sequence: `{"events": ["pump_start", "valve_open", "flow_detected"], "max_gap_seconds": 60}`
- Example for trend: `{"variable": "temperature", "direction": "increasing", "threshold_rate": 5}`

#### 2.2.7 pa_workflows

Multi-step automated procedures.

```sql
CREATE TABLE pa_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('manual', 'automatic', 'scheduled')),
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  execution_status TEXT NOT NULL DEFAULT 'idle' CHECK (execution_status IN ('idle', 'running', 'completed', 'failed')),
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

**Design Decisions:**
- `steps` JSONB array stores ordered workflow steps
- Example: `[{"step": 1, "action": "open_valve", "duration": 10}, {"step": 2, "action": "start_pump", "duration": 5}]`
- `trigger_type` determines how workflow is initiated
- `requires_approval` enforces safety checks for critical workflows
- `execution_status` tracks runtime state


#### 2.2.8 pa_sequences

Detailed step-by-step procedures with precise timing.

```sql
CREATE TABLE pa_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL,
  execution_mode TEXT NOT NULL CHECK (execution_mode IN ('sequential', 'parallel', 'conditional')),
  total_duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

**Design Decisions:**
- `steps` JSONB stores detailed step configuration with timing
- Example: `[{"step": 1, "action": "close_breaker", "duration": 2, "condition": "voltage_ok"}, {"step": 2, "action": "energize", "duration": 5}]`
- `execution_mode` determines step execution strategy
- `total_duration_seconds` auto-calculated from step durations for planning
- Supports conditional branching via step conditions

#### 2.2.9 pa_control_rules

Continuous control logic for maintaining operational parameters.

```sql
CREATE TABLE pa_control_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('if-then', 'when-then', 'continuous')),
  condition_expression TEXT NOT NULL,
  action_binding_ids UUID[] NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, name)
);
```

**Design Decisions:**
- `rule_type` distinguishes between event-driven and continuous control
- `if-then`: One-time execution when condition becomes true
- `when-then`: Execute every time condition is true
- `continuous`: PID-style continuous control
- Similar structure to triggers but focused on control vs. detection


#### 2.2.10 pa_versions

Version control for automation configurations.

```sql
CREATE TABLE pa_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('major', 'minor', 'patch')),
  description TEXT NOT NULL,
  affected_components JSONB NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  UNIQUE(tenant_id, version_number)
);
```

**Design Decisions:**
- `version_number` follows semantic versioning (X.Y.Z)
- `affected_components` JSONB stores references to changed entities
- Example: `{"workflows": ["wf-123"], "triggers": ["tr-456", "tr-789"], "control_rules": ["cr-101"]}`
- `approval_status` tracks governance workflow
- Supports rollback by maintaining historical versions

#### 2.2.11 pa_approvals

Approval workflows for safety-critical changes.

```sql
CREATE TABLE pa_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  approver_list TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_by TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  UNIQUE(tenant_id, record_type, record_id)
);
```

**Design Decisions:**
- Polymorphic design: `record_type` + `record_id` reference any PA entity
- `approver_list` supports multi-stage approvals
- `rejection_reason` required for rejected approvals (enforced at application layer)
- One active approval per record (unique constraint)


#### 2.2.12 pa_simulations

Simulation testing for automation components.

```sql
CREATE TABLE pa_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  simulation_type TEXT NOT NULL CHECK (simulation_type IN ('workflow', 'trigger', 'sequence', 'control_rule')),
  target_id UUID NOT NULL,
  input_parameters JSONB NOT NULL,
  expected_outcome TEXT,
  actual_outcome TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**Design Decisions:**
- `simulation_type` + `target_id` reference the entity being simulated
- `input_parameters` JSONB stores test scenario configuration
- `expected_outcome` vs `actual_outcome` enables validation
- `duration_seconds` calculated from `started_at` to `completed_at`
- No unique constraint - allows multiple simulations per target

#### 2.2.13 pa_audit_logs

Comprehensive audit trail for all PA operations.

```sql
CREATE TABLE pa_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('create', 'update', 'delete', 'execute', 'approve', 'reject')),
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_ip TEXT,
  user_agent TEXT,
  changes_before JSONB,
  changes_after JSONB,
  execution_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Design Decisions:**
- Immutable logs (no updates or deletes)
- Polymorphic references via `record_type` + `record_id`
- `changes_before` and `changes_after` capture full state for updates
- `execution_result` stores outcome for execute events
- User context (`user_name`, `user_ip`, `user_agent`) for forensics
- No unique constraints - multiple events per record expected


### 2.3 Indexes

Performance-critical indexes for common query patterns:

```sql
-- Tag mappings
CREATE INDEX idx_pa_tag_mappings_tenant ON pa_tag_mappings(tenant_id);
CREATE INDEX idx_pa_tag_mappings_status ON pa_tag_mappings(tenant_id, status);

-- Control models
CREATE INDEX idx_pa_control_models_tenant ON pa_control_models(tenant_id);
CREATE INDEX idx_pa_control_models_status ON pa_control_models(tenant_id, status);

-- Action bindings
CREATE INDEX idx_pa_action_bindings_tenant ON pa_action_bindings(tenant_id);
CREATE INDEX idx_pa_action_bindings_type ON pa_action_bindings(tenant_id, action_type);

-- Triggers
CREATE INDEX idx_pa_triggers_tenant ON pa_triggers(tenant_id);
CREATE INDEX idx_pa_triggers_enabled ON pa_triggers(tenant_id, enabled);
CREATE INDEX idx_pa_triggers_priority ON pa_triggers(tenant_id, priority);

-- Alarm rules
CREATE INDEX idx_pa_alarm_rules_tenant ON pa_alarm_rules(tenant_id);
CREATE INDEX idx_pa_alarm_rules_severity ON pa_alarm_rules(tenant_id, severity);

-- Event patterns
CREATE INDEX idx_pa_event_patterns_tenant ON pa_event_patterns(tenant_id);
CREATE INDEX idx_pa_event_patterns_type ON pa_event_patterns(tenant_id, pattern_type);

-- Workflows
CREATE INDEX idx_pa_workflows_tenant ON pa_workflows(tenant_id);
CREATE INDEX idx_pa_workflows_status ON pa_workflows(tenant_id, execution_status);

-- Sequences
CREATE INDEX idx_pa_sequences_tenant ON pa_sequences(tenant_id);
CREATE INDEX idx_pa_sequences_mode ON pa_sequences(tenant_id, execution_mode);

-- Control rules
CREATE INDEX idx_pa_control_rules_tenant ON pa_control_rules(tenant_id);
CREATE INDEX idx_pa_control_rules_enabled ON pa_control_rules(tenant_id, enabled);

-- Versions
CREATE INDEX idx_pa_versions_tenant ON pa_versions(tenant_id);
CREATE INDEX idx_pa_versions_approval ON pa_versions(tenant_id, approval_status);

-- Approvals
CREATE INDEX idx_pa_approvals_tenant ON pa_approvals(tenant_id);
CREATE INDEX idx_pa_approvals_status ON pa_approvals(tenant_id, status);

-- Simulations
CREATE INDEX idx_pa_simulations_tenant ON pa_simulations(tenant_id);
CREATE INDEX idx_pa_simulations_type ON pa_simulations(tenant_id, simulation_type);
CREATE INDEX idx_pa_simulations_status ON pa_simulations(tenant_id, status);

-- Audit logs
CREATE INDEX idx_pa_audit_logs_tenant ON pa_audit_logs(tenant_id);
CREATE INDEX idx_pa_audit_logs_record ON pa_audit_logs(tenant_id, record_type, record_id);
CREATE INDEX idx_pa_audit_logs_event ON pa_audit_logs(tenant_id, event_type);
CREATE INDEX idx_pa_audit_logs_created ON pa_audit_logs(tenant_id, created_at DESC);
```

**Design Rationale:**
- All indexes include `tenant_id` for query isolation
- Status/enabled indexes support filtering active records
- Composite indexes optimize common filter combinations
- Audit log indexes support time-range and record-specific queries

---

## 3. API Design


### 3.1 DataProvider Interface Extensions

The SupabaseProvider will implement these methods for Process Automation:

```typescript
interface ProcessAutomationProvider {
  // Tag Mappings
  getTagMappings(filters?: TagMappingFilters): Promise<TagMapping[]>;
  getTagMapping(id: string): Promise<TagMapping>;
  createTagMapping(data: CreateTagMappingInput): Promise<TagMapping>;
  updateTagMapping(id: string, data: UpdateTagMappingInput): Promise<TagMapping>;
  archiveTagMapping(id: string): Promise<void>;

  // Control Models
  getControlModels(filters?: ControlModelFilters): Promise<ControlModel[]>;
  getControlModel(id: string): Promise<ControlModel>;
  createControlModel(data: CreateControlModelInput): Promise<ControlModel>;
  updateControlModel(id: string, data: UpdateControlModelInput): Promise<ControlModel>;
  updateControlModelState(id: string, newState: string): Promise<ControlModel>;

  // Action Bindings
  getActionBindings(filters?: ActionBindingFilters): Promise<ActionBinding[]>;
  getActionBinding(id: string): Promise<ActionBinding>;
  createActionBinding(data: CreateActionBindingInput): Promise<ActionBinding>;
  updateActionBinding(id: string, data: UpdateActionBindingInput): Promise<ActionBinding>;

  // Triggers
  getTriggers(filters?: TriggerFilters): Promise<Trigger[]>;
  getTrigger(id: string): Promise<Trigger>;
  createTrigger(data: CreateTriggerInput): Promise<Trigger>;
  updateTrigger(id: string, data: UpdateTriggerInput): Promise<Trigger>;
  toggleTrigger(id: string, enabled: boolean): Promise<Trigger>;

  // Alarm Rules
  getAlarmRules(filters?: AlarmRuleFilters): Promise<AlarmRule[]>;
  getAlarmRule(id: string): Promise<AlarmRule>;
  createAlarmRule(data: CreateAlarmRuleInput): Promise<AlarmRule>;
  updateAlarmRule(id: string, data: UpdateAlarmRuleInput): Promise<AlarmRule>;

  // Event Patterns
  getEventPatterns(filters?: EventPatternFilters): Promise<EventPattern[]>;
  getEventPattern(id: string): Promise<EventPattern>;
  createEventPattern(data: CreateEventPatternInput): Promise<EventPattern>;
  updateEventPattern(id: string, data: UpdateEventPatternInput): Promise<EventPattern>;

  // Workflows
  getWorkflows(filters?: WorkflowFilters): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow>;
  createWorkflow(data: CreateWorkflowInput): Promise<Workflow>;
  updateWorkflow(id: string, data: UpdateWorkflowInput): Promise<Workflow>;
  executeWorkflow(id: string): Promise<WorkflowExecution>;

  // Sequences
  getSequences(filters?: SequenceFilters): Promise<Sequence[]>;
  getSequence(id: string): Promise<Sequence>;
  createSequence(data: CreateSequenceInput): Promise<Sequence>;
  updateSequence(id: string, data: UpdateSequenceInput): Promise<Sequence>;

  // Control Rules
  getControlRules(filters?: ControlRuleFilters): Promise<ControlRule[]>;
  getControlRule(id: string): Promise<ControlRule>;
  createControlRule(data: CreateControlRuleInput): Promise<ControlRule>;
  updateControlRule(id: string, data: UpdateControlRuleInput): Promise<ControlRule>;
  toggleControlRule(id: string, enabled: boolean): Promise<ControlRule>;

  // Versions
  getVersions(filters?: VersionFilters): Promise<Version[]>;
  getVersion(id: string): Promise<Version>;
  createVersion(data: CreateVersionInput): Promise<Version>;

  // Approvals
  getApprovals(filters?: ApprovalFilters): Promise<Approval[]>;
  getApproval(id: string): Promise<Approval>;
  createApproval(data: CreateApprovalInput): Promise<Approval>;
  approveApproval(id: string, approver: string): Promise<Approval>;
  rejectApproval(id: string, approver: string, reason: string): Promise<Approval>;

  // Simulations
  getSimulations(filters?: SimulationFilters): Promise<Simulation[]>;
  getSimulation(id: string): Promise<Simulation>;
  createSimulation(data: CreateSimulationInput): Promise<Simulation>;
  executeSimulation(id: string): Promise<Simulation>;

  // Audit Logs
  getAuditLogs(filters?: AuditLogFilters): Promise<AuditLog[]>;
  exportAuditLogs(filters?: AuditLogFilters): Promise<Blob>;
}
```

**Design Decisions:**
- All methods scoped to current tenant (implicit from context)
- Separate methods for state changes (toggleTrigger, executeWorkflow) vs. data updates
- Filters use optional parameters for flexible querying
- Execute methods return execution results, not just success/failure


### 3.2 TypeScript Interfaces

Core domain models:

```typescript
// Tag Mappings
interface TagMapping {
  id: string;
  tenantId: string;
  sourceTag: string;
  targetVariable: string;
  dataType: 'boolean' | 'integer' | 'float' | 'string';
  unit?: string;
  scalingFactor: number;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Control Models
interface ControlModel {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  states: string[];
  transitions: StateTransition[];
  currentState?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface StateTransition {
  from: string;
  to: string;
  condition?: string;
}

// Action Bindings
interface ActionBinding {
  id: string;
  tenantId: string;
  actionName: string;
  actuatorTag: string;
  actionType: 'control' | 'safety' | 'maintenance';
  parameters?: Record<string, any>;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Triggers
interface Trigger {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  conditionExpression: string;
  actionBindingIds: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  triggerType: 'safety' | 'operational' | 'maintenance';
  enabled: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Workflows
interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggerType: 'manual' | 'automatic' | 'scheduled';
  requiresApproval: boolean;
  executionStatus: 'idle' | 'running' | 'completed' | 'failed';
  lastExecutedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowStep {
  step: number;
  action: string;
  duration?: number;
  condition?: string;
}

// Audit Logs
interface AuditLog {
  id: string;
  tenantId: string;
  eventType: 'create' | 'update' | 'delete' | 'execute' | 'approve' | 'reject';
  recordType: string;
  recordId: string;
  userName: string;
  userIp?: string;
  userAgent?: string;
  changesBefore?: Record<string, any>;
  changesAfter?: Record<string, any>;
  executionResult?: string;
  createdAt: string;
}
```

**Design Decisions:**
- All timestamps as ISO 8601 strings for JSON serialization
- Enums as string literal unions for type safety
- Optional fields use `?` for clarity
- JSONB fields typed as arrays or records for flexibility
- Separate interfaces for nested structures (StateTransition, WorkflowStep)

---

## 4. UI Design


### 4.1 Page Structure (nLVE Pattern)

All 15 pages follow the Navigate → List → View → Edit pattern:

```
/automate
  ├─ /tag-mapping          → TagMappingPage (List + Create)
  ├─ /control-models       → ControlModelsPage (List + Create)
  ├─ /action-bindings      → ActionBindingsPage (List + Create)
  ├─ /triggers             → TriggersPage (List + Create)
  ├─ /alarm-rules          → AlarmRulesPage (List + Create)
  ├─ /event-patterns       → EventPatternsPage (List + Create)
  ├─ /workflows            → WorkflowsPage (List + Create + Execute)
  ├─ /sequences            → SequencesPage (List + Create)
  ├─ /control-rules        → ControlRulesPage (List + Create)
  ├─ /versions             → VersionsPage (List + Create)
  ├─ /approvals            → ApprovalsPage (List + Approve/Reject)
  ├─ /simulations          → SimulationsPage (List + Create + Execute)
  ├─ /audit-logs           → AuditLogsPage (List + Export)
  ├─ /dashboard            → AutomationDashboard (Read-only)
  └─ /alerts               → AutomationAlerts (List + Acknowledge/Resolve)
```

**Design Decisions:**
- All pages under `/automate` route for clear namespace
- List + Create combined in single page (modal/drawer for create)
- View details via expandable rows or side panels
- Edit via inline editing or modal forms
- Special actions (Execute, Approve, Export) as dedicated buttons

### 4.2 Common UI Components

Reusable components across all PA pages:

```typescript
// Status indicators
<StatusBadge status="active" />
<StatusBadge status="running" pulse />

// Priority indicators
<PriorityBadge priority="critical" />

// Empty states
<EmptyState
  icon={Workflow}
  title="No workflows yet"
  description="Create your first workflow to automate operations"
  action={<Button>Create Workflow</Button>}
/>

// Loading states
<LoadingState message="Loading workflows..." />

// Data tables with filters
<DataTable
  data={workflows}
  columns={workflowColumns}
  filters={<WorkflowFilters />}
  actions={<WorkflowActions />}
/>

// Code editor for expressions
<CodeEditor
  value={conditionExpression}
  language="automation-dsl"
  onChange={setConditionExpression}
/>

// JSON editor for parameters
<JsonEditor
  value={parameters}
  schema={actionParametersSchema}
  onChange={setParameters}
/>
```

**Design Rationale:**
- Consistent visual language across all pages
- Accessibility-first (keyboard navigation, ARIA labels)
- Loading and empty states prevent confusion
- Specialized editors for technical content


### 4.3 Dashboard Design

The Automation Dashboard provides high-level monitoring:

**KPI Cards (Top Row):**
- Active Workflows (count + running indicator)
- Active Triggers (count + last triggered)
- Pending Approvals (count + oldest age)
- Recent Simulations (count + pass rate)
- Alarm Rules (count + active alarms)
- Audit Events (24h count)

**Charts (Main Area):**
- Workflow Execution Timeline (line chart, last 7 days)
- Trigger Activation Heatmap (calendar heatmap, last 30 days)
- Approval Status Distribution (pie chart)
- Audit Event Types (bar chart, last 24h)

**Quick Actions (Bottom):**
- Create Workflow
- Create Trigger
- View Pending Approvals
- View Recent Audit Logs

**Design Decisions:**
- Auto-refresh every 30 seconds (configurable)
- Manual refresh button for immediate updates
- Time range selector (24h, 7d, 30d, custom)
- Click-through navigation to detail pages
- Responsive layout (stacks on mobile)

### 4.4 Alert Management Design

The Automation Alerts page manages operational alerts:

**Alert List:**
- Type badge (trigger, workflow, approval)
- Severity indicator (color-coded)
- Status (open, acknowledged, resolved)
- Timestamp (created, acknowledged, resolved)
- Related record link

**Filters:**
- Type (trigger activation, workflow failure, approval request)
- Severity (info, warning, alarm, critical)
- Status (open, acknowledged, resolved)
- Date range

**Bulk Actions:**
- Acknowledge selected
- Resolve selected
- Export to CSV

**Design Decisions:**
- Real-time updates via polling (every 10 seconds)
- Sound/visual notification for critical alerts
- Keyboard shortcuts for quick actions (A = acknowledge, R = resolve)
- Alert details in expandable panel

---

## 5. Implementation Strategy


### 5.1 Phased Approach

**Phase 1: Foundation (Feature Set A - Integrate & Model)**
1. Create database tables (tag_mappings, control_models, action_bindings)
2. Implement SupabaseProvider methods
3. Build UI pages (Tag Mapping, Control Models, Action Bindings)
4. Seed demo data
5. Verify with SQL queries and UI testing

**Phase 2: Detection (Feature Set B - Monitor & Detect)**
1. Create database tables (triggers, alarm_rules, event_patterns)
2. Implement SupabaseProvider methods
3. Build UI pages (Triggers, Alarm Rules, Event Patterns)
4. Seed demo data
5. Verify with SQL queries and UI testing

**Phase 3: Orchestration (Feature Set C - Automate & Control)**
1. Create database tables (workflows, sequences, control_rules)
2. Implement SupabaseProvider methods
3. Build UI pages (Workflows, Sequences, Control Rules)
4. Seed demo data
5. Verify with SQL queries and UI testing

**Phase 4: Governance (Feature Set D - Govern & Assure)**
1. Create database tables (versions, approvals, simulations, audit_logs)
2. Implement SupabaseProvider methods
3. Build UI pages (Versions, Approvals, Simulations, Audit Logs)
4. Seed demo data
5. Verify with SQL queries and UI testing

**Phase 5: Monitoring (Feature Set E - Dashboard & Monitoring)**
1. Build Automation Dashboard with KPIs and charts
2. Build Automation Alerts page
3. Integrate with existing alert system
4. Verify end-to-end workflows

**Design Rationale:**
- Each phase builds on previous foundation
- Complete vertical slices (DB → API → UI) per phase
- Early phases unblock later dependencies
- Incremental verification reduces integration risk

### 5.2 Migration Strategy

**CRITICAL: LOCAL DATABASE ONLY**
- ⚠️ **ALL migrations run on local Supabase ONLY** (`npx supabase start`)
- ⚠️ **NEVER run migrations with `--linked` flag**
- ⚠️ **NO remote database changes**
- ⚠️ **NO RLS policies** - All tables unrestricted

**Database Migrations:**
```
supabase/migrations/
  ├─ 012_create_pa_tag_mappings.sql          (LOCAL ONLY - NO RLS)
  ├─ 013_create_pa_control_models.sql        (LOCAL ONLY - NO RLS)
  ├─ 014_create_pa_action_bindings.sql       (LOCAL ONLY - NO RLS)
  ├─ 015_create_pa_triggers.sql              (LOCAL ONLY - NO RLS)
  ├─ 016_create_pa_alarm_rules.sql           (LOCAL ONLY - NO RLS)
  ├─ 017_create_pa_event_patterns.sql        (LOCAL ONLY - NO RLS)
  ├─ 018_create_pa_workflows.sql             (LOCAL ONLY - NO RLS)
  ├─ 019_create_pa_sequences.sql             (LOCAL ONLY - NO RLS)
  ├─ 020_create_pa_control_rules.sql         (LOCAL ONLY - NO RLS)
  ├─ 021_create_pa_versions.sql              (LOCAL ONLY - NO RLS)
  ├─ 022_create_pa_approvals.sql             (LOCAL ONLY - NO RLS)
  ├─ 023_create_pa_simulations.sql           (LOCAL ONLY - NO RLS)
  └─ 024_create_pa_audit_logs.sql            (LOCAL ONLY - NO RLS)
```

**Seed Data:**
```
supabase/seed/
  ├─ 007_pa_tag_mappings.sql
  ├─ 008_pa_control_models.sql
  ├─ 009_pa_action_bindings.sql
  ├─ 010_pa_triggers.sql
  ├─ 011_pa_alarm_rules.sql
  ├─ 012_pa_event_patterns.sql
  ├─ 013_pa_workflows.sql
  ├─ 014_pa_sequences.sql
  ├─ 015_pa_control_rules.sql
  ├─ 016_pa_versions.sql
  ├─ 017_pa_approvals.sql
  └─ 018_pa_simulations.sql
```

**Design Decisions:**
- One migration per table for granular control
- Seed files match migration order
- No seed data for audit_logs (generated by operations)
- All migrations idempotent (IF NOT EXISTS)
- **NO RLS policies** - unrestricted local access for development
- **NO authentication checks** - permissive local environment


### 5.3 Testing Strategy

**Unit Tests:**
- DataProvider methods (mocked Supabase client)
- TypeScript interface validation
- Utility functions (date formatting, status mapping)

**Integration Tests:**
- End-to-end workflows (create → execute → audit)
- Cross-table relationships (triggers → action bindings)
- Filter and search functionality

**SQL Verification Queries:**
```sql
-- Verify row counts
SELECT 'pa_tag_mappings' as table_name, COUNT(*) FROM pa_tag_mappings;
SELECT 'pa_workflows' as table_name, COUNT(*) FROM pa_workflows;

-- Verify FK integrity
SELECT COUNT(*) FROM pa_triggers t
LEFT JOIN pa_action_bindings ab ON ab.id = ANY(t.action_binding_ids)
WHERE ab.id IS NULL;

-- Verify unique constraints
SELECT source_tag, target_variable, COUNT(*)
FROM pa_tag_mappings
GROUP BY source_tag, target_variable
HAVING COUNT(*) > 1;
```

**UI Verification Steps:**
1. Navigate to each page (no console errors)
2. Create new record (form validation works)
3. Edit existing record (changes persist)
4. Filter list (results update correctly)
5. Execute action (workflow runs, simulation executes)
6. View audit logs (events recorded)

**Design Rationale:**
- Automated tests catch regressions
- SQL queries verify data integrity
- Manual UI testing ensures UX quality
- Incremental verification per phase

---

## 6. Security Considerations

**IMPORTANT: Local Development Environment**
- ⚠️ **NO RLS policies** - All tables unrestricted for local development
- ⚠️ **NO authentication** - Permissive local access only
- ⚠️ **LOCAL ONLY** - These security measures are for local development, not production

### 6.1 Tenant Isolation (Application-Level Only)

All queries SHOULD include tenant_id filter for data organization (not security):

```typescript
// ✅ RECOMMENDED - Keeps data organized by tenant
const workflows = await supabase
  .from('pa_workflows')
  .select('*')
  .eq('tenant_id', tenantId);

// ⚠️ WORKS BUT NOT RECOMMENDED - Returns all tenants' data
const workflows = await supabase
  .from('pa_workflows')
  .select('*');
```

**Design Decisions:**
- Tenant ID from AppContext (current user session)
- All DataProvider methods include tenant scoping for data organization
- Database indexes include tenant_id for performance
- **NO RLS policies** - unrestricted local database access
- **NO authentication checks** - permissive local environment
- Tenant isolation is application-level only (not database-enforced)

### 6.2 Input Validation

All user inputs MUST be validated:

```typescript
// Condition expressions
validateConditionExpression(expression: string): boolean {
  // Check for SQL injection patterns
  // Validate syntax against DSL grammar
  // Ensure only allowed functions/operators
}

// JSONB fields
validateJsonSchema(data: any, schema: JSONSchema): boolean {
  // Validate against JSON schema
  // Sanitize nested objects
  // Prevent prototype pollution
}
```

**Design Decisions:**
- Client-side validation for UX (immediate feedback)
- Server-side validation for security (cannot be bypassed)
- Schema validation for JSONB fields
- Whitelist approach for condition expressions


### 6.3 Audit Logging

All operations MUST be logged:

```typescript
async function createWorkflow(data: CreateWorkflowInput): Promise<Workflow> {
  // 1. Create workflow
  const workflow = await supabase.from('pa_workflows').insert(data).single();
  
  // 2. Log creation
  await supabase.from('pa_audit_logs').insert({
    tenant_id: tenantId,
    event_type: 'create',
    record_type: 'workflow',
    record_id: workflow.id,
    user_name: currentUser.name,
    user_ip: currentUser.ip,
    changes_after: workflow,
  });
  
  return workflow;
}
```

**Design Decisions:**
- Automatic logging in DataProvider methods
- Capture user context (name, IP, user agent)
- Store full state for updates (before/after)
- Immutable logs (no updates or deletes)

---

## 7. Performance Optimization

### 7.1 Query Optimization

**Indexes for common queries:**
- Tenant + status filters (most list pages)
- Tenant + enabled filters (triggers, control rules)
- Tenant + execution status (workflows, simulations)
- Tenant + created_at DESC (audit logs)

**Pagination strategy:**
```typescript
// Cursor-based pagination for large datasets
const { data, nextCursor } = await getAuditLogs({
  limit: 50,
  cursor: lastId,
});
```

**Design Decisions:**
- Cursor pagination for audit logs (unbounded growth)
- Offset pagination for bounded datasets (workflows, triggers)
- Indexes cover all filter combinations
- JSONB indexes for frequently queried nested fields

### 7.2 Caching Strategy

**TanStack Query configuration:**
```typescript
const workflowsQuery = useQuery({
  queryKey: ['workflows', filters],
  queryFn: () => dataProvider.getWorkflows(filters),
  staleTime: 30_000, // 30 seconds
  cacheTime: 300_000, // 5 minutes
});
```

**Design Decisions:**
- Short stale time for operational data (workflows, triggers)
- Longer cache time for reference data (tag mappings, control models)
- Invalidate cache on mutations (create, update, delete)
- Background refetch for dashboard auto-refresh


### 7.3 Bundle Size Optimization

**Code splitting by route:**
```typescript
const TagMappingPage = lazy(() => import('./pages/automate/TagMappingPage'));
const WorkflowsPage = lazy(() => import('./pages/automate/WorkflowsPage'));
```

**Design Decisions:**
- Lazy load all PA pages (not needed until navigation)
- Monaco Editor loaded on-demand (large dependency)
- Recharts tree-shaken (import specific chart types)
- Shared components in common bundle

---

## 8. Accessibility

### 8.1 Keyboard Navigation

All interactive elements MUST be keyboard accessible:

```typescript
// Table row actions
<TableRow
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter') openDetails();
    if (e.key === 'e') openEdit();
    if (e.key === 'd') deleteRecord();
  }}
>
```

**Design Decisions:**
- Tab order follows visual layout
- Enter key activates primary action
- Escape key closes modals/drawers
- Arrow keys navigate lists
- Keyboard shortcuts documented in help

### 8.2 Screen Reader Support

All content MUST be announced correctly:

```typescript
// Status badges
<Badge aria-label={`Status: ${status}`}>
  {status}
</Badge>

// Loading states
<div role="status" aria-live="polite">
  Loading workflows...
</div>

// Error messages
<div role="alert" aria-live="assertive">
  Failed to create workflow
</div>
```

**Design Decisions:**
- ARIA labels for icon-only buttons
- Live regions for dynamic content
- Semantic HTML (nav, main, aside)
- Skip links for keyboard users

---

## 9. Error Handling

### 9.1 Error Types

```typescript
class PAError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}

// Validation errors
throw new PAError('INVALID_EXPRESSION', 'Condition expression syntax error', {
  expression,
  position: 42,
});

// Database errors
throw new PAError('DUPLICATE_NAME', 'Workflow name already exists', {
  name: 'Startup Sequence',
});

// Permission errors
throw new PAError('APPROVAL_REQUIRED', 'This workflow requires approval', {
  workflowId,
  approvers: ['admin@example.com'],
});
```

**Design Decisions:**
- Structured error codes for programmatic handling
- User-friendly messages for UI display
- Details object for debugging
- Error boundaries catch React errors


### 9.2 Error Recovery

```typescript
// Retry failed operations
const { mutate, isError, error, reset } = useMutation({
  mutationFn: createWorkflow,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// Fallback UI
if (isError) {
  return (
    <ErrorState
      error={error}
      onRetry={reset}
      onCancel={() => navigate('/automate/workflows')}
    />
  );
}
```

**Design Decisions:**
- Exponential backoff for transient errors
- Manual retry for user-initiated actions
- Graceful degradation (show cached data)
- Clear error messages with recovery actions

---

## 10. Monitoring & Observability

### 10.1 Metrics

Key metrics to track:

- **Performance:**
  - Page load time (p50, p95, p99)
  - API response time (per method)
  - Database query time (per table)

- **Usage:**
  - Active workflows (count, execution rate)
  - Active triggers (count, activation rate)
  - Pending approvals (count, age distribution)
  - Audit log volume (events per hour)

- **Errors:**
  - Failed workflow executions (count, error types)
  - Failed simulations (count, failure reasons)
  - API errors (count, error codes)

**Design Decisions:**
- Client-side metrics via performance API
- Server-side metrics via Supabase logs
- Dashboard displays key metrics
- Alerts for anomalies (spike in failures)

### 10.2 Logging

```typescript
// Structured logging
logger.info('Workflow executed', {
  workflowId,
  duration: executionTime,
  status: 'completed',
  steps: completedSteps,
});

logger.error('Workflow execution failed', {
  workflowId,
  error: error.message,
  step: failedStep,
  retryable: true,
});
```

**Design Decisions:**
- Structured logs (JSON format)
- Correlation IDs for request tracing
- Log levels (debug, info, warn, error)
- Sensitive data redacted (passwords, tokens)

---

## 11. Future Enhancements

### 11.1 Phase 2 Features (Out of Scope)

- **Real-time Updates:** WebSocket integration for live workflow status
- **AI Recommendations:** ML-powered automation suggestions
- **Mobile App:** Field operations on mobile devices
- **Advanced Simulation:** Physics-based simulation engine
- **Workflow Templates:** Pre-built workflow library

### 11.2 Phase 3 Features (Out of Scope)

- **SCADA Integration:** Direct integration with external SCADA systems
- **Multi-tenant Collaboration:** Shared workflows across tenants
- **Advanced Analytics:** Predictive maintenance insights
- **Custom DSL Editor:** Visual programming for conditions
- **Workflow Marketplace:** Community-contributed workflows

**Design Rationale:**
- Focus on core functionality first
- Validate with users before advanced features
- Incremental complexity reduces risk
- Future-proof architecture (extensible design)

---

## 12. Success Metrics

The Process Automation feature is successful when:

1. **Functional Completeness:**
   - All 13 tables created and seeded
   - All 60+ DataProvider methods implemented
   - All 15 pages functional with nLVE pattern
   - All acceptance criteria met (AC 2.1.1 - AC 2.15.7)

2. **Performance:**
   - List pages load < 2 seconds
   - Detail pages load < 1 second
   - Filters respond < 500ms
   - Dashboard auto-refresh < 1 second

3. **Quality:**
   - Zero TypeScript errors
   - Zero console errors
   - All tests passing
   - Build succeeds

4. **User Experience:**
   - Keyboard navigation works
   - Screen readers announce correctly
   - Empty/loading/error states present
   - Cross-linking between records works

5. **Data Integrity:**
   - All FK constraints enforced
   - All unique constraints enforced
   - Tenant isolation verified
   - Audit logs complete

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-23  
**Status:** Ready for Implementation
