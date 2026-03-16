# Process Automation (PA) Generic Schema

## Overview

This document defines the generic schema structure for Process Automation mock data based on the existing implementation in the DQ Plant 4.0 system. The schema follows a hierarchical, sector-based organization with comprehensive governance and audit capabilities.

## Core Architecture

### Base Interface

All PA records inherit from a common base interface:

```typescript
interface PARecord {
  id: string;                    // Unique identifier
  name: string;                  // Human-readable name
  description: string;           // Detailed description
  sector: string;                // Industry sector (oil-gas, power, fmcg, etc.)
  subsector: string;             // Industry subsector
  status: "active" | "draft" | "archived";  // Record status
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  createdBy: string;             // User identifier
}
```

### Sector Organization

The schema is organized by industry sectors and subsectors:

#### Oil & Gas
- **Upstream**: Exploration, drilling, production
- **Midstream**: Transportation, storage, processing
- **Downstream**: Refining, distribution, retail

#### Power
- **Generation**: Power plants, renewable sources
- **Transmission**: High-voltage transmission lines
- **Distribution**: Local distribution networks

#### FMCG (Fast-Moving Consumer Goods)
- **Food & Beverage**: Production lines, packaging
- **Personal Care & Cosmetics**: Manufacturing processes
- **Household Care**: Product manufacturing
- **Health & Wellness (OTC)**: Over-the-counter products

#### Water
- **Water Supply & Treatment**: Treatment plants, purification
- **Distribution & Networks**: Pipeline networks
- **Wastewater & Reuse**: Treatment and recycling

#### Mining
- **Metal Ores**: Extraction and processing
- **Mineral Fuels**: Coal, oil shale extraction
- **Industrial Minerals**: Construction materials
- **Gemstones**: Precious stone extraction

## Core PA Components

### 1. Tag Mapping

Maps physical sensor/actuator tags to logical variables.

```typescript
interface TagMapping extends PARecord {
  sourceTag: string;             // Physical tag identifier
  targetVariable: string;        // Logical variable name
  dataType: string;              // Data type (float, boolean, string, integer)
  unit: string;                  // Engineering unit
  scalingFactor?: number;        // Optional scaling factor
}
```

**Examples by Sector:**
- **Oil & Gas**: Wellhead pressure, ESP speed, separator level
- **Power**: Breaker status, line voltage, bus voltage
- **FMCG**: Filler speed, conveyor speed, process temperature

### 2. Control Models

State machines defining equipment operational states.

```typescript
interface ControlModel extends PARecord {
  states: string[];              // Available states
  currentState?: string;         // Current state
  transitions?: {                // State transitions
    from: string;
    to: string;
    condition: string;
  }[];
}
```

**Common State Patterns:**
- **Equipment States**: Idle, Starting, Running, Blocked, Faulted
- **Process States**: Normal, High-Level, Bypass, Trip
- **Power States**: Energized, De-energized, Isolated

### 3. Action Bindings

Define executable actions on actuators.

```typescript
interface ActionBinding extends PARecord {
  action: string;                // Action identifier
  actuator: string;              // Target actuator
  parameters?: Record<string, any>; // Action parameters
}
```

**Action Categories:**
- **Control Actions**: Start/stop, open/close, adjust setpoint
- **Safety Actions**: Emergency stop, isolation, trip
- **Maintenance Actions**: Test, calibrate, reset

### 4. Triggers

Event-driven automation rules.

```typescript
interface Trigger extends PARecord {
  condition: string;             // Trigger condition
  actions: string[];             // Actions to execute
  priority: "low" | "medium" | "high" | "critical"; // Priority level
}
```

**Trigger Types:**
- **Safety Triggers**: Pressure anomalies, temperature limits
- **Operational Triggers**: Level control, flow regulation
- **Maintenance Triggers**: Scheduled maintenance, calibration due

### 5. Alarm Rules

Define alarm classification and routing.

```typescript
interface AlarmRule extends PARecord {
  classification: string;        // Alarm classification
  severity: "info" | "warning" | "alarm" | "critical"; // Severity level
  routing: string[];             // Routing destinations
  autoAcknowledge: boolean;      // Auto-acknowledge flag
  escalationTime?: number;       // Escalation time in seconds
}
```

**Alarm Classifications:**
- **Process Alarms**: Operational deviations
- **Equipment Alarms**: Equipment malfunctions
- **Safety Alarms**: Safety system activations
- **Security Alarms**: Security violations

### 6. Event Patterns

Complex event pattern detection.

```typescript
interface EventPattern extends PARecord {
  patternType: string;           // Pattern type
  events: string[];              // Events to monitor
  timeWindow: number;            // Time window in seconds
  matchCondition: string;        // Pattern matching condition
  actions: string[];             // Actions when pattern matches
}
```

**Pattern Types:**
- **Trend Analysis**: Gradual changes over time
- **Sequence Detection**: Event sequences
- **Oscillation Detection**: Cyclic patterns
- **Performance Degradation**: Equipment aging indicators

### 7. Workflows

Multi-step automated procedures.

```typescript
interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  parameters?: Record<string, any>;
}

interface Workflow extends PARecord {
  steps: WorkflowStep[];         // Workflow steps
  triggerType: string;           // Trigger type (manual, automatic, scheduled)
  approvalRequired: boolean;     // Approval requirement
}
```

**Workflow Categories:**
- **Startup/Shutdown**: Equipment startup/shutdown sequences
- **Maintenance**: Maintenance procedures
- **Emergency**: Emergency response procedures
- **Optimization**: Performance optimization routines

### 8. Sequences

Detailed step-by-step procedures.

```typescript
interface SequenceStep {
  id: string;
  order: number;
  name: string;
  action: string;
  duration?: number;
  condition?: string;
  parameters?: Record<string, any>;
}

interface Sequence extends PARecord {
  steps: SequenceStep[];         // Sequence steps
  executionMode: "sequential" | "parallel" | "conditional"; // Execution mode
  totalDuration?: number;        // Total duration estimate
}
```

### 9. Control Rules

Continuous control logic.

```typescript
interface ControlRule extends PARecord {
  ruleType: "if-then" | "when-then" | "continuous"; // Rule type
  condition: string;             // Rule condition
  actions: string[];             // Actions to execute
  priority: "low" | "medium" | "high" | "critical"; // Priority
  enabled: boolean;              // Enable/disable flag
}
```

## Governance & Assurance Components

### 1. Versions

Track changes and versions of PA components.

```typescript
interface Version extends PARecord {
  versionNumber: string;         // Version number (semantic versioning)
  previousVersion?: string;      // Previous version
  changeType: "major" | "minor" | "patch"; // Change type
  changeDescription: string;     // Description of changes
  affectedComponents: string[];  // Affected components
  approvalStatus: "pending" | "approved" | "rejected"; // Approval status
  approvedBy?: string;           // Approver
  approvedAt?: string;           // Approval timestamp
}
```

### 2. Approvals

Manage approval workflows for changes.

```typescript
interface Approval extends PARecord {
  requestType: string;           // Type of approval request
  requestedBy: string;           // Requester
  requestedAt: string;           // Request timestamp
  approvers: string[];           // List of approvers
  currentApprover?: string;      // Current approver
  approvalStatus: "pending" | "approved" | "rejected" | "cancelled";
  approvedBy?: string[];         // Approved by users
  approvedAt?: string;           // Approval timestamp
  rejectedBy?: string;           // Rejected by user
  rejectedAt?: string;           // Rejection timestamp
  rejectionReason?: string;      // Rejection reason
  relatedRecordId: string;       // Related record ID
  relatedRecordType: string;     // Related record type
}
```

### 3. Simulations

Test and validate PA components.

```typescript
interface Simulation extends PARecord {
  simulationType: "workflow" | "control_rule" | "sequence" | "trigger";
  targetRecordId: string;        // Target record to simulate
  targetRecordName: string;      // Target record name
  inputParameters: Record<string, any>; // Input parameters
  expectedOutcome: string;       // Expected outcome
  actualOutcome?: string;        // Actual outcome
  simulationStatus: "pending" | "running" | "completed" | "failed";
  startedAt?: string;            // Start timestamp
  completedAt?: string;          // Completion timestamp
  duration?: number;             // Duration in seconds
  results?: Record<string, any>; // Simulation results
}
```

### 4. Audit Logs

Comprehensive audit trail.

```typescript
interface AuditLog extends PARecord {
  eventType: "create" | "update" | "delete" | "execute" | "approve" | "reject";
  recordType: string;            // Type of record
  recordId: string;              // Record ID
  recordName: string;            // Record name
  changes?: Record<string, {     // Changes made
    old: any;
    new: any;
  }>;
  executionResult?: string;      // Execution result
  ipAddress?: string;            // IP address
  userAgent?: string;            // User agent
}
```

## Naming Conventions

### ID Patterns
- **Tag Mappings**: `tm-{sector}-{sequence}` (e.g., `tm-og-001`)
- **Control Models**: `cm-{sector}-{sequence}` (e.g., `cm-pw-001`)
- **Action Bindings**: `ab-{sector}-{sequence}` (e.g., `ab-fb-001`)
- **Triggers**: `tr-{sector}-{sequence}` (e.g., `tr-og-001`)
- **Alarm Rules**: `ar-{sector}-{sequence}` (e.g., `ar-pw-001`)
- **Event Patterns**: `ep-{sector}-{sequence}` (e.g., `ep-fb-001`)
- **Workflows**: `wf-{sector}-{sequence}` (e.g., `wf-og-001`)
- **Sequences**: `seq-{sector}-{sequence}` (e.g., `seq-fb-001`)
- **Control Rules**: `cr-{sector}-{sequence}` (e.g., `cr-og-001`)
- **Versions**: `ver-{sector}-{sequence}` (e.g., `ver-pw-001`)
- **Approvals**: `app-{sector}-{sequence}` (e.g., `app-og-001`)
- **Simulations**: `sim-{sector}-{sequence}` (e.g., `sim-fb-001`)
- **Audit Logs**: `aud-{sector}-{sequence}` (e.g., `aud-pw-001`)

### Sector Abbreviations
- **oil-gas**: `og`
- **power**: `pw`
- **fmcg**: `fb` (Food & Beverage)
- **water**: `wt`
- **mining**: `mn`

## Data Relationships

### Hierarchical Structure
```
Sector
├── Subsector
    ├── Tag Mappings
    ├── Control Models
    ├── Action Bindings
    ├── Triggers
    ├── Alarm Rules
    ├── Event Patterns
    ├── Workflows
    ├── Sequences
    └── Control Rules
```

### Cross-References
- **Workflows** reference **Action Bindings** and **Sequences**
- **Triggers** reference **Action Bindings**
- **Event Patterns** reference **Action Bindings**
- **Control Rules** reference **Action Bindings**
- **Versions** track changes to any PA component
- **Approvals** manage changes to PA components
- **Simulations** test PA components
- **Audit Logs** track all operations on PA components

## Implementation Guidelines

### 1. Data Consistency
- All timestamps use ISO 8601 format
- Status values are standardized across components
- Priority levels are consistent (low, medium, high, critical)
- Severity levels follow standard classification (info, warning, alarm, critical)

### 2. Extensibility
- Use generic `parameters` objects for component-specific data
- Support custom fields through flexible interfaces
- Allow sector-specific extensions while maintaining core structure

### 3. Validation Rules
- Required fields must be validated
- Cross-references must be validated for existence
- State transitions must be valid according to control models
- Approval workflows must be enforced for critical changes

### 4. Performance Considerations
- Index frequently queried fields (sector, subsector, status)
- Implement efficient filtering and searching
- Consider pagination for large datasets
- Cache frequently accessed reference data

## Example Usage Patterns

### Creating a New Workflow
1. Define required **Action Bindings**
2. Create **Workflow** with steps referencing actions
3. Create **Version** record for the workflow
4. Submit for **Approval** if required
5. **Simulate** the workflow before deployment
6. **Audit Log** captures all operations

### Implementing Control Logic
1. Map physical tags using **Tag Mappings**
2. Define equipment states with **Control Models**
3. Create **Control Rules** for continuous control
4. Define **Triggers** for event-driven actions
5. Configure **Alarm Rules** for notifications
6. Set up **Event Patterns** for complex scenarios

### Change Management
1. Create new **Version** of existing component
2. Submit **Approval** request with justification
3. **Simulate** changes to validate behavior
4. Deploy approved changes
5. **Audit Log** maintains complete change history

This schema provides a comprehensive foundation for process automation systems across multiple industrial sectors while maintaining consistency, governance, and auditability.