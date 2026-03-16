-- Extend security_alerts table for transmission-specific functionality
-- Requirements: 5.1 - Create comprehensive threat detection and alerting

-- Add transmission-specific alert categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transmission_threat_category') THEN
        CREATE TYPE transmission_threat_category AS ENUM (
            'switching-manipulation',
            'relay-tampering',
            'scada-compromise',
            'protocol-abuse',
            'unauthorized-access',
            'data-exfiltration',
            'denial-of-service',
            'configuration-change',
            'communication-failure',
            'integrity-violation'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transmission_protocol') THEN
        CREATE TYPE transmission_protocol AS ENUM (
            'IEC-61850',
            'DNP3',
            'IEC-60870-5-104',
            'Modbus-TCP',
            'GOOSE',
            'MMS',
            'HTTP',
            'HTTPS',
            'SSH',
            'Telnet'
        );
    END IF;
END $$;

-- Add transmission-specific columns to security_alerts
ALTER TABLE security_alerts 
ADD COLUMN IF NOT EXISTS threat_category transmission_threat_category,
ADD COLUMN IF NOT EXISTS affected_protocol transmission_protocol,
ADD COLUMN IF NOT EXISTS grid_node_id UUID REFERENCES grid_nodes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS grid_line_id UUID REFERENCES grid_lines(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS correlation_id UUID, -- For grouping related alerts
ADD COLUMN IF NOT EXISTS parent_alert_id UUID REFERENCES security_alerts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS blast_radius_assessment JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mitigation_steps TEXT[],
ADD COLUMN IF NOT EXISTS evidence_collected TEXT[],
ADD COLUMN IF NOT EXISTS false_positive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 1 CHECK (escalation_level >= 1 AND escalation_level <= 5);

-- Create additional indexes for transmission-specific queries
CREATE INDEX IF NOT EXISTS idx_security_alerts_threat_category ON security_alerts(threat_category);
CREATE INDEX IF NOT EXISTS idx_security_alerts_protocol ON security_alerts(affected_protocol);
CREATE INDEX IF NOT EXISTS idx_security_alerts_grid_node ON security_alerts(grid_node_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_grid_line ON security_alerts(grid_line_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_correlation ON security_alerts(correlation_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_parent ON security_alerts(parent_alert_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_escalation ON security_alerts(escalation_level);

-- Create alert correlation view for aggregated alerts
CREATE OR REPLACE VIEW security_alert_correlations AS
SELECT 
    correlation_id,
    COUNT(*) as alert_count,
    MAX(severity::text)::security_alert_severity as max_severity,
    MIN(created_at) as first_alert_time,
    MAX(created_at) as last_alert_time,
    ARRAY_AGG(DISTINCT threat_category) as threat_categories,
    ARRAY_AGG(DISTINCT affected_protocol) as affected_protocols,
    ARRAY_AGG(DISTINCT site_id) FILTER (WHERE site_id IS NOT NULL) as affected_sites,
    ARRAY_AGG(DISTINCT asset_id) FILTER (WHERE asset_id IS NOT NULL) as affected_assets,
    ARRAY_AGG(DISTINCT grid_node_id) FILTER (WHERE grid_node_id IS NOT NULL) as affected_grid_nodes,
    ARRAY_AGG(DISTINCT grid_line_id) FILTER (WHERE grid_line_id IS NOT NULL) as affected_grid_lines,
    COUNT(*) FILTER (WHERE status = 'new') as new_alerts,
    COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_alerts,
    COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress_alerts,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_alerts
FROM security_alerts 
WHERE correlation_id IS NOT NULL
GROUP BY correlation_id;

-- Create function for automatic alert correlation
CREATE OR REPLACE FUNCTION correlate_security_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-correlate alerts based on similar characteristics within 1 hour
    IF NEW.correlation_id IS NULL THEN
        -- Look for similar alerts in the last hour
        SELECT correlation_id INTO NEW.correlation_id
        FROM security_alerts 
        WHERE tenant_id = NEW.tenant_id
          AND correlation_id IS NOT NULL
          AND (
              (threat_category = NEW.threat_category AND threat_category IS NOT NULL) OR
              (asset_id = NEW.asset_id AND asset_id IS NOT NULL) OR
              (grid_node_id = NEW.grid_node_id AND grid_node_id IS NOT NULL) OR
              (site_id = NEW.site_id AND site_id IS NOT NULL)
          )
          AND created_at > (NEW.created_at - INTERVAL '1 hour')
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- If no correlation found, create new correlation ID
        IF NEW.correlation_id IS NULL THEN
            NEW.correlation_id = gen_random_uuid();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic correlation
DROP TRIGGER IF EXISTS security_alerts_correlation ON security_alerts;
CREATE TRIGGER security_alerts_correlation
    BEFORE INSERT ON security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION correlate_security_alerts();

-- Create function for blast radius assessment
CREATE OR REPLACE FUNCTION assess_alert_blast_radius(alert_id UUID)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        WITH alert_data AS (
            SELECT sa.*, s.name as site_name, a.name as asset_name
            FROM security_alerts sa
            LEFT JOIN sites s ON sa.site_id = s.id
            LEFT JOIN assets a ON sa.asset_id = a.id
            WHERE sa.id = alert_id
        ),
        connected_assets AS (
            SELECT DISTINCT gal.asset_id
            FROM alert_data ad
            JOIN grid_asset_links gal ON (
                gal.grid_node_id = ad.grid_node_id OR 
                gal.grid_line_id = ad.grid_line_id
            )
            WHERE ad.grid_node_id IS NOT NULL OR ad.grid_line_id IS NOT NULL
        ),
        impact_assessment AS (
            SELECT 
                COUNT(DISTINCT ca.asset_id) as potentially_affected_assets,
                COUNT(DISTINCT a.site_id) as potentially_affected_sites,
                ARRAY_AGG(DISTINCT a.asset_type) as affected_asset_types
            FROM connected_assets ca
            JOIN assets a ON ca.asset_id = a.id
        )
        SELECT jsonb_build_object(
            'potentially_affected_assets', COALESCE(ia.potentially_affected_assets, 0),
            'potentially_affected_sites', COALESCE(ia.potentially_affected_sites, 0),
            'affected_asset_types', COALESCE(ia.affected_asset_types, ARRAY[]::text[]),
            'assessment_timestamp', now(),
            'risk_level', CASE 
                WHEN COALESCE(ia.potentially_affected_assets, 0) > 10 THEN 'high'
                WHEN COALESCE(ia.potentially_affected_assets, 0) > 5 THEN 'medium'
                ELSE 'low'
            END
        )
        FROM alert_data ad
        LEFT JOIN impact_assessment ia ON true
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to update blast radius assessment
CREATE OR REPLACE FUNCTION update_alert_blast_radius()
RETURNS TRIGGER AS $$
BEGIN
    -- Update blast radius assessment when grid topology references are added
    IF (NEW.grid_node_id IS NOT NULL OR NEW.grid_line_id IS NOT NULL) AND 
       (OLD.grid_node_id IS NULL OR OLD.grid_line_id IS NULL OR 
        NEW.grid_node_id != OLD.grid_node_id OR NEW.grid_line_id != OLD.grid_line_id) THEN
        
        NEW.blast_radius_assessment = assess_alert_blast_radius(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for blast radius assessment
DROP TRIGGER IF EXISTS security_alerts_blast_radius ON security_alerts;
CREATE TRIGGER security_alerts_blast_radius
    BEFORE UPDATE ON security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_alert_blast_radius();

-- Create alert aggregation summary view
CREATE OR REPLACE VIEW security_alert_summary AS
SELECT 
    tenant_id,
    site_id,
    DATE_TRUNC('hour', created_at) as alert_hour,
    threat_category,
    severity,
    COUNT(*) as alert_count,
    COUNT(*) FILTER (WHERE status = 'new') as new_count,
    COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_count,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
    COUNT(*) FILTER (WHERE is_safety_critical = true) as safety_critical_count,
    AVG(escalation_level) as avg_escalation_level
FROM security_alerts
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tenant_id, site_id, DATE_TRUNC('hour', created_at), threat_category, severity;

-- Grant permissions (will be handled by RLS when enabled)
-- GRANT SELECT, INSERT, UPDATE ON security_alerts TO authenticated;
-- GRANT SELECT ON security_alert_correlations TO authenticated;
-- GRANT SELECT ON security_alert_summary TO authenticated;