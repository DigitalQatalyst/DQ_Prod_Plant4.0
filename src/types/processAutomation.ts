/**
 * Process Automation Type Definitions
 * Feature: process-automation
 * Sector: Power → Transmission
 * Backend: Supabase (local only, via HybridProvider)
 */

// ============================================================================
// Feature Set A: Integrate & Model
// ============================================================================

/**
 * Tag Mapping - Maps SCADA/OT tags to standardized internal tags
 * AC 2.1.1-2.1.7
 */
export interface TagMapping {
    id: string;
    tenant_id: string;
    site_id: string;
    source_system: string; // e.g., "SCADA", "DCS", "PLC"
    source_tag: string; // Original tag name from source system
    internal_tag: string; // Standardized internal tag name
    data_type: 'boolean' | 'integer' | 'float' | 'string' | 'timestamp';
    unit?: string; // e.g., "kW", "°C", "bar"
    description?: string;
    scaling_factor?: number; // Multiplier for value conversion
    offset?: number; // Offset for value conversion
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
}

/**
 * Control Model - Defines state machines for equipment control
 * AC 2.2.1-2.2.7
 */
export interface ControlModel {
    id: string;
    tenant_id: string;
    site_id: string;
    name: string;
    description?: string;
    equipment_type: string; // e.g., "breaker", "transformer", "generator"
    current_state: string; // Current state in the state machine
    states: ControlModelState[]; // Available states
    transitions: ControlModelTransition[]; // Valid state transitions
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
}

export interface ControlModelState {
    name: string;
    display_name: string;
    description?: string;
    color?: string; // For UI visualization
    is_safe_state: boolean; // Whether this is a safe state
}

export interface ControlModelTransition {
    from_state: string;
    to_state: string;
    trigger: string; // Event that triggers this transition
    conditions?: string[]; // Conditions that must be met
    actions?: string[]; // Actions to execute during transition
    requires_approval?: boolean;
}

/**
 * Action Binding - Binds automation actions to control operations
 * AC 2.3.1-2.3.7
 */
export interface ActionBinding {
    id: string;
    tenant_id: string;
    site_id: string;
    name: string;
    description?: string;
    action_type: 'control' | 'safety' | 'maintenance' | 'notification' | 'custom';
    target_system: string; // System to execute action on
    target_tag?: string; // Tag to control (if applicable)
    command: string; // Command to execute
    parameters: Record<string, any>; // JSONB parameters for the action
    timeout_seconds?: number;
    retry_count?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
}

// ============================================================================
// Feature Set B: Monitor & Detect
// ============================================================================

/**
 * Trigger - Defines conditions that activate automation actions
 * AC 2.4.1-2.4.7
 */
export interface Trigger {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    trigger_type: 'threshold' | 'change' | 'pattern' | 'schedule' | 'manual';
    condition_expression: string; // Boolean expression to evaluate
    evaluation_interval?: number; // in seconds, null for event-driven
    priority: 'low' | 'medium' | 'high' | 'critical';
    action_binding_ids: string[]; // Actions to execute when triggered
    enabled: boolean;
    tags?: string[];
    custom_properties?: Record<string, any>;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

/**
 * Alarm Rule - Defines alarm generation and routing rules
 * AC 2.5.1-2.5.7
 */
export interface AlarmRule {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    alarm_type: 'equipment' | 'process' | 'safety' | 'environmental' | 'quality';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    condition_expression: string;
    routing_destinations: AlarmRoutingDestination[]; // Where to send alarms
    escalation_rules?: Record<string, any>;
    requires_acknowledgment: boolean;
    auto_clear: boolean;
    clear_condition_expression?: string;
    enabled: boolean;
    tags?: string[];
    custom_properties?: Record<string, any>;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

export interface AlarmRoutingDestination {
    type: 'email' | 'sms' | 'webhook';
    destination: string;
}

/**
 * Event Pattern - Defines complex event patterns for detection
 * AC 2.6.1-2.6.7
 */
export interface EventPattern {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    pattern_type: 'sequence' | 'trend' | 'oscillation' | 'correlation' | 'anomaly';
    match_conditions: Record<string, any>; // Complex event matching logic (JSONB)
    time_window?: number; // Time window in seconds for pattern matching
    detection_threshold?: number;
    confidence_level?: number;
    action_on_match?: 'alert' | 'trigger' | 'log' | 'none';
    trigger_id?: string;
    enabled: boolean;
    match_count: number;
    last_match_at?: string;
    false_positive_count: number;
    tags?: string[];
    custom_properties?: Record<string, any>;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
}

// ============================================================================
// Feature Set C: Automate & Control
// ============================================================================

/**
 * Workflow - Multi-step automated procedures
 * AC 2.7.1-2.7.8
 */
export interface Workflow {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    steps: WorkflowStep[];
    trigger_type: 'manual' | 'automatic' | 'scheduled';
    requires_approval: boolean;
    execution_status: 'idle' | 'running' | 'completed' | 'failed';
    last_executed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface WorkflowStep {
    step: number;
    name: string;
    action: string;
    duration?: number;
    condition?: string;
}

/**
 * Sequence - Time-based control sequences
 * AC 2.8.1-2.8.7
 */
export interface Sequence {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    steps: SequenceStep[];
    execution_mode: 'sequential' | 'parallel' | 'conditional';
    total_duration_seconds?: number;
    status: 'active' | 'inactive' | 'archived';
    last_executed_at?: string;
    created_at: string;
    updated_at: string;
}

export interface SequenceStep {
    step: number;
    action: string;
    delay_ms?: number; // Milliseconds for high precision
    wait_s?: number; // Seconds for standard timing
    duration?: number;
    condition?: string;
    attempt?: number; // For reclose cycles
}

/**
 * Control Rule - Continuous control logic rules
 * AC 2.9.1-2.9.7
 */
export interface ControlRule {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    rule_type: 'if-then' | 'when-then' | 'continuous';
    condition_expression: string;
    action_binding_ids: string[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    last_executed_at?: string;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// Feature Set D: Govern & Assure
// ============================================================================

/**
 * Version - Version control for automation configurations
 * AC 2.10.1-2.10.7
 */
export interface Version {
    id: string;
    tenant_id: string;
    version_number: string;
    change_type: 'major' | 'minor' | 'patch';
    description: string;
    affected_components: Record<string, any>; // JSONB Map or array
    approval_status: 'pending' | 'approved' | 'rejected';
    created_by: string;
    created_at: string;
    approved_at?: string;
    approved_by?: string;
}

/**
 * Approval - Approval workflow for safety-critical changes
 * AC 2.11.1-2.11.7
 */
export interface Approval {
    id: string;
    tenant_id: string;
    record_type: string; // The type of record needing approval
    record_id: string;   // The UUID of the record needing approval
    approver_list: string[];
    status: 'pending' | 'approved' | 'rejected';
    requested_by: string;
    requested_at: string;
    reviewed_by?: string;
    reviewed_at?: string;
    rejection_reason?: string;
}

/**
 * Simulation - Simulation testing for automation components
 * AC 2.12.1-2.12.7
 */
export interface Simulation {
    id: string;
    tenant_id: string;
    simulation_type: 'workflow' | 'trigger' | 'sequence' | 'control_rule';
    target_id: string;
    input_parameters: Record<string, any>;
    expected_outcome?: string;
    actual_outcome?: string;
    status: 'not_started' | 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    duration_seconds?: number;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    observed_outcome?: string | null;
    report?: {
        summary?: { label: string; value: string | number }[];
        optimizations?: { title: string; before?: string; after?: string; impact?: string; confidence?: number }[];
        charts?: { metric: string; points: { t: string; v: number }[] }[];
    } | null;
}


/**
 * Audit Log - Comprehensive audit trail for all PA operations
 * AC 2.13.1-2.13.7
 */
export interface AuditLog {
    id: string;
    tenant_id: string;
    event_type: 'create' | 'update' | 'delete' | 'execute' | 'approve' | 'reject';
    record_type: string;
    record_id: string;
    user_name: string;
    user_ip?: string;
    user_agent?: string;
    changes_before?: Record<string, any>;
    changes_after?: Record<string, any>;
    execution_result?: string;
    created_at: string;
}

// ============================================================================
// Dashboard & Monitoring Types
// ============================================================================

/**
 * Automation Dashboard KPIs
 * AC 2.14.1-2.14.7
 */
export interface AutomationDashboardData {
    kpis: {
        active_workflows: number;
        active_triggers: number;
        pending_approvals: number;
        recent_simulations: number;
        active_alarm_rules: number;
        recent_audit_events: number;
    };
    workflow_timeline: WorkflowTimelineEntry[];
    trigger_heatmap: TriggerHeatmapEntry[];
    approval_distribution: ApprovalDistributionEntry[];
    audit_event_types: AuditEventTypeEntry[];
}

export interface WorkflowTimelineEntry {
    date: string;
    executed: number;
    failed: number;
    pending: number;
}

export interface TriggerHeatmapEntry {
    trigger_id: string;
    trigger_name: string;
    hour: number; // 0-23
    activation_count: number;
}

export interface ApprovalDistributionEntry {
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    count: number;
}

export interface AuditEventTypeEntry {
    action: string;
    count: number;
}

/**
 * Automation Alert
 * AC 2.15.1-2.15.7
 */
export interface AutomationAlert {
    id: string;
    tenant_id: string;
    site_id: string;
    alert_type: 'trigger_activation' | 'workflow_failure' | 'approval_required' | 'system_error' | 'threshold_breach';
    severity: 'info' | 'warning' | 'alarm' | 'critical';
    title: string;
    message: string;
    source_entity_type?: string;
    source_entity_id?: string;
    status: 'active' | 'acknowledged' | 'resolved';
    created_at: string;
    acknowledged_at?: string;
    acknowledged_by?: string;
    resolved_at?: string;
    resolved_by?: string;
    metadata?: Record<string, any>;
}

// ============================================================================
// Filter & Query Types
// ============================================================================

export interface ProcessAutomationFilters {
    site_id?: string;
    is_active?: boolean;
    is_enabled?: boolean;
    status?: string;
    type?: string;
    severity?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
}
