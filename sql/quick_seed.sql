-- Quick seed for DEWA - Transmission security zones
DO $$
DECLARE
  v_tenant_id UUID;
  v_site_id UUID;
BEGIN
  -- Get DEWA tenant
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'DEWA - Transmission' LIMIT 1;
  
  -- Get first site for this tenant
  SELECT id INTO v_site_id FROM sites WHERE tenant_id = v_tenant_id LIMIT 1;
  
  IF v_tenant_id IS NOT NULL AND v_site_id IS NOT NULL THEN
    -- Insert security zones
    INSERT INTO security_zones (tenant_id, site_id, name, zone_type, security_level, asset_count, compliance_status, policies)
    VALUES 
      (v_tenant_id, v_site_id, 'Control Centre SCADA Network', 'scada-network', 3, 15, 'compliant', '[]'::jsonb),
      (v_tenant_id, v_site_id, 'Protection Systems Zone', 'protection-systems', 4, 8, 'compliant', '[]'::jsonb),
      (v_tenant_id, v_site_id, 'Field Devices Zone', 'field-devices', 2, 12, 'partial', '[]'::jsonb),
      (v_tenant_id, v_site_id, 'DMZ Zone', 'dmz', 2, 4, 'compliant', '[]'::jsonb)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Successfully seeded % zones for DEWA - Transmission', (SELECT COUNT(*) FROM security_zones WHERE tenant_id = v_tenant_id);
  ELSE
    RAISE NOTICE 'Tenant ID: %, Site ID: %', v_tenant_id, v_site_id;
  END IF;
END $$;
