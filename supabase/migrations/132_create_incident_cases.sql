-- Create incident_cases table for security incident management
-- Requirements: 5.2 - Implement incident case management system

-- Create enum types for incident management
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_severity') THEN
        CREATE TYPE incident_severity AS ENUM (
            'critical',
            'high',
            'medium',
            'low'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status') THEN
        CREATE TYPE incident_status AS ENUM (
            'open',
            'investigating',
            'contained',
            'eradicating',
            'recovering',
            'resolved',
            'closed'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_type') THEN
        CREATE TYPE incident_type AS ENUM (
            'security-breach',
            'malware-infection',
            'unauthorized-access',
            'data-exfiltration',
            'system-compromise',
            'denial-of-service',
            'insider-threat',
            'physical-security',
            'policy-violation',
            'configuration-error'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_priority') THEN
        CREATE TYPE incident_priority AS ENUM (
            'p1-critical',
            'p2-high',
            'p3-medium',
            'p4-low'
        );
    END IF;
END $$;

-- Create incident_cases table
CREATE TABLE incident_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic incident information
    incident_number TEXT NOT NULL, -- Auto-generated incident number
    title TEXT NOT NULL,
    description TEXT,
    
    -- Classification
    incident_type incident_type NOT NULL,
    severity incident_severity NOT NULL,
    priority incident_priority NOT NULL DEFAULT 'p3-medium',
    status incident_status NOT NULL DEFAULT 'open',
    
    -- Assignment and ownership
    assigned_to UUID REFERENCES security_users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
    incident_commander UUID REFERENCES security_users(id) ON DELETE SET NULL,
    
    -- Affected systems and scope
    affected_sites UUID[] DEFAULT '{}',
    affected_assets UUID[] DEFAULT '{}',
    affected_grid_nodes UUID[] DEFAULT '{}',
    affected_grid_lines UUID[] DEFAULT '{}',
    
    -- Timeline tracking
    detected_at TIMESTAMPTZ,
    reported_at TIMESTAMPTZ DEFAULT now(),
    acknowledged_at TIMESTAMPTZ,
    contained_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    
    -- Impact assessment
    impact_assessment JSONB DEFAULT '{}',
    business_impact TEXT,
    estimated_cost DECIMAL(12,2),
    customers_affected INTEGER DEFAULT 0,
    systems_compromised INTEGER DEFAULT 0,
    
    -- Investigation details
    root_cause TEXT,
    attack_vector TEXT,
    threat_actor_attribution TEXT,
    indicators_of_compromise TEXT[],
    
    -- Response and recovery
    containment_actions TEXT[],
    eradication_actions TEXT[],
    recovery_actions TEXT[],
    lessons_learned TEXT,
    
    -- Communication
    stakeholders_notified TEXT[],
    external_notifications TEXT[], -- Regulatory, law enforcement, etc.
    communication_log JSONB DEFAULT '[]',
    
    -- Evidence and forensics
    evidence_collected TEXT[],
    forensic_images TEXT[],
    log_sources TEXT[],
    
    -- Compliance and reporting
    regulatory_reporting_required BOOLEAN DEFAULT false,
    compliance_violations TEXT[],
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create incident timeline entries table
CREATE TABLE incident_timeline_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incident_cases(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    entry_type TEXT NOT NULL, -- 'status-change', 'action-taken', 'evidence-added', 'communication', 'note'
    timestamp TIMESTAMPTZ DEFAULT now(),
    author UUID REFERENCES security_users(id) ON DELETE SET NULL,
    
    title TEXT NOT NULL,
    description TEXT,
    
    -- Status change tracking
    old_status incident_status,
    new_status incident_status,
    
    -- Action tracking
    action_taken TEXT,
    action_result TEXT,
    
    -- Evidence tracking
    evidence_type TEXT,
    evidence_location TEXT,
    
    -- Communication tracking
    communication_type TEXT, -- 'internal', 'external', 'stakeholder', 'regulatory'
    recipients TEXT[],
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    attachments TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create incident-alert relationships table
CREATE TABLE incident_alert_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incident_cases(id) ON DELETE CASCADE,
    alert_id UUID NOT NULL REFERENCES security_alerts(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    relationship_type TEXT NOT NULL DEFAULT 'related', -- 'trigger', 'related', 'duplicate'
    added_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(incident_id, alert_id)
);

-- Create indexes for performance
CREATE INDEX idx_incident_cases_tenant ON incident_cases(tenant_id);
CREATE INDEX idx_incident_cases_status ON incident_cases(status);
CREATE INDEX idx_incident_cases_severity ON incident_cases(severity);
CREATE INDEX idx_incident_cases_priority ON incident_cases(priority);
CREATE INDEX idx_incident_cases_assigned_to ON incident_cases(assigned_to);
CREATE INDEX idx_incident_cases_created_by ON incident_cases(created_by);
CREATE INDEX idx_incident_cases_incident_commander ON incident_cases(incident_commander);
CREATE INDEX idx_incident_cases_detected_at ON incident_cases(detected_at DESC);
CREATE INDEX idx_incident_cases_created_at ON incident_cases(created_at DESC);
CREATE INDEX idx_incident_cases_incident_number ON incident_cases(incident_number);

CREATE INDEX idx_incident_timeline_incident ON incident_timeline_entries(incident_id);
CREATE INDEX idx_incident_timeline_timestamp ON incident_timeline_entries(timestamp DESC);
CREATE INDEX idx_incident_timeline_author ON incident_timeline_entries(author);

CREATE INDEX idx_incident_alerts_incident ON incident_alert_relationships(incident_id);
CREATE INDEX idx_incident_alerts_alert ON incident_alert_relationships(alert_id);

-- Create function to generate incident numbers
CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'INC-' || TO_CHAR(now(), 'YYYY') || '-' || 
           LPAD((
               SELECT COALESCE(MAX(
                   CAST(SUBSTRING(incident_number FROM 'INC-\d{4}-(\d+)') AS INTEGER)
               ), 0) + 1
               FROM incident_cases 
               WHERE incident_number LIKE 'INC-' || TO_CHAR(now(), 'YYYY') || '-%'
           )::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate incident numbers
CREATE OR REPLACE FUNCTION set_incident_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.incident_number IS NULL OR NEW.incident_number = '' THEN
        NEW.incident_number = generate_incident_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incident_cases_set_number
    BEFORE INSERT ON incident_cases
    FOR EACH ROW
    EXECUTE FUNCTION set_incident_number();

-- Create update trigger for incident_cases
CREATE OR REPLACE FUNCTION update_incident_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    
    -- Auto-set timestamps based on status changes
    IF OLD.status != NEW.status THEN
        CASE NEW.status
            WHEN 'investigating' THEN
                IF NEW.acknowledged_at IS NULL THEN
                    NEW.acknowledged_at = now();
                END IF;
            WHEN 'contained' THEN
                IF NEW.contained_at IS NULL THEN
                    NEW.contained_at = now();
                END IF;
            WHEN 'resolved' THEN
                IF NEW.resolved_at IS NULL THEN
                    NEW.resolved_at = now();
                END IF;
            WHEN 'closed' THEN
                IF NEW.closed_at IS NULL THEN
                    NEW.closed_at = now();
                END IF;
            ELSE
                -- No action needed for other statuses
        END CASE;
        
        -- Create timeline entry for status change
        INSERT INTO incident_timeline_entries (
            incident_id, tenant_id, entry_type, title, description,
            old_status, new_status, author
        ) VALUES (
            NEW.id, NEW.tenant_id, 'status-change',
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            'Incident status automatically updated',
            OLD.status, NEW.status, NEW.assigned_to
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incident_cases_updated_at
    BEFORE UPDATE ON incident_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_cases_updated_at();

-- Create function to calculate incident metrics
CREATE OR REPLACE FUNCTION calculate_incident_metrics(incident_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        WITH incident_data AS (
            SELECT *
            FROM incident_cases
            WHERE id = incident_id
        ),
        timeline_metrics AS (
            SELECT 
                MIN(timestamp) as first_action,
                MAX(timestamp) as last_action,
                COUNT(*) as total_actions,
                COUNT(*) FILTER (WHERE entry_type = 'action-taken') as actions_taken,
                COUNT(*) FILTER (WHERE entry_type = 'communication') as communications_sent
            FROM incident_timeline_entries
            WHERE incident_id = incident_id
        ),
        alert_metrics AS (
            SELECT COUNT(*) as related_alerts
            FROM incident_alert_relationships
            WHERE incident_id = incident_id
        )
        SELECT jsonb_build_object(
            'time_to_acknowledge', EXTRACT(EPOCH FROM (i.acknowledged_at - i.detected_at))/3600,
            'time_to_contain', EXTRACT(EPOCH FROM (i.contained_at - i.detected_at))/3600,
            'time_to_resolve', EXTRACT(EPOCH FROM (i.resolved_at - i.detected_at))/3600,
            'total_duration', EXTRACT(EPOCH FROM (COALESCE(i.closed_at, now()) - i.detected_at))/3600,
            'timeline_actions', tm.total_actions,
            'actions_taken', tm.actions_taken,
            'communications_sent', tm.communications_sent,
            'related_alerts', am.related_alerts,
            'systems_affected', COALESCE(array_length(i.affected_assets, 1), 0),
            'sites_affected', COALESCE(array_length(i.affected_sites, 1), 0)
        )
        FROM incident_data i
        LEFT JOIN timeline_metrics tm ON true
        LEFT JOIN alert_metrics am ON true
    );
END;
$$ LANGUAGE plpgsql;

-- Create view for incident dashboard metrics
CREATE OR REPLACE VIEW incident_dashboard_metrics AS
SELECT 
    tenant_id,
    DATE_TRUNC('day', created_at) as incident_date,
    incident_type,
    severity,
    status,
    COUNT(*) as incident_count,
    AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, now()) - detected_at))/3600) as avg_resolution_time_hours,
    COUNT(*) FILTER (WHERE status = 'open') as open_incidents,
    COUNT(*) FILTER (WHERE status = 'investigating') as investigating_incidents,
    COUNT(*) FILTER (WHERE status = 'contained') as contained_incidents,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_incidents,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_incidents,
    COUNT(*) FILTER (WHERE severity = 'high') as high_incidents,
    SUM(customers_affected) as total_customers_affected,
    SUM(estimated_cost) as total_estimated_cost
FROM incident_cases
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY tenant_id, DATE_TRUNC('day', created_at), incident_type, severity, status;

-- Enable RLS (commented out as per plan)
-- ALTER TABLE incident_cases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE incident_timeline_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE incident_alert_relationships ENABLE ROW LEVEL SECURITY;

-- Grant permissions (will be handled by RLS when enabled)
-- GRANT SELECT, INSERT, UPDATE ON incident_cases TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON incident_timeline_entries TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON incident_alert_relationships TO authenticated;
-- GRANT SELECT ON incident_dashboard_metrics TO authenticated;