
-- Fix permissions for transmission tables
-- Grant usage on schema public to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant SELECT on tables to authenticated users
GRANT SELECT ON TABLE tx_substations TO authenticated;
GRANT SELECT ON TABLE tx_feeders TO authenticated;
GRANT SELECT ON TABLE tx_transformers TO authenticated;
GRANT SELECT ON TABLE tx_bays TO authenticated;
GRANT SELECT ON TABLE tx_lines TO authenticated;
GRANT SELECT ON TABLE energy_meters TO authenticated;
GRANT SELECT ON TABLE energy_telemetry TO authenticated;
GRANT SELECT ON TABLE energy_baselines TO authenticated;
GRANT SELECT ON TABLE power_quality_events TO authenticated;
GRANT SELECT ON TABLE submeters TO authenticated;

-- Grant access to sequences if any (for ID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Also grant to service_role just in case
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
