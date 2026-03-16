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