-- Create response_playbooks table for incident response automation
-- Requirements: 5.4 - Implement response playbooks for transmission-specific incidents

-- Create enum types for response playbooks
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'playbook_trigger_type') THEN
        CREATE TYPE playbook_trigger_type AS ENUM (
            'manual',
            'alert-based',
            'incident-based',
            'anomaly-based',
            'scheduled',
            'threshold-based'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'playbook_status') THEN
        CREATE TYPE playbook_status AS ENUM (
            'draft',
            'active',
            'inactive',
            'deprecated',
            'testing'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'execution_status') THEN
        CREATE TYPE execution_status AS ENUM (
            'pending',
            'running',
            'completed',
            'failed',
            'cancelled',
            'timeout'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'step_type') THEN
        CREATE TYPE step_type AS ENUM (
            'manual-action',
            'automated-action',
            'notification',
            'data-collection',
            'analysis',
            'decision-point',
            'escalation',
            'documentation'
        );
    END IF;
END $$;
-- Create response playbooks table
CREATE TABLE response_playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Playbook identification
    name TEXT NOT NULL,
    description TEXT,
    version TEXT DEFAULT '1.0',
    category TEXT, -- 'incident-response', 'threat-hunting', 'containment', 'recovery'
    
    -- Trigger configuration
    trigger_type playbook_trigger_type NOT NULL DEFAULT 'manual',
    trigger_conditions JSONB DEFAULT '{}',
    auto_execute BOOLEAN DEFAULT false,
    
    -- Scope and applicability
    applicable_threat_categories transmission_threat_category[],
    applicable_asset_types TEXT[],
    applicable_protocols transmission_protocol[],
    severity_threshold security_alert_severity DEFAULT 'medium',
    
    -- Playbook content
    objectives TEXT[],
    prerequisites TEXT[],
    estimated_duration_minutes INTEGER,
    required_roles TEXT[],
    required_permissions TEXT[],
    
    -- Status and lifecycle
    status playbook_status NOT NULL DEFAULT 'draft',
    is_template BOOLEAN DEFAULT false,
    
    -- Approval and governance
    created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    
    -- Usage tracking
    execution_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4),
    last_executed TIMESTAMPTZ,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create playbook steps table
CREATE TABLE playbook_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID NOT NULL REFERENCES response_playbooks(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Step identification
    step_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    step_type step_type NOT NULL,
    
    -- Step configuration
    is_required BOOLEAN DEFAULT true,
    is_parallel BOOLEAN DEFAULT false,
    timeout_minutes INTEGER DEFAULT 30,
    retry_count INTEGER DEFAULT 0,
    
    -- Dependencies
    depends_on_steps INTEGER[],
    
    -- Action configuration
    action_type TEXT, -- 'isolate-asset', 'block-ip', 'notify-team', 'collect-logs', etc.
    action_parameters JSONB DEFAULT '{}',
    automation_script TEXT,
    
    -- Human interaction
    assigned_role TEXT,
    instructions TEXT,
    checklist_items TEXT[],
    
    -- Validation and verification
    success_criteria TEXT[],
    validation_script TEXT,
    
    -- Documentation
    evidence_to_collect TEXT[],
    documentation_template TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(playbook_id, step_number)
);
-- Create playbook executions table
CREATE TABLE playbook_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID NOT NULL REFERENCES response_playbooks(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Execution context
    triggered_by TEXT, -- 'manual', 'alert', 'incident', 'anomaly'
    trigger_source_id UUID, -- ID of alert, incident, or anomaly that triggered this
    executed_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
    
    -- Execution details
    execution_status execution_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    
    -- Progress tracking
    total_steps INTEGER,
    completed_steps INTEGER DEFAULT 0,
    failed_steps INTEGER DEFAULT 0,
    skipped_steps INTEGER DEFAULT 0,
    
    -- Results and outcomes
    success BOOLEAN,
    execution_notes TEXT,
    lessons_learned TEXT,
    
    -- Context data
    input_parameters JSONB DEFAULT '{}',
    execution_context JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create step executions table
CREATE TABLE step_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES playbook_executions(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES playbook_steps(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Execution details
    execution_status execution_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Assignment
    assigned_to UUID REFERENCES security_users(id) ON DELETE SET NULL,
    
    -- Results
    success BOOLEAN,
    output_data JSONB DEFAULT '{}',
    error_message TEXT,
    execution_log TEXT[],
    
    -- Evidence and documentation
    evidence_collected TEXT[],
    documentation TEXT,
    
    -- Retry tracking
    retry_attempt INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(execution_id, step_id)
);
-- Create indexes for performance
CREATE INDEX idx_response_playbooks_tenant ON response_playbooks(tenant_id);
CREATE INDEX idx_response_playbooks_status ON response_playbooks(status);
CREATE INDEX idx_response_playbooks_trigger_type ON response_playbooks(trigger_type);
CREATE INDEX idx_response_playbooks_category ON response_playbooks(category);

CREATE INDEX idx_playbook_steps_playbook ON playbook_steps(playbook_id);
CREATE INDEX idx_playbook_steps_step_number ON playbook_steps(playbook_id, step_number);
CREATE INDEX idx_playbook_steps_type ON playbook_steps(step_type);

CREATE INDEX idx_playbook_executions_playbook ON playbook_executions(playbook_id);
CREATE INDEX idx_playbook_executions_status ON playbook_executions(execution_status);
CREATE INDEX idx_playbook_executions_started_at ON playbook_executions(started_at DESC);
CREATE INDEX idx_playbook_executions_trigger_source ON playbook_executions(trigger_source_id);

CREATE INDEX idx_step_executions_execution ON step_executions(execution_id);
CREATE INDEX idx_step_executions_step ON step_executions(step_id);
CREATE INDEX idx_step_executions_status ON step_executions(execution_status);
CREATE INDEX idx_step_executions_assigned_to ON step_executions(assigned_to);
-- Create update triggers
CREATE OR REPLACE FUNCTION update_response_playbooks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER response_playbooks_updated_at
    BEFORE UPDATE ON response_playbooks
    FOR EACH ROW
    EXECUTE FUNCTION update_response_playbooks_updated_at();

CREATE TRIGGER playbook_steps_updated_at
    BEFORE UPDATE ON playbook_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_response_playbooks_updated_at();

CREATE TRIGGER playbook_executions_updated_at
    BEFORE UPDATE ON playbook_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_response_playbooks_updated_at();

CREATE TRIGGER step_executions_updated_at
    BEFORE UPDATE ON step_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_response_playbooks_updated_at();
-- Create function to update execution progress
CREATE OR REPLACE FUNCTION update_execution_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update playbook execution progress when step execution status changes
    UPDATE playbook_executions 
    SET 
        completed_steps = (
            SELECT COUNT(*) 
            FROM step_executions 
            WHERE execution_id = NEW.execution_id 
            AND execution_status = 'completed'
        ),
        failed_steps = (
            SELECT COUNT(*) 
            FROM step_executions 
            WHERE execution_id = NEW.execution_id 
            AND execution_status = 'failed'
        ),
        updated_at = now()
    WHERE id = NEW.execution_id;
    
    -- Update overall execution status if all steps are complete
    IF NEW.execution_status IN ('completed', 'failed') THEN
        UPDATE playbook_executions pe
        SET 
            execution_status = CASE 
                WHEN NOT EXISTS (
                    SELECT 1 FROM step_executions se 
                    WHERE se.execution_id = pe.id 
                    AND se.execution_status NOT IN ('completed', 'failed', 'cancelled')
                ) THEN 
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM step_executions se 
                            WHERE se.execution_id = pe.id 
                            AND se.execution_status = 'failed'
                        ) THEN 'failed'
                        ELSE 'completed'
                    END
                ELSE pe.execution_status
            END,
            completed_at = CASE 
                WHEN NOT EXISTS (
                    SELECT 1 FROM step_executions se 
                    WHERE se.execution_id = pe.id 
                    AND se.execution_status NOT IN ('completed', 'failed', 'cancelled')
                ) THEN now()
                ELSE pe.completed_at
            END
        WHERE pe.id = NEW.execution_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER step_executions_progress_update
    AFTER UPDATE ON step_executions
    FOR EACH ROW
    WHEN (OLD.execution_status != NEW.execution_status)
    EXECUTE FUNCTION update_execution_progress();
-- Create function to update playbook statistics
CREATE OR REPLACE FUNCTION update_playbook_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update playbook execution statistics when execution completes
    IF NEW.execution_status = 'completed' AND OLD.execution_status != 'completed' THEN
        UPDATE response_playbooks 
        SET 
            execution_count = execution_count + 1,
            success_rate = (
                SELECT 
                    COUNT(*) FILTER (WHERE success = true)::DECIMAL / 
                    NULLIF(COUNT(*), 0)
                FROM playbook_executions 
                WHERE playbook_id = NEW.playbook_id 
                AND execution_status = 'completed'
            ),
            last_executed = NEW.completed_at,
            updated_at = now()
        WHERE id = NEW.playbook_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER playbook_executions_statistics_update
    AFTER UPDATE ON playbook_executions
    FOR EACH ROW
    WHEN (OLD.execution_status != NEW.execution_status)
    EXECUTE FUNCTION update_playbook_statistics();
-- Create views for playbook management
CREATE OR REPLACE VIEW playbook_execution_summary AS
SELECT 
    pe.id as execution_id,
    pe.playbook_id,
    rp.name as playbook_name,
    pe.execution_status,
    pe.started_at,
    pe.completed_at,
    pe.total_steps,
    pe.completed_steps,
    pe.failed_steps,
    pe.success,
    EXTRACT(EPOCH FROM (COALESCE(pe.completed_at, now()) - pe.started_at))/60 as duration_minutes,
    pe.executed_by,
    su.full_name as executed_by_name
FROM playbook_executions pe
JOIN response_playbooks rp ON pe.playbook_id = rp.id
LEFT JOIN security_users su ON pe.executed_by = su.id;

-- Create view for playbook effectiveness metrics
CREATE OR REPLACE VIEW playbook_effectiveness_metrics AS
SELECT 
    rp.id as playbook_id,
    rp.name,
    rp.category,
    rp.execution_count,
    rp.success_rate,
    rp.last_executed,
    AVG(EXTRACT(EPOCH FROM (pe.completed_at - pe.started_at))/60) as avg_duration_minutes,
    COUNT(pe.id) as total_executions,
    COUNT(pe.id) FILTER (WHERE pe.execution_status = 'completed') as completed_executions,
    COUNT(pe.id) FILTER (WHERE pe.execution_status = 'failed') as failed_executions,
    COUNT(pe.id) FILTER (WHERE pe.success = true) as successful_executions
FROM response_playbooks rp
LEFT JOIN playbook_executions pe ON rp.id = pe.playbook_id
GROUP BY rp.id, rp.name, rp.category, rp.execution_count, rp.success_rate, rp.last_executed;

-- Enable RLS (commented out as per plan)
-- ALTER TABLE response_playbooks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE playbook_steps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE playbook_executions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE step_executions ENABLE ROW LEVEL SECURITY;