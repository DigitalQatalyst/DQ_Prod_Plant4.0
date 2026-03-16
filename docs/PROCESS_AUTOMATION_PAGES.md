# Process Automation Pages

This document provides a comprehensive list of all Process Automation (PA) pages in the DQ Plant 4.0 system, organized by category with detailed descriptions of their functionality.

## Overview

The Process Automation module provides a complete suite of tools for managing industrial automation across multiple sectors (Oil & Gas, Power, FMCG, Water, Mining). The system follows a hierarchical, sector-based organization with comprehensive governance and audit capabilities.

---

## Core Automation Pages

### 1. Tag Mapping Page
**Location:** `src/pages/automate/TagMappingPage.tsx`

**Purpose:** Maps physical sensor/actuator tags to logical variables for process automation.

**Key Features:**
- Maps physical tag identifiers to logical variable names
- Defines data types (float, boolean, string, integer)
- Specifies engineering units and scaling factors
- Sector-based filtering (Oil & Gas, Power, FMCG, etc.)
- Status management (active, draft, archived)

**Use Cases:**
- Connecting SCADA tags to automation logic
- Standardizing variable naming across systems
- Managing data type conversions and scaling

**Tabs:**
- Overview: Basic tag mapping information
- Parameters: Detailed mapping configuration
- Linked Assets: Associated equipment and systems
- History: Change tracking and audit trail

---

### 2. Control Models Page
**Location:** `src/pages/automate/ControlModelsPage.tsx`

**Purpose:** Defines state machines for equipment operational states and transitions.

**Key Features:**
- Define available equipment states (Idle, Starting, Running, Blocked, Faulted)
- Configure state transitions with conditions
- Track current state of equipment
- Sector-specific state models

**Use Cases:**
- Equipment state management
- Process state tracking
- Automated state transitions based on conditions

**Tabs:**
- Overview: Model information and current state
- States: Detailed state definitions and transitions
- Linked Assets: Equipment using this model
- History: State change history

---

### 3. Action Bindings Page
**Location:** `src/pages/automate/ActionBindingsPage.tsx`

**Purpose:** Defines executable actions on actuators and control points.

**Key Features:**
- Define control actions (start/stop, open/close, adjust setpoint)
- Configure safety actions (emergency stop, isolation, trip)
- Set up maintenance actions (test, calibrate, reset)
- Parameter configuration for each action

**Use Cases:**
- Linking automation logic to physical actuators
- Defining reusable action templates
- Standardizing control operations

**Tabs:**
- Overview: Action details and actuator information
- Parameters: Action parameter configuration
- Linked Assets: Systems using this action
- History: Action execution history

---

### 4. Triggers Page
**Location:** `src/pages/automate/TriggersPage.tsx`

**Purpose:** Event-driven automation rules that execute actions based on conditions.

**Key Features:**
- Define trigger conditions (pressure anomalies, temperature limits, etc.)
- Configure actions to execute when triggered
- Set priority levels (low, medium, high, critical)
- Sector-specific trigger templates

**Use Cases:**
- Safety interlocks and emergency responses
- Operational control automation
- Maintenance scheduling triggers

**Tabs:**
- Overview: Trigger condition and action details
- Parameters: Condition configuration
- Linked Assets: Affected equipment
- History: Trigger execution log

---

### 5. Alarm Rules Page
**Location:** `src/pages/automate/AlarmRulesPage.tsx`

**Purpose:** Defines alarm classification, severity, and routing rules.

**Key Features:**
- Classify alarms (process, equipment, safety, security)
- Set severity levels (info, warning, alarm, critical)
- Configure routing destinations
- Auto-acknowledge settings
- Escalation time configuration

**Use Cases:**
- Alarm management and prioritization
- Notification routing
- Alarm flood prevention

**Tabs:**
- Overview: Alarm classification and severity
- Parameters: Routing and escalation settings
- Linked Assets: Monitored equipment
- History: Alarm activation history

---

### 6. Event Patterns Page
**Location:** `src/pages/automate/EventPatternsPage.tsx`

**Purpose:** Complex event pattern detection for advanced automation scenarios.

**Key Features:**
- Define pattern types (trend analysis, sequence detection, oscillation)
- Configure time windows for pattern matching
- Set match conditions
- Define actions when patterns are detected

**Use Cases:**
- Performance degradation detection
- Predictive maintenance triggers
- Complex process optimization

**Tabs:**
- Overview: Pattern type and configuration
- Parameters: Pattern matching criteria
- Linked Assets: Monitored systems
- History: Pattern detection log

---

### 7. Workflows Page
**Location:** `src/pages/automate/WorkflowsPage.tsx`

**Purpose:** Multi-step automated procedures for complex operations.

**Key Features:**
- Define workflow steps with actions and parameters
- Configure trigger types (manual, automatic, scheduled)
- Set approval requirements
- Track workflow execution status

**Use Cases:**
- Equipment startup/shutdown sequences
- Maintenance procedures
- Emergency response protocols
- Performance optimization routines

**Tabs:**
- Overview: Workflow details and execution status
- Parameters: Step configuration and dependencies
- Linked Assets: Equipment involved in workflow
- History: Execution history and results

---

### 8. Sequences Page
**Location:** `src/pages/automate/SequencesPage.tsx`

**Purpose:** Detailed step-by-step procedures with precise timing and conditions.

**Key Features:**
- Define ordered sequence steps
- Configure execution modes (sequential, parallel, conditional)
- Set step duration and conditions
- Estimate total duration

**Use Cases:**
- Precise control sequences
- Batch process automation
- Coordinated multi-equipment operations

**Tabs:**
- Overview: Sequence information and execution mode
- Parameters: Detailed step configuration
- Linked Assets: Equipment in sequence
- History: Execution log

---

### 9. Control Rules Page
**Location:** `src/pages/automate/ControlRulesPage.tsx`

**Purpose:** Continuous control logic for ongoing process regulation.

**Key Features:**
- Define rule types (if-then, when-then, continuous)
- Configure conditions and actions
- Set priority levels
- Enable/disable rules dynamically

**Use Cases:**
- PID control logic
- Continuous process optimization
- Regulatory control

**Tabs:**
- Overview: Rule type and condition
- Parameters: Detailed rule configuration
- Linked Assets: Controlled equipment
- History: Rule execution log

---

## Governance & Assurance Pages

### 10. Versions Page
**Location:** `src/pages/automate/VersionsPage.tsx`

**Purpose:** Version control for automation configurations.

**Key Features:**
- Track version numbers (semantic versioning)
- Document change types (major, minor, patch)
- Record change descriptions
- Manage approval status
- Link to affected components

**Use Cases:**
- Change management
- Configuration rollback
- Audit compliance

**Tabs:**
- Overview: Version information
- Parameters: Change details
- Linked Assets: Affected components
- History: Version history

---

### 11. Approvals Page
**Location:** `src/pages/automate/ApprovalsPage.tsx`

**Purpose:** Manage approval workflows for automation changes.

**Key Features:**
- Track approval requests and status
- Define approver lists
- Record approval/rejection with reasons
- Link to related records
- Workflow visualization

**Use Cases:**
- Change authorization
- Safety-critical approvals
- Compliance documentation

**Tabs:**
- Overview: Approval status and details
- Workflow: Approval process visualization
- Details: Request information
- History: Approval timeline

---

### 12. Simulations Page
**Location:** `src/pages/automate/SimulationPage.tsx`

**Purpose:** Test and validate automation components before deployment.

**Key Features:**
- Simulate workflows, control rules, sequences, and triggers
- Configure input parameters
- Compare expected vs. actual outcomes
- Track simulation status and duration
- Store simulation results

**Use Cases:**
- Pre-deployment testing
- What-if analysis
- Training and demonstration

**Tabs:**
- Overview: Simulation status and results
- Configuration: Input parameters
- Results: Detailed outcome analysis
- History: Simulation runs

---

### 13. Audit Logs Page
**Location:** `src/pages/automate/AuditLogsPage.tsx`

**Purpose:** Comprehensive audit trail for all automation operations.

**Key Features:**
- Track all events (create, update, delete, execute, approve, reject)
- Record user actions and timestamps
- Capture before/after changes
- Store execution results
- Log IP addresses and user agents

**Use Cases:**
- Compliance auditing
- Security monitoring
- Troubleshooting
- Performance analysis

**Tabs:**
- Overview: Event details and type
- Details: User and system information
- Changes: Before/after comparison
- Metadata: Technical details

---

## Dashboard & Monitoring Pages

### 14. Automation Dashboard
**Location:** `src/pages/automation/AutomationDashboard.tsx`

**Purpose:** High-level monitoring of automation workflows, rules, and execution status.

**Key Features:**
- Real-time status monitoring
- Performance metrics
- Execution statistics
- System health indicators

**Use Cases:**
- Operations monitoring
- Performance tracking
- Quick status overview

---

### 15. Automation Alerts
**Location:** `src/pages/automation/AutomationAlerts.tsx`

**Purpose:** Monitor and respond to automation-related alerts and incidents.

**Key Features:**
- Alert inbox and filtering
- Priority-based sorting
- Alert acknowledgment
- Incident response tracking

**Use Cases:**
- Incident management
- Alert triage
- Response coordination

---

## Data Organization

### Sector Coverage
All pages support multiple industrial sectors:
- **Oil & Gas**: Upstream, Midstream, Downstream
- **Power**: Generation, Transmission, Distribution
- **FMCG**: Food & Beverage, Personal Care, Household Care, Health & Wellness
- **Water**: Supply & Treatment, Distribution, Wastewater & Reuse
- **Mining**: Metal Ores, Mineral Fuels, Industrial Minerals, Gemstones

### Common Features Across All Pages
- **Search & Filter**: Sector-based filtering and text search
- **Status Management**: Active, Draft, Archived states
- **Multi-tenant Support**: Tenant isolation and data segregation
- **Responsive Design**: Optimized for various screen sizes
- **Real-time Updates**: Live data synchronization
- **Export Capabilities**: Data export for reporting

### Naming Conventions
- **Tag Mappings**: `tm-{sector}-{sequence}` (e.g., `tm-og-001`)
- **Control Models**: `cm-{sector}-{sequence}` (e.g., `cm-pw-001`)
- **Action Bindings**: `ab-{sector}-{sequence}` (e.g., `ab-fb-001`)
- **Triggers**: `tr-{sector}-{sequence}` (e.g., `tr-og-001`)
- **Alarm Rules**: `ar-{sector}-{sequence}` (e.g., `ar-pw-001`)
- **Event Patterns**: `ep-{sector}-{sequence}` (e.g., `ep-fb-001`)
- **Workflows**: `wf-{sector}-{sequence}` (e.g., `wf-og-001`)
- **Sequences**: `seq-{sector}-{sequence}` (e.g., `seq-fb-001`)
- **Control Rules**: `cr-{sector}-{sequence}` (e.g., `cr-og-001`)

---

## Integration Points

### Data Providers
All pages integrate with the centralized `DataProvider` system for:
- Unified data fetching
- Caching and optimization
- Multi-backend support (mock, Supabase, hybrid)
- Tenant context management

### Navigation
Pages are accessible through the main navigation under:
- **Automate** → Process Automation sub-pages
- **Automation** → Dashboard and Alerts

### Related Systems
- **Asset Management**: Links to equipment and devices
- **Security**: Audit logs and access control
- **Monitoring**: Real-time data visualization
- **Optimization**: Performance improvement workflows

---

## Technical Architecture

### Component Structure
Each page follows a consistent pattern:
1. **List Pane**: Displays records with search and filter
2. **Work Pane**: Shows detailed information in tabs
3. **Status Badges**: Visual indicators for status and priority
4. **Empty States**: User-friendly messages when no data exists

### State Management
- React hooks for local state
- AppContext for global state (sector, tenant)
- Memoization for performance optimization

### Data Flow
1. User selects sector/tenant from global context
2. Page filters data based on selection
3. List displays filtered records
4. User selects record to view details
5. Work pane shows detailed information in tabs

---

## Future Enhancements

### Planned Features
- Real-time collaboration on automation configurations
- AI-powered automation recommendations
- Advanced simulation with digital twins
- Mobile app for field operations
- Integration with external automation platforms

### Scalability Considerations
- Pagination for large datasets
- Lazy loading of detailed information
- Caching strategies for frequently accessed data
- Background processing for long-running simulations

---

## Related Documentation
- [Process Automation Schema](PROCESS_AUTOMATION_SCHEMA.md)
- [Operational Excellence Schema](OPERATIONAL_EXCELLENCE_SCHEMA.md)
- [Local Supabase Setup](LOCAL_SUPABASE_SETUP.md)
- [Unified Interfaces Example](UNIFIED_INTERFACES_EXAMPLE.ts)

---

**Last Updated:** 2026-01-23  
**Version:** 1.0  
**Maintained By:** Digital Qatalyst Platform Team
