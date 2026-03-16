-- Seed Data for Compliance Records (Cycle 6)
-- Generates realistic compliance certificates and inspection records for Power Transmission assets
-- Depends on: 003_assets.sql (for asset IDs)

BEGIN;

DO $$
DECLARE
  v_count INTEGER;
  v_asset RECORD;
  v_type_code TEXT;
  v_tenant_id UUID;
BEGIN
  -- Get Tenant ID for DEWA
  SELECT id INTO v_tenant_id FROM tenants 
  WHERE name = 'DEWA - Transmission' AND scenario_tag = 'power_transmission_demo_v1' LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE 'Skipping compliance seed: Tenant not found';
    RETURN; /* Exit if tenant doesn't exist */
  END IF;

  -- Iterate through all relevant assets for the demo tenant
  FOR v_asset IN 
    SELECT a.id, a.tenant_id, a.name, at.code as type_code
    FROM assets a
    JOIN asset_types at ON a.asset_type_id = at.id
    WHERE a.tenant_id = v_tenant_id
  LOOP
    v_type_code := v_asset.type_code;

    -- -------------------------------------------------------------------------
    -- 1. TRANSFORMERS (DGA, Oil Analysis, Bushing Tests)
    -- -------------------------------------------------------------------------
    IF v_type_code = 'TRANSFORMER' THEN
      
      -- a) Dissolved Gas Analysis (DGA) - Critical for Transformer Health
      INSERT INTO compliance_records (tenant_id, asset_id, title, compliance_type, authority, status, description, reference_number, issue_date, expiry_date, next_inspection_date)
      VALUES (
        v_asset.tenant_id, 
        v_asset.id, 
        'Dissolved Gas Analysis (DGA)', 
        'inspection', 
        'Internal Lab', 
        'compliant', 
        'Annual analysis of insulating oil gases to detect internal faults (IEC 60599).', 
        'DGA-' || to_hex(extract(epoch from now())::int) || '-01',
        CURRENT_DATE - INTERVAL '2 months',
        CURRENT_DATE + INTERVAL '10 months',
        CURRENT_DATE + INTERVAL '10 months'
      );

      -- b) Oil Breakdown Voltage (BDV)
      INSERT INTO compliance_records (tenant_id, asset_id, title, compliance_type, authority, status, description, reference_number, issue_date, expiry_date, next_inspection_date)
      VALUES (
        v_asset.tenant_id, 
        v_asset.id, 
        'Dielectric Strength Test', 
        'inspection', 
        'Third Party', 
        'compliant', 
        'Oil breakdown voltage test per IEC 60156 standards.', 
        'BDV-' || to_hex(extract(epoch from now())::int),
        CURRENT_DATE - INTERVAL '4 months',
        CURRENT_DATE + INTERVAL '8 months',
        CURRENT_DATE + INTERVAL '8 months'
      );

    -- -------------------------------------------------------------------------
    -- 2. CIRCUIT BREAKERS (SF6, Timing)
    -- -------------------------------------------------------------------------
    ELSIF v_type_code = 'BREAKER' THEN

      -- a) SF6 Gas Quality
      INSERT INTO compliance_records (tenant_id, asset_id, title, compliance_type, authority, status, description, reference_number, issue_date, expiry_date, next_inspection_date)
      VALUES (
        v_asset.tenant_id, 
        v_asset.id, 
        'SF6 Gas Quality Audit', 
        'audit', 
        'Regulatory Body', 
        'compliant', 
        'Verification of SF6 gas purity and moisture levels (IEC 60376).', 
        'SF6-' || substring(md5(random()::text) from 1 for 6),
        CURRENT_DATE - INTERVAL '1 month',
        CURRENT_DATE + INTERVAL '11 months',
        CURRENT_DATE + INTERVAL '11 months'
      );

      -- b) Breaker Timing Test
      INSERT INTO compliance_records (tenant_id, asset_id, title, compliance_type, authority, status, description, reference_number, issue_date, expiry_date, next_inspection_date)
      VALUES (
        v_asset.tenant_id, 
        v_asset.id, 
        'Contact Timing Test', 
        'calibration', 
        'Internal Team', 
        'compliant', 
        'Measurement of opening/closing times and synchronization.', 
        'TIM-' || substring(md5(random()::text) from 1 for 4),
        CURRENT_DATE - INTERVAL '6 months',
        CURRENT_DATE + INTERVAL '6 months',
        CURRENT_DATE + INTERVAL '6 months'
      );

    -- -------------------------------------------------------------------------
    -- 3. ENERGY METERS (Calibration, Accuracy)
    -- -------------------------------------------------------------------------
    ELSIF v_type_code = 'METER' THEN

      -- a) Accuracy Calibration (Class 0.2S)
      INSERT INTO compliance_records (tenant_id, asset_id, title, compliance_type, authority, status, description, reference_number, issue_date, expiry_date, next_inspection_date)
      VALUES (
        v_asset.tenant_id, 
        v_asset.id, 
        'Accuracy Calibration (Class 0.2S)', 
        'calibration', 
        'Metrology Authority', 
        'compliant', 
        'Verification of meter accuracy classes per IEC 62053-22.', 
        'CAL-' || to_char(now(), 'YYYY') || '-' || substring(md5(random()::text) from 1 for 5),
        CURRENT_DATE - INTERVAL '3 months',
        CURRENT_DATE + INTERVAL '9 months',
        CURRENT_DATE + INTERVAL '9 months'
      );

      -- b) Seal Integrity Check
      INSERT INTO compliance_records (tenant_id, asset_id, title, compliance_type, authority, status, description, reference_number, issue_date, expiry_date, next_inspection_date)
      VALUES (
        v_asset.tenant_id, 
        v_asset.id, 
        'Physical Seal Inspection', 
        'inspection', 
        'Internal Audit', 
        'compliant', 
        'Visual inspection of anti-tamper seals and enclosure integrity.', 
        'SEAL-' || substring(md5(random()::text) from 1 for 6),
        CURRENT_DATE - INTERVAL '1 month',
        CURRENT_DATE + INTERVAL '5 months',
        CURRENT_DATE + INTERVAL '5 months'
      );

    -- -------------------------------------------------------------------------
    -- 4. SWITCHGEAR BAYS / GENERIC (Safety, Thermography)
    -- -------------------------------------------------------------------------
    ELSE
      -- a) Infrared Thermography
      INSERT INTO compliance_records (tenant_id, asset_id, title, compliance_type, authority, status, description, reference_number, issue_date, expiry_date, next_inspection_date)
      VALUES (
        v_asset.tenant_id, 
        v_asset.id, 
        'Infrared Thermography Scan', 
        'inspection', 
        'Internal Team', 
        'compliant', 
        'Detection of hotspots and loose connections.', 
        'IR-' || substring(md5(random()::text) from 1 for 6),
        CURRENT_DATE - INTERVAL '5 months',
        CURRENT_DATE + INTERVAL '1 month',
        CURRENT_DATE + INTERVAL '1 month'
      );
      
    END IF;

    -- -------------------------------------------------------------------------
    -- 5. UNIVERSAL (NERC CIP / Security) - for Critical Assets only
    -- -------------------------------------------------------------------------
    -- We can't easily check criticality directly here without another join or if it's in a view, 
    -- but let's assume all main assets get a security check for this demo.
    INSERT INTO compliance_records (tenant_id, asset_id, title, compliance_type, authority, status, description, reference_number, issue_date, expiry_date, next_inspection_date)
    VALUES (
      v_asset.tenant_id, 
      v_asset.id, 
      'Cyber Security Audit (NERC CIP)', 
      'audit', 
      'Regulatory Body', 
      'compliant', 
      'Verification of physical and electronic security per NERC CIP standards.', 
      'CIP-' || to_char(now(), 'YYYY') || '-AUD',
      CURRENT_DATE - INTERVAL '3 months',
      CURRENT_DATE + INTERVAL '9 months',
      CURRENT_DATE + INTERVAL '9 months'
    );

  END LOOP;
  
  SELECT COUNT(*) INTO v_count FROM compliance_records;
  RAISE NOTICE 'Seed 015_compliance_data.sql OK: compliance_records=%', v_count;
END $$;

COMMIT;
