-- Create threat_intelligence table for transmission-relevant threat feeds
-- Requirements: 5.6 - Implement threat intelligence integration and analysis

-- Create enum types for threat intelligence
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'threat_type') THEN
        CREATE TYPE threat_type AS ENUM (
            'malware',
            'apt-group',
            'vulnerability',
            'ioc-ip',
            'ioc-domain',
            'ioc-hash',
            'attack-pattern',
            'campaign',
            'tool',
            'infrastructure'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'threat_confidence') THEN
        CREATE TYPE threat_confidence AS ENUM (
            'high',
            'medium',
            'low',
            'unknown'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'threat_relevance') THEN
        CREATE TYPE threat_relevance AS ENUM (
            'critical',
            'high',
            'medium',
            'low',
            'informational'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feed_status') THEN
        CREATE TYPE feed_status AS ENUM (
            'active',
            'inactive',
            'error',
            'maintenance'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transmission_protocol') THEN
        CREATE TYPE transmission_protocol AS ENUM (
            'iec-104',
            'dnp3',
            'modbus',
            'iec-61850',
            'opc-ua',
            'mqtt',
            'other'
        );
    END IF;
END $$;
-- Create threat intelligence feeds table
CREATE TABLE threat_intelligence_feeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Feed identification
    name TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL,
    feed_type TEXT NOT NULL, -- 'commercial', 'open-source', 'government', 'internal'
    
    -- Feed configuration
    feed_url TEXT,
    api_endpoint TEXT,
    authentication_method TEXT, -- 'api-key', 'oauth', 'basic-auth', 'none'
    credentials JSONB DEFAULT '{}', -- Encrypted credentials
    
    -- Update configuration
    update_frequency_hours INTEGER DEFAULT 24,
    last_updated TIMESTAMPTZ,
    next_update TIMESTAMPTZ,
    
    -- Feed status and health
    status feed_status NOT NULL DEFAULT 'active',
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    
    -- Content filtering
    relevance_filters JSONB DEFAULT '{}',
    transmission_specific BOOLEAN DEFAULT false,
    
    -- Statistics
    total_indicators INTEGER DEFAULT 0,
    active_indicators INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create threat intelligence indicators table
CREATE TABLE threat_intelligence_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    feed_id UUID REFERENCES threat_intelligence_feeds(id) ON DELETE CASCADE,
    
    -- Indicator identification
    indicator_value TEXT NOT NULL,
    indicator_type threat_type NOT NULL,
    
    -- Threat classification
    threat_name TEXT,
    threat_family TEXT,
    malware_family TEXT,
    attack_pattern TEXT,
    
    -- Confidence and relevance
    confidence threat_confidence NOT NULL DEFAULT 'medium',
    relevance threat_relevance NOT NULL DEFAULT 'medium',
    transmission_relevance_score INTEGER CHECK (transmission_relevance_score >= 0 AND transmission_relevance_score <= 100),
    
    -- Temporal information
    first_seen TIMESTAMPTZ DEFAULT now(),
    last_seen TIMESTAMPTZ DEFAULT now(),
    valid_from TIMESTAMPTZ DEFAULT now(),
    valid_until TIMESTAMPTZ,
    
    -- Context and attribution
    threat_actor TEXT,
    campaign TEXT,
    targeted_sectors TEXT[],
    targeted_technologies TEXT[],
    
    -- Transmission-specific context
    targets_ot_systems BOOLEAN DEFAULT false,
    targets_scada BOOLEAN DEFAULT false,
    targets_protocols transmission_protocol[],
    affects_safety_systems BOOLEAN DEFAULT false,
    
    -- Technical details
    description TEXT,
    kill_chain_phases TEXT[],
    tactics TEXT[], -- MITRE ATT&CK tactics
    techniques TEXT[], -- MITRE ATT&CK techniques
    
    -- Indicators of Compromise (IoCs)
    related_iocs JSONB DEFAULT '{}',
    network_indicators JSONB DEFAULT '{}',
    file_indicators JSONB DEFAULT '{}',
    
    -- Mitigation and response
    mitigation_strategies TEXT[],
    detection_rules TEXT[],
    recommended_actions TEXT[],
    
    -- Correlation and relationships
    related_indicators UUID[],
    parent_campaign_id UUID,
    
    -- Status and lifecycle
    is_active BOOLEAN DEFAULT true,
    is_false_positive BOOLEAN DEFAULT false,
    analyst_notes TEXT,
    
    -- Metadata
    tags TEXT[] DEFAULT '{}',
    custom_attributes JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create threat intelligence matches table for correlation
CREATE TABLE threat_intelligence_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    indicator_id UUID NOT NULL REFERENCES threat_intelligence_indicators(id) ON DELETE CASCADE,
    
    -- Match context
    match_type TEXT NOT NULL, -- 'alert', 'log-entry', 'network-traffic', 'file-hash'
    match_source TEXT NOT NULL,
    match_timestamp TIMESTAMPTZ DEFAULT now(),
    
    -- Matched entity references
    alert_id UUID REFERENCES security_alerts(id) ON DELETE SET NULL,
    incident_id UUID REFERENCES incident_cases(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    
    -- Match details
    matched_value TEXT NOT NULL,
    match_confidence DECIMAL(5,4) DEFAULT 1.0,
    context_data JSONB DEFAULT '{}',
    
    -- Analysis results
    is_confirmed BOOLEAN DEFAULT false,
    is_false_positive BOOLEAN DEFAULT false,
    analyst_assessment TEXT,
    
    -- Response tracking
    actions_taken TEXT[],
    response_status TEXT DEFAULT 'new', -- 'new', 'investigating', 'responded', 'closed'
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create threat campaigns table
CREATE TABLE threat_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Campaign identification
    name TEXT NOT NULL,
    aliases TEXT[],
    description TEXT,
    
    -- Attribution
    threat_actor TEXT,
    suspected_nation_state TEXT,
    motivation TEXT[], -- 'financial', 'espionage', 'sabotage', 'activism'
    
    -- Campaign timeline
    first_observed TIMESTAMPTZ,
    last_observed TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    -- Targeting information
    targeted_sectors TEXT[],
    targeted_countries TEXT[],
    targeted_technologies TEXT[],
    transmission_targeting BOOLEAN DEFAULT false,
    
    -- Technical characteristics
    attack_vectors TEXT[],
    tools_used TEXT[],
    techniques_used TEXT[],
    infrastructure_used TEXT[],
    
    -- Impact assessment
    estimated_victims INTEGER,
    estimated_damage_usd DECIMAL(15,2),
    safety_impact_potential BOOLEAN DEFAULT false,
    
    -- Intelligence sources
    sources TEXT[],
    confidence_level threat_confidence DEFAULT 'medium',
    
    -- Analysis
    analyst_assessment TEXT,
    key_findings TEXT[],
    recommendations TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
-- Create indexes for performance
CREATE INDEX idx_threat_feeds_tenant ON threat_intelligence_feeds(tenant_id);
CREATE INDEX idx_threat_feeds_status ON threat_intelligence_feeds(status);
CREATE INDEX idx_threat_feeds_provider ON threat_intelligence_feeds(provider);
CREATE INDEX idx_threat_feeds_transmission ON threat_intelligence_feeds(transmission_specific);

CREATE INDEX idx_threat_indicators_tenant ON threat_intelligence_indicators(tenant_id);
CREATE INDEX idx_threat_indicators_feed ON threat_intelligence_indicators(feed_id);
CREATE INDEX idx_threat_indicators_type ON threat_intelligence_indicators(indicator_type);
CREATE INDEX idx_threat_indicators_value ON threat_intelligence_indicators(indicator_value);
CREATE INDEX idx_threat_indicators_confidence ON threat_intelligence_indicators(confidence);
CREATE INDEX idx_threat_indicators_relevance ON threat_intelligence_indicators(relevance);
CREATE INDEX idx_threat_indicators_active ON threat_intelligence_indicators(is_active);
CREATE INDEX idx_threat_indicators_transmission_score ON threat_intelligence_indicators(transmission_relevance_score);
CREATE INDEX idx_threat_indicators_ot_systems ON threat_intelligence_indicators(targets_ot_systems);
CREATE INDEX idx_threat_indicators_protocols ON threat_intelligence_indicators USING GIN(targets_protocols);

CREATE INDEX idx_threat_matches_tenant ON threat_intelligence_matches(tenant_id);
CREATE INDEX idx_threat_matches_indicator ON threat_intelligence_matches(indicator_id);
CREATE INDEX idx_threat_matches_alert ON threat_intelligence_matches(alert_id);
CREATE INDEX idx_threat_matches_incident ON threat_intelligence_matches(incident_id);
CREATE INDEX idx_threat_matches_asset ON threat_intelligence_matches(asset_id);
CREATE INDEX idx_threat_matches_timestamp ON threat_intelligence_matches(match_timestamp DESC);
CREATE INDEX idx_threat_matches_status ON threat_intelligence_matches(response_status);

CREATE INDEX idx_threat_campaigns_tenant ON threat_campaigns(tenant_id);
CREATE INDEX idx_threat_campaigns_active ON threat_campaigns(is_active);
CREATE INDEX idx_threat_campaigns_transmission ON threat_campaigns(transmission_targeting);
-- Create update triggers
CREATE OR REPLACE FUNCTION update_threat_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER threat_intelligence_feeds_updated_at
    BEFORE UPDATE ON threat_intelligence_feeds
    FOR EACH ROW
    EXECUTE FUNCTION update_threat_intelligence_updated_at();

CREATE TRIGGER threat_intelligence_indicators_updated_at
    BEFORE UPDATE ON threat_intelligence_indicators
    FOR EACH ROW
    EXECUTE FUNCTION update_threat_intelligence_updated_at();

CREATE TRIGGER threat_intelligence_matches_updated_at
    BEFORE UPDATE ON threat_intelligence_matches
    FOR EACH ROW
    EXECUTE FUNCTION update_threat_intelligence_updated_at();

CREATE TRIGGER threat_campaigns_updated_at
    BEFORE UPDATE ON threat_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_threat_intelligence_updated_at();
-- Create function to calculate transmission relevance score
CREATE OR REPLACE FUNCTION calculate_transmission_relevance(indicator_record threat_intelligence_indicators)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
        -- Base score for transmission-specific targeting
        IF indicator_record.targets_ot_systems THEN score := score + 30; END IF;
        IF indicator_record.targets_scada THEN score := score + 25; END IF;
        IF indicator_record.affects_safety_systems THEN score := score + 20; END IF;
        
        -- Protocol-specific scoring
        IF indicator_record.targets_protocols IS NOT NULL AND array_length(indicator_record.targets_protocols, 1) > 0 THEN
            score := score + 15;
        END IF;
        
        -- Sector targeting
        IF indicator_record.targeted_sectors IS NOT NULL AND 
           ('energy' = ANY(indicator_record.targeted_sectors) OR 
            'utilities' = ANY(indicator_record.targeted_sectors) OR
            'power' = ANY(indicator_record.targeted_sectors)) THEN
            score := score + 10;
        END IF;
        
        -- Technology targeting
        IF indicator_record.targeted_technologies IS NOT NULL AND
           ('SCADA' = ANY(indicator_record.targeted_technologies) OR
            'HMI' = ANY(indicator_record.targeted_technologies) OR
            'PLC' = ANY(indicator_record.targeted_technologies)) THEN
            score := score + 10;
        END IF;
        
        RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql;
-- Create trigger to auto-calculate transmission relevance
CREATE OR REPLACE FUNCTION auto_calculate_transmission_relevance()
RETURNS TRIGGER AS $$
BEGIN
    NEW.transmission_relevance_score := calculate_transmission_relevance(NEW);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER threat_indicators_relevance_calculation
    BEFORE INSERT OR UPDATE ON threat_intelligence_indicators
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_transmission_relevance();

-- Create function for threat intelligence correlation
CREATE OR REPLACE FUNCTION correlate_threat_intelligence(
    search_value TEXT,
    search_type TEXT DEFAULT 'any'
)
RETURNS TABLE(
    indicator_id UUID,
    indicator_value TEXT,
    indicator_type threat_type,
    confidence threat_confidence,
    relevance threat_relevance,
    transmission_score INTEGER,
    threat_name TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tii.id,
        tii.indicator_value,
        tii.indicator_type,
        tii.confidence,
        tii.relevance,
        tii.transmission_relevance_score,
        tii.threat_name,
        tii.description
    FROM threat_intelligence_indicators tii
    WHERE tii.is_active = true
    AND (
        (search_type = 'any' AND tii.indicator_value ILIKE '%' || search_value || '%') OR
        (search_type = 'exact' AND tii.indicator_value = search_value) OR
        (search_type = 'ip' AND tii.indicator_type = 'ioc-ip' AND tii.indicator_value = search_value) OR
        (search_type = 'domain' AND tii.indicator_type = 'ioc-domain' AND tii.indicator_value ILIKE '%' || search_value || '%') OR
        (search_type = 'hash' AND tii.indicator_type = 'ioc-hash' AND tii.indicator_value = search_value)
    )
    ORDER BY tii.transmission_relevance_score DESC, tii.confidence DESC;
END;
$$ LANGUAGE plpgsql;
-- Create views for threat intelligence dashboard
CREATE OR REPLACE VIEW threat_intelligence_summary AS
SELECT 
    tenant_id,
    COUNT(*) as total_indicators,
    COUNT(*) FILTER (WHERE is_active = true) as active_indicators,
    COUNT(*) FILTER (WHERE targets_ot_systems = true) as ot_targeting_indicators,
    COUNT(*) FILTER (WHERE targets_scada = true) as scada_targeting_indicators,
    COUNT(*) FILTER (WHERE transmission_relevance_score >= 70) as high_relevance_indicators,
    COUNT(*) FILTER (WHERE confidence = 'high') as high_confidence_indicators,
    COUNT(*) FILTER (WHERE first_seen >= CURRENT_DATE - INTERVAL '7 days') as new_indicators_week,
    COUNT(*) FILTER (WHERE first_seen >= CURRENT_DATE - INTERVAL '30 days') as new_indicators_month,
    AVG(transmission_relevance_score) as avg_transmission_relevance
FROM threat_intelligence_indicators
GROUP BY tenant_id;

CREATE OR REPLACE VIEW threat_intelligence_matches_summary AS
SELECT 
    tim.tenant_id,
    DATE_TRUNC('day', tim.match_timestamp) as match_date,
    COUNT(*) as total_matches,
    COUNT(*) FILTER (WHERE tim.is_confirmed = true) as confirmed_matches,
    COUNT(*) FILTER (WHERE tim.is_false_positive = true) as false_positives,
    COUNT(*) FILTER (WHERE tim.response_status = 'new') as unresponded_matches,
    COUNT(DISTINCT tim.indicator_id) as unique_indicators_matched,
    COUNT(DISTINCT tim.alert_id) as alerts_with_matches,
    COUNT(DISTINCT tim.incident_id) as incidents_with_matches
FROM threat_intelligence_matches tim
WHERE tim.match_timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY tim.tenant_id, DATE_TRUNC('day', tim.match_timestamp);

-- Enable RLS (commented out as per plan)
-- ALTER TABLE threat_intelligence_feeds ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE threat_intelligence_indicators ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE threat_intelligence_matches ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE threat_campaigns ENABLE ROW LEVEL SECURITY;



