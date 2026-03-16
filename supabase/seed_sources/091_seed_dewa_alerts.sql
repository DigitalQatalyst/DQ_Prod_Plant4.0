-- Seed DEWA alerts for Power Transmission Demo Tenant
-- Sourced from previous mock data

-- Get tenant ID for Power Transmission Demo
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT id INTO v_tenant_id FROM tenants WHERE scenario_tag = 'power_transmission_demo_v1';
  
  IF v_tenant_id IS NOT NULL THEN
    -- Alerts
    INSERT INTO alerts (tenant_id, source_type, source_id, severity, status, title, created_at, payload)
    VALUES
      (
        v_tenant_id,
        'asset',
        NULL, -- Asset ID would need lookup, leaving NULL or using a placeholder if constraint allows. Schema says source_id is UUID.
        'critical',
        'open',
        'Main Transformer Overheating',
        '2024-02-05 08:30:00+00',
        '{"summary": "Transformer winding temperature exceeded 110°C. Cooling fans operating at 100%. Imminent trip risk.", "tags": ["transformer", "critical", "temperature"], "siteId": "dewa-main-substation"}'
      ),
      (
        v_tenant_id,
        'security',
        NULL,
        'warning',
        'open',
        'Unauthorized Access Detected',
        '2024-02-05 09:15:00+00',
        '{"summary": "Multiple failed login attempts on SCADA workstation 4. Source IP: 10.20.1.55.", "tags": ["security", "access-control", "scada"], "siteId": "dewa-control-center"}'
      ),
      (
        v_tenant_id,
        'grid_node', -- Mapping 'energy' feature area to grid_node or similar
        NULL,
        'warning',
        'acknowledged',
        'High Reactive Power Flow',
        '2024-02-05 07:00:00+00',
        '{"summary": "Power factor dropped below 0.85 in Sector A. Capacitor banks 3 and 4 failed to engage.", "tags": ["power-quality", "grid", "reactive-power"], "siteId": "dewa-grid-sector-a"}'
      ),
      (
        v_tenant_id,
        'automation', -- Mapping 'monitoring'
        NULL,
        'info',
        'closed',
        'Daily Yield Report Generated',
        '2024-02-04 18:00:00+00',
        '{"summary": "Solar park daily yield report generated. Total generation: 4.5 GWh. Efficiency: 98.5%.", "tags": ["report", "solar", "generation"], "siteId": "dewa-solar-park"}'
      ),
      (
        v_tenant_id,
        'asset',
        NULL,
        'warning',
        'in-progress',
        'High Pressure Pump Vibration',
        '2024-02-05 06:00:00+00',
        '{"summary": "Vibration levels on HP Pump 02 exceeded warning threshold (5mm/s). Bearing wear suspected.", "tags": ["vibration", "pump", "predictive-maintenance"], "siteId": "dewa-desalination-plant"}'
      );
  END IF;
END $$;
