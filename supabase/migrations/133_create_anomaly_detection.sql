-- Create anomaly_signals table for transmission system behavior monitoring
-- Requirements: 5.3 - Implement anomaly detection and behavioral monitoring

-- Create enum types for anomaly detection
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'anomaly_type') THEN
        CREATE TYPE anomaly_type AS ENUM (
            'communication-pattern',
            'data-flow',
            'protocol-behavior',
            'timing-deviation',
            'frequency-anomaly',
            'load-pattern',
            'configuration-drift',
            'access-pattern',
            'performance-degradation',
            'security-event'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'anomaly_severity') THEN
        CREATE TYPE anomaly_severity AS ENUM (
            'critical',
            'high',
            'medium',
            'low',
            'informational'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'anomaly_status') THEN
        CREATE TYPE anomaly_status AS ENUM (
            'detected',
            'investigating',
            'confirmed',
            'false-positive',
            'resolved',
            'suppressed'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'baseline_type') THEN
        CREATE TYPE baseline_type AS ENUM (
            'communication-frequency',
            'data-volume',
            'response-time',
            'error-rate',
            'connection-count',
            'protocol-usage',
            'load-profile',
            'operational-pattern'
        );
    END IF;
END $$;

-- Create behavioral baselines table
CREATE TABLE behavioral_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Baseline identification
    name TEXT NOT NULL,
    description TEXT,
    baseline_type baseline_type NOT NULL,
    
    -- Scope definition
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    asset_type TEXT,
    protocol transmission_protocol,
    
    -- Baseline parameters
    baseline_data JSONB NOT NULL DEFAULT '{}', -- Statistical baseline data
    learning_period_days INTEGER DEFAULT 30,
    confidence_threshold DECIMAL(5,4) DEFAULT 0.95,
    
    -- Thresholds
    warning_threshold DECIMAL(10,6),
    critical_threshold DECIMAL(10,6),
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT now(),
    next_update TIMESTAMPTZ,
    update_frequency_hours INTEGER DEFAULT 24,
    
    -- Training data
    training_start_date TIMESTAMPTZ,
    training_end_date TIMESTAMPTZ,
    sample_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create anomaly signals table
CREATE TABLE anomaly_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Signal identification
    signal_name TEXT NOT NULL,
    anomaly_type anomaly_type NOT NULL,
    severity anomaly_severity NOT NULL DEFAULT 'medium',
    status anomaly_status NOT NULL DEFAULT 'detected',
    
    -- Source information
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    baseline_id UUID REFERENCES behavioral_baselines(id) ON DELETE SET NULL,
    
    -- Detection details
    detected_at TIMESTAMPTZ DEFAULT now(),
    detection_method TEXT, -- 'statistical', 'ml-model', 'rule-based', 'threshold'
    confidence_score DECIMAL(5,4), -- 0.0 to 1.0
    
    -- Anomaly characteristics
    observed_value DECIMAL(15,6),
    expected_value DECIMAL(15,6),
    deviation_percentage DECIMAL(8,4),
    statistical_significance DECIMAL(10,8),
    
    -- Context and metadata
    context_data JSONB DEFAULT '{}',
    raw_data JSONB DEFAULT '{}',
    contributing_factors TEXT[],
    
    -- Investigation and resolution
    investigated_by UUID REFERENCES security_users(id) ON DELETE SET NULL,
    investigated_at TIMESTAMPTZ,
    investigation_notes TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    
    -- Correlation and relationships
    correlation_id UUID, -- Group related anomalies
    parent_anomaly_id UUID REFERENCES anomaly_signals(id) ON DELETE SET NULL,
    related_alerts UUID[], -- References to security_alerts
    related_incidents UUID[], -- References to incident_cases
    
    -- Impact assessment
    impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
    business_impact TEXT,
    affected_systems TEXT[],
    
    -- Suppression and tuning
    is_suppressed BOOLEAN DEFAULT false,
    suppression_reason TEXT,
    suppressed_until TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create anomaly patterns table for pattern recognition
CREATE TABLE anomaly_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    pattern_name TEXT NOT NULL,
    pattern_type TEXT NOT NULL, -- 'temporal', 'spatial', 'behavioral', 'correlation'
    description TEXT,
    
    -- Pattern definition
    pattern_definition JSONB NOT NULL DEFAULT '{}',
    matching_criteria JSONB NOT NULL DEFAULT '{}',
    
    -- Pattern statistics
    occurrence_count INTEGER DEFAULT 0,
    last_occurrence TIMESTAMPTZ,
    average_severity anomaly_severity,
    
    -- Pattern learning
    is_learned_pattern BOOLEAN DEFAULT false,
    learning_confidence DECIMAL(5,4),
    false_positive_rate DECIMAL(5,4),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_behavioral_baselines_tenant ON behavioral_baselines(tenant_id);
CREATE INDEX idx_behavioral_baselines_site ON behavioral_baselines(site_id);
CREATE INDEX idx_behavioral_baselines_asset ON behavioral_baselines(asset_id);
CREATE INDEX idx_behavioral_baselines_type ON behavioral_baselines(baseline_type);
CREATE INDEX idx_behavioral_baselines_active ON behavioral_baselines(is_active);

CREATE INDEX idx_anomaly_signals_tenant ON anomaly_signals(tenant_id);
CREATE INDEX idx_anomaly_signals_site ON anomaly_signals(site_id);
CREATE INDEX idx_anomaly_signals_asset ON anomaly_signals(asset_id);
CREATE INDEX idx_anomaly_signals_type ON anomaly_signals(anomaly_type);
CREATE INDEX idx_anomaly_signals_severity ON anomaly_signals(severity);
CREATE INDEX idx_anomaly_signals_status ON anomaly_signals(status);
CREATE INDEX idx_anomaly_signals_detected_at ON anomaly_signals(detected_at DESC);
CREATE INDEX idx_anomaly_signals_correlation ON anomaly_signals(correlation_id);
CREATE INDEX idx_anomaly_signals_baseline ON anomaly_signals(baseline_id);

CREATE INDEX idx_anomaly_patterns_tenant ON anomaly_patterns(tenant_id);
CREATE INDEX idx_anomaly_patterns_type ON anomaly_patterns(pattern_type);
CREATE INDEX idx_anomaly_patterns_active ON anomaly_patterns(is_active);

-- Create function to calculate anomaly score
CREATE OR REPLACE FUNCTION calculate_anomaly_score(
    observed_val DECIMAL,
    expected_val DECIMAL,
    baseline_data JSONB
)
RETURNS DECIMAL AS $$
BEGIN
    -- Simple z-score calculation (can be enhanced with more sophisticated algorithms)
    DECLARE
        mean_val DECIMAL := (baseline_data->>'mean')::DECIMAL;
        std_dev DECIMAL := (baseline_data->>'std_dev')::DECIMAL;
        z_score DECIMAL;
    BEGIN
        IF std_dev > 0 THEN
            z_score := ABS(observed_val - mean_val) / std_dev;
            RETURN LEAST(z_score / 3.0, 1.0); -- Normalize to 0-1 scale
        ELSE
            RETURN CASE WHEN observed_val = expected_val THEN 0.0 ELSE 1.0 END;
        END IF;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create function for automatic anomaly correlation
CREATE OR REPLACE FUNCTION correlate_anomaly_signals()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-correlate anomalies based on similar characteristics within 2 hours
    IF NEW.correlation_id IS NULL THEN
        SELECT correlation_id INTO NEW.correlation_id
        FROM anomaly_signals 
        WHERE tenant_id = NEW.tenant_id
          AND correlation_id IS NOT NULL
          AND (
              (anomaly_type = NEW.anomaly_type) OR
              (asset_id = NEW.asset_id AND asset_id IS NOT NULL) OR
              (site_id = NEW.site_id AND site_id IS NOT NULL)
          )
          AND detected_at > (NEW.detected_at - INTERVAL '2 hours')
          AND ABS(EXTRACT(EPOCH FROM (detected_at - NEW.detected_at))) < 7200 -- 2 hours
        ORDER BY detected_at DESC
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
CREATE TRIGGER anomaly_signals_correlation
    BEFORE INSERT ON anomaly_signals
    FOR EACH ROW
    EXECUTE FUNCTION correlate_anomaly_signals();

-- Create update trigger
CREATE OR REPLACE FUNCTION update_anomaly_signals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    
    -- Auto-set investigation timestamp
    IF OLD.status != NEW.status AND NEW.status = 'investigating' AND NEW.investigated_at IS NULL THEN
        NEW.investigated_at = now();
    END IF;
    
    -- Auto-set resolution timestamp
    IF OLD.status != NEW.status AND NEW.status IN ('resolved', 'false-positive') AND NEW.resolved_at IS NULL THEN
        NEW.resolved_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER anomaly_signals_updated_at
    BEFORE UPDATE ON anomaly_signals
    FOR EACH ROW
    EXECUTE FUNCTION update_anomaly_signals_updated_at();

-- Create baseline update trigger
CREATE OR REPLACE FUNCTION update_behavioral_baselines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    
    -- Calculate next update time
    IF NEW.update_frequency_hours IS NOT NULL THEN
        NEW.next_update = now() + (NEW.update_frequency_hours || ' hours')::INTERVAL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER behavioral_baselines_updated_at
    BEFORE UPDATE ON behavioral_baselines
    FOR EACH ROW
    EXECUTE FUNCTION update_behavioral_baselines_updated_at();

-- Create view for anomaly dashboard
CREATE OR REPLACE VIEW anomaly_dashboard_metrics AS
SELECT 
    tenant_id,
    site_id,
    DATE_TRUNC('hour', detected_at) as detection_hour,
    anomaly_type,
    severity,
    status,
    COUNT(*) as anomaly_count,
    AVG(confidence_score) as avg_confidence,
    AVG(deviation_percentage) as avg_deviation,
    COUNT(*) FILTER (WHERE status = 'detected') as new_anomalies,
    COUNT(*) FILTER (WHERE status = 'investigating') as investigating_anomalies,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_anomalies,
    COUNT(*) FILTER (WHERE status = 'false-positive') as false_positives,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_anomalies,
    COUNT(*) FILTER (WHERE severity = 'high') as high_anomalies
FROM anomaly_signals
WHERE detected_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY tenant_id, site_id, DATE_TRUNC('hour', detected_at), anomaly_type, severity, status;

-- Create view for baseline health monitoring
CREATE OR REPLACE VIEW baseline_health_status AS
SELECT 
    bb.tenant_id,
    bb.site_id,
    bb.baseline_type,
    COUNT(*) as total_baselines,
    COUNT(*) FILTER (WHERE bb.is_active = true) as active_baselines,
    COUNT(*) FILTER (WHERE bb.next_update < now()) as outdated_baselines,
    AVG(bb.confidence_threshold) as avg_confidence_threshold,
    MIN(bb.last_updated) as oldest_update,
    MAX(bb.last_updated) as newest_update,
    COUNT(DISTINCT as2.id) as recent_anomalies
FROM behavioral_baselines bb
LEFT JOIN anomaly_signals as2 ON bb.id = as2.baseline_id 
    AND as2.detected_at >= CURRENT_DATE - INTERVAL '24 hours'
GROUP BY bb.tenant_id, bb.site_id, bb.baseline_type;

-- Create function to generate anomaly alert
CREATE OR REPLACE FUNCTION generate_anomaly_alert(anomaly_id UUID)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
    anomaly_record RECORD;
BEGIN
    -- Get anomaly details
    SELECT * INTO anomaly_record
    FROM anomaly_signals
    WHERE id = anomaly_id;
    
    -- Create security alert for high/critical anomalies
    IF anomaly_record.severity IN ('critical', 'high') THEN
        INSERT INTO security_alerts (
            tenant_id, site_id, asset_id, title, description,
            severity, category, detected_by, threat_category,
            metadata
        ) VALUES (
            anomaly_record.tenant_id,
            anomaly_record.site_id,
            anomaly_record.asset_id,
            'Anomaly Detected: ' || anomaly_record.signal_name,
            'Behavioral anomaly detected with ' || anomaly_record.confidence_score || ' confidence',
            CASE 
                WHEN anomaly_record.severity = 'informational' THEN 'info'::security_alert_severity
                ELSE anomaly_record.severity::text::security_alert_severity
            END,
            'anomaly-detection',
            'Anomaly Detection System',
            CASE anomaly_record.anomaly_type
                WHEN 'communication-pattern' THEN 'protocol-abuse'::transmission_threat_category
                WHEN 'data-flow' THEN 'data-exfiltration'::transmission_threat_category
                WHEN 'access-pattern' THEN 'unauthorized-access'::transmission_threat_category
                ELSE 'configuration-change'::transmission_threat_category
            END,
            jsonb_build_object(
                'anomaly_id', anomaly_record.id,
                'anomaly_type', anomaly_record.anomaly_type,
                'confidence_score', anomaly_record.confidence_score,
                'deviation_percentage', anomaly_record.deviation_percentage
            )
        ) RETURNING id INTO alert_id;
        
        -- Update anomaly with alert reference
        UPDATE anomaly_signals 
        SET related_alerts = COALESCE(related_alerts, '{}') || ARRAY[alert_id]
        WHERE id = anomaly_id;
    END IF;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS (commented out as per plan)
-- ALTER TABLE behavioral_baselines ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE anomaly_signals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE anomaly_patterns ENABLE ROW LEVEL SECURITY;

-- Grant permissions (will be handled by RLS when enabled)
-- GRANT SELECT, INSERT, UPDATE ON behavioral_baselines TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON anomaly_signals TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON anomaly_patterns TO authenticated;
-- GRANT SELECT ON anomaly_dashboard_metrics TO authenticated;
-- GRANT SELECT ON baseline_health_status TO authenticated;