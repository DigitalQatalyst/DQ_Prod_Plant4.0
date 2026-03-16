-- Seed data for EMS Power Transmission - Sustainability
-- Creates emission factors, delivery context, emissions snapshots, renewable contracts, and compliance requirements
-- Uses CTE pattern with preconditions, idempotent upserts, and postchecks
-- Requirements: 18.1, 19.1, 20.1, 21.1

BEGIN;

-- ============================================================================
-- PRECONDITION ASSERTIONS
-- Fail loudly if required data is missing
-- ============================================================================
DO $$
DECLARE
  v_tenant_count INTEGER;
  v_substation_count INTEGER;
  v_feeder_count INTEGER;
BEGIN
  -- Verify transmission tenant exists
  SELECT COUNT(*) INTO v_tenant_count
  FROM tenants
  WHERE name = 'DEWA - Transmission'
    AND sector = 'power'
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1';
  
  IF v_tenant_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: Tenant "DEWA - Transmission" does not exist. Run 001_transmission_tenant.sql first.';
  END IF;
  
  -- Verify substations exist
  SELECT COUNT(*) INTO v_substation_count
  FROM tx_substations s
  INNER JOIN tenants t ON s.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_substation_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No substations found. Run 007_energy_tx_foundation.sql first.';
  END IF;
  
  -- Verify feeders exist
  SELECT COUNT(*) INTO v_feeder_count
  FROM tx_feeders f
  INNER JOIN tx_substations s ON f.substation_id = s.id
  INNER JOIN tenants t ON s.org_id = t.id
  WHERE t.name = 'DEWA - Transmission'
    AND t.scenario_tag = 'power_transmission_demo_v1';
  
  IF v_feeder_count = 0 THEN
    RAISE EXCEPTION 'PRECONDITION FAILED: No feeders found. Run 007_energy_tx_foundation.sql first.';
  END IF;
  
  RAISE NOTICE 'Preconditions passed: tenant exists, % substations, % feeders', v_substation_count, v_feeder_count;
END $$;

-- ============================================================================
-- MAIN SEED LOGIC
-- ============================================================================

-- 1) Get tenant UUID and substations
WITH tenant AS (
  SELECT id FROM tenants 
  WHERE name = 'DEWA - Transmission' 
    AND sector = 'power' 
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1
),

substations_lookup AS (
  SELECT s.id, s.code, s.name
  FROM tx_substations s
  INNER JOIN tenant t ON s.org_id = t.id
),

feeders_lookup AS (
  SELECT f.id, f.feeder_code, f.name, f.substation_id
  FROM tx_feeders f
  INNER JOIN substations_lookup s ON f.substation_id = s.id
),

-- 2) Upsert emission factors using natural key (org_id, factor_code)
upsert_emission_factors AS (
  INSERT INTO emission_factors (
    org_id,
    factor_code,
    factor_name,
    description,
    energy_type,
    scope,
    region,
    kg_co2e_per_kwh,
    kg_co2_per_kwh,
    kg_ch4_per_kwh,
    kg_n2o_per_kwh,
    effective_date,
    expiry_date,
    source,
    source_reference,
    methodology,
    uncertainty_percentage,
    active,
    default_factor
  )
  SELECT 
    tenant.id,
    v.factor_code,
    v.factor_name,
    v.description,
    v.energy_type,
    v.scope,
    v.region,
    v.kg_co2e_per_kwh,
    v.kg_co2_per_kwh,
    v.kg_ch4_per_kwh,
    v.kg_n2o_per_kwh,
    v.effective_date,
    v.expiry_date,
    v.source,
    v.source_reference,
    v.methodology,
    v.uncertainty_percentage,
    v.active,
    v.default_factor
  FROM tenant
  CROSS JOIN (VALUES
    -- UAE Grid Electricity Factors (Scope 2)
    ('UAE-GRID-2024', 'UAE Grid Electricity 2024', 'UAE national grid emission factor for 2024', 'electricity', 'scope2', 'UAE', 0.475000, 0.450000, 0.000015, 0.000010, '2024-01-01'::DATE, '2024-12-31'::DATE, 'UAE Ministry of Energy', 'UAE Energy Report 2024', 'Location-based method per GHG Protocol', 5.0, true, true),
    ('UAE-GRID-2025', 'UAE Grid Electricity 2025', 'UAE national grid emission factor for 2025 (projected)', 'electricity', 'scope2', 'UAE', 0.460000, 0.435000, 0.000014, 0.000009, '2025-01-01'::DATE, NULL, 'UAE Ministry of Energy', 'UAE Energy Forecast 2025', 'Location-based method per GHG Protocol', 8.0, true, false),
    ('DUBAI-GRID-2024', 'Dubai Grid Electricity 2024', 'Dubai-specific grid emission factor', 'electricity', 'scope2', 'Dubai', 0.450000, 0.425000, 0.000015, 0.000010, '2024-01-01'::DATE, '2024-12-31'::DATE, 'DEWA', 'DEWA Sustainability Report 2024', 'Location-based method', 4.0, true, false),
    
    -- Natural Gas Factors (Scope 1)
    ('NG-COMBUSTION', 'Natural Gas Combustion', 'Direct emissions from natural gas combustion', 'gas', 'scope1', NULL, 0.202000, 0.185000, 0.000010, 0.000007, '2020-01-01'::DATE, NULL, 'EPA', 'EPA GHG Emission Factors 2020', 'Tier 1 emission factor', 3.0, true, true),
    
    -- Diesel Factors (Scope 1)
    ('DIESEL-COMBUSTION', 'Diesel Combustion', 'Direct emissions from diesel combustion', 'diesel', 'scope1', NULL, 0.267000, 0.250000, 0.000005, 0.000005, '2020-01-01'::DATE, NULL, 'EPA', 'EPA GHG Emission Factors 2020', 'Tier 1 emission factor', 3.0, true, true),
    
    -- Steam Factors (Scope 2)
    ('STEAM-PURCHASED', 'Purchased Steam', 'Emissions from purchased steam', 'steam', 'scope2', NULL, 0.080000, 0.075000, 0.000003, 0.000002, '2020-01-01'::DATE, NULL, 'EPA', 'EPA GHG Emission Factors 2020', 'Average steam generation', 10.0, true, true)
  ) AS v(
    factor_code,
    factor_name,
    description,
    energy_type,
    scope,
    region,
    kg_co2e_per_kwh,
    kg_co2_per_kwh,
    kg_ch4_per_kwh,
    kg_n2o_per_kwh,
    effective_date,
    expiry_date,
    source,
    source_reference,
    methodology,
    uncertainty_percentage,
    active,
    default_factor
  )
  ON CONFLICT (org_id, factor_code)
  DO UPDATE SET
    factor_name = EXCLUDED.factor_name,
    description = EXCLUDED.description,
    energy_type = EXCLUDED.energy_type,
    scope = EXCLUDED.scope,
    region = EXCLUDED.region,
    kg_co2e_per_kwh = EXCLUDED.kg_co2e_per_kwh,
    kg_co2_per_kwh = EXCLUDED.kg_co2_per_kwh,
    kg_ch4_per_kwh = EXCLUDED.kg_ch4_per_kwh,
    kg_n2o_per_kwh = EXCLUDED.kg_n2o_per_kwh,
    effective_date = EXCLUDED.effective_date,
    expiry_date = EXCLUDED.expiry_date,
    source = EXCLUDED.source,
    source_reference = EXCLUDED.source_reference,
    methodology = EXCLUDED.methodology,
    uncertainty_percentage = EXCLUDED.uncertainty_percentage,
    active = EXCLUDED.active,
    default_factor = EXCLUDED.default_factor,
    updated_at = now()
  RETURNING id, factor_code, energy_type, scope
),

-- 3) Upsert tx_delivery_context for substations and feeders
upsert_delivery_context AS (
  INSERT INTO tx_delivery_context (
    org_id,
    scope_type,
    scope_id,
    period_start,
    period_end,
    period_grain,
    mwh_delivered,
    mw_peak,
    losses_mwh,
    losses_percentage,
    interchange_in_mwh,
    interchange_out_mwh,
    net_interchange_mwh,
    load_factor,
    avg_load_mw,
    data_completeness_pct,
    calculation_method
  )
  SELECT 
    tenant.id,
    v.scope_type,
    CASE 
      WHEN v.scope_type = 'substation' THEN sub.id
      WHEN v.scope_type = 'feeder' THEN fdr.id
      ELSE tenant.id
    END,
    v.period_start,
    v.period_end,
    v.period_grain,
    v.mwh_delivered,
    v.mw_peak,
    v.losses_mwh,
    v.losses_percentage,
    v.interchange_in_mwh,
    v.interchange_out_mwh,
    v.net_interchange_mwh,
    v.load_factor,
    v.avg_load_mw,
    v.data_completeness_pct,
    v.calculation_method
  FROM tenant
  CROSS JOIN (VALUES
    -- Organization level - January 2025
    ('org', NULL, NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 125000.0, 185.5, 6250.0, 5.0, 50000.0, 30000.0, 20000.0, 0.72, 168.3, 98.5, 'Aggregated from substation meters'),
    
    -- Substation level - January 2025
    ('substation', 'SS-DXB-MAIN', NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 45000.0, 68.2, 2250.0, 5.0, 20000.0, 10000.0, 10000.0, 0.70, 60.5, 99.2, 'Metered at substation level'),
    ('substation', 'SS-JA-MAIN', NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 38000.0, 58.5, 1900.0, 5.0, 15000.0, 8000.0, 7000.0, 0.69, 51.1, 98.8, 'Metered at substation level'),
    ('substation', 'SS-AW-MAIN', NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 28000.0, 42.3, 1400.0, 5.0, 10000.0, 7000.0, 3000.0, 0.71, 37.6, 97.5, 'Metered at substation level'),
    ('substation', 'SS-DXB-SOUTH', NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 14000.0, 16.5, 700.0, 5.0, 5000.0, 5000.0, 0.0, 0.91, 18.8, 96.3, 'Metered at substation level'),
    
    -- Feeder level - January 2025 (selected feeders)
    ('feeder', NULL, 'FDR-OUT-01', '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 22000.0, 33.5, 1100.0, 5.0, 0.0, 0.0, 0.0, 0.70, 29.6, 99.5, 'Feeder metering'),
    ('feeder', NULL, 'FDR-OUT-02', '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 21000.0, 32.0, 1050.0, 5.0, 0.0, 0.0, 0.0, 0.70, 28.2, 99.1, 'Feeder metering')
  ) AS v(
    scope_type,
    substation_code,
    feeder_code,
    period_start,
    period_end,
    period_grain,
    mwh_delivered,
    mw_peak,
    losses_mwh,
    losses_percentage,
    interchange_in_mwh,
    interchange_out_mwh,
    net_interchange_mwh,
    load_factor,
    avg_load_mw,
    data_completeness_pct,
    calculation_method
  )
  LEFT JOIN substations_lookup sub ON sub.code = v.substation_code
  LEFT JOIN feeders_lookup fdr ON fdr.feeder_code = v.feeder_code
  ON CONFLICT (scope_type, scope_id, period_start, period_grain)
  DO UPDATE SET
    period_end = EXCLUDED.period_end,
    mwh_delivered = EXCLUDED.mwh_delivered,
    mw_peak = EXCLUDED.mw_peak,
    losses_mwh = EXCLUDED.losses_mwh,
    losses_percentage = EXCLUDED.losses_percentage,
    interchange_in_mwh = EXCLUDED.interchange_in_mwh,
    interchange_out_mwh = EXCLUDED.interchange_out_mwh,
    net_interchange_mwh = EXCLUDED.net_interchange_mwh,
    load_factor = EXCLUDED.load_factor,
    avg_load_mw = EXCLUDED.avg_load_mw,
    data_completeness_pct = EXCLUDED.data_completeness_pct,
    calculation_method = EXCLUDED.calculation_method,
    updated_at = now()
  RETURNING id
),

-- 4) Get emission factor IDs for emissions snapshots
emission_factors_lookup AS (
  SELECT id, factor_code, energy_type, scope as ghg_scope
  FROM upsert_emission_factors
  UNION ALL
  SELECT ef.id, ef.factor_code, ef.energy_type, ef.scope as ghg_scope
  FROM emission_factors ef
  INNER JOIN tenant t ON ef.org_id = t.id
  WHERE ef.factor_code IN (
    'UAE-GRID-2024',
    'DUBAI-GRID-2024',
    'NG-COMBUSTION',
    'DIESEL-COMBUSTION'
  )
),

-- 5) Upsert energy_emissions_snapshots
upsert_emissions_snapshots AS (
  INSERT INTO energy_emissions_snapshots (
    org_id,
    scope_type,
    scope_id,
    period_start,
    period_end,
    period_grain,
    factor_id,
    energy_kwh,
    energy_type,
    co2e_kg,
    co2_kg,
    ch4_kg,
    n2o_kg,
    ghg_scope,
    co2e_per_mwh_delivered,
    calculation_method,
    data_quality_score
  )
  SELECT 
    tenant.id,
    v.scope_type,
    CASE 
      WHEN v.scope_type = 'substation' THEN sub.id
      WHEN v.scope_type = 'feeder' THEN fdr.id
      ELSE tenant.id
    END,
    v.period_start,
    v.period_end,
    v.period_grain,
    ef.id,
    v.energy_kwh,
    v.energy_type,
    v.co2e_kg,
    v.co2_kg,
    v.ch4_kg,
    v.n2o_kg,
    ef.ghg_scope,
    v.co2e_per_mwh_delivered,
    v.calculation_method,
    v.data_quality_score
  FROM tenant
  CROSS JOIN (VALUES
    -- Organization level - January 2025 - Electricity (Scope 2)
    ('org', NULL, NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 'UAE-GRID-2024', 125000000.0, 'electricity', 59375.0, 56250.0, 1.875, 1.250, 475.0, 'Calculated using UAE grid factor', 0.95),
    
    -- Substation level - January 2025 - Electricity (Scope 2)
    ('substation', 'SS-DXB-MAIN', NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 'DUBAI-GRID-2024', 45000000.0, 'electricity', 20250.0, 19125.0, 0.675, 0.450, 450.0, 'Calculated using Dubai grid factor', 0.98),
    ('substation', 'SS-JA-MAIN', NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 'DUBAI-GRID-2024', 38000000.0, 'electricity', 17100.0, 16150.0, 0.570, 0.380, 450.0, 'Calculated using Dubai grid factor', 0.97),
    ('substation', 'SS-AW-MAIN', NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 'DUBAI-GRID-2024', 28000000.0, 'electricity', 12600.0, 11900.0, 0.420, 0.280, 450.0, 'Calculated using Dubai grid factor', 0.96),
    ('substation', 'SS-DXB-SOUTH', NULL, '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 'DUBAI-GRID-2024', 14000000.0, 'electricity', 6300.0, 5950.0, 0.210, 0.140, 450.0, 'Calculated using Dubai grid factor', 0.95),
    
    -- Feeder level - January 2025 - Electricity (Scope 2)
    ('feeder', NULL, 'FDR-OUT-01', '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 'DUBAI-GRID-2024', 22000000.0, 'electricity', 9900.0, 9350.0, 0.330, 0.220, 450.0, 'Calculated using Dubai grid factor', 0.99),
    ('feeder', NULL, 'FDR-OUT-02', '2025-01-01 00:00:00+00'::TIMESTAMPTZ, '2025-02-01 00:00:00+00'::TIMESTAMPTZ, 'month', 'DUBAI-GRID-2024', 21000000.0, 'electricity', 9450.0, 8925.0, 0.315, 0.210, 450.0, 'Calculated using Dubai grid factor', 0.98)
  ) AS v(
    scope_type,
    substation_code,
    feeder_code,
    period_start,
    period_end,
    period_grain,
    factor_code,
    energy_kwh,
    energy_type,
    co2e_kg,
    co2_kg,
    ch4_kg,
    n2o_kg,
    co2e_per_mwh_delivered,
    calculation_method,
    data_quality_score
  )
  LEFT JOIN substations_lookup sub ON sub.code = v.substation_code
  LEFT JOIN feeders_lookup fdr ON fdr.feeder_code = v.feeder_code
  INNER JOIN emission_factors_lookup ef ON ef.factor_code = v.factor_code
  ON CONFLICT (scope_type, scope_id, period_start, period_grain, factor_id)
  DO UPDATE SET
    period_end = EXCLUDED.period_end,
    energy_kwh = EXCLUDED.energy_kwh,
    co2e_kg = EXCLUDED.co2e_kg,
    co2_kg = EXCLUDED.co2_kg,
    ch4_kg = EXCLUDED.ch4_kg,
    n2o_kg = EXCLUDED.n2o_kg,
    co2e_per_mwh_delivered = EXCLUDED.co2e_per_mwh_delivered,
    calculation_method = EXCLUDED.calculation_method,
    data_quality_score = EXCLUDED.data_quality_score,
    updated_at = now()
  RETURNING id
),

-- 6) Upsert tx_renewables_contracts
upsert_renewables_contracts AS (
  INSERT INTO tx_renewables_contracts (
    org_id,
    contract_code,
    contract_name,
    description,
    contract_type,
    renewable_type,
    supplier_name,
    supplier_id,
    contract_start_date,
    contract_end_date,
    auto_renew,
    contracted_capacity_mw,
    annual_generation_mwh,
    price_per_mwh,
    price_escalation_pct,
    currency,
    generation_site_name,
    generation_site_location,
    substation_id,
    rec_eligible,
    certification_standard,
    certification_id,
    total_generation_mwh,
    total_recs_issued,
    last_generation_date,
    status
  )
  SELECT 
    tenant.id,
    v.contract_code,
    v.contract_name,
    v.description,
    v.contract_type,
    v.renewable_type,
    v.supplier_name,
    v.supplier_id,
    v.contract_start_date,
    v.contract_end_date,
    v.auto_renew,
    v.contracted_capacity_mw,
    v.annual_generation_mwh,
    v.price_per_mwh,
    v.price_escalation_pct,
    v.currency,
    v.generation_site_name,
    v.generation_site_location,
    sub.id,
    v.rec_eligible,
    v.certification_standard,
    v.certification_id,
    v.total_generation_mwh,
    v.total_recs_issued,
    v.last_generation_date,
    v.status
  FROM tenant
  CROSS JOIN (VALUES
    -- Solar PPA
    ('PPA-SOLAR-001', 'Mohammed bin Rashid Al Maktoum Solar Park PPA', 'Power Purchase Agreement for solar energy from MBR Solar Park', 'ppa', 'solar', 'DEWA Solar', 'DEWA-SOLAR-001', '2020-01-01'::DATE, '2045-12-31'::DATE, false, 200.0, 438000.0, 29.50, 2.0, 'AED', 'MBR Solar Park Phase III', 'Dubai, UAE', 'SS-DXB-MAIN', true, 'I-REC', 'IREC-UAE-2020-001', 1752000.0, 1752, '2025-01-31'::DATE, 'active'),
    
    -- Wind PPA
    ('PPA-WIND-001', 'Offshore Wind Farm PPA', 'Power Purchase Agreement for offshore wind energy', 'ppa', 'wind', 'Gulf Wind Energy', 'GWE-001', '2022-06-01'::DATE, '2047-05-31'::DATE, false, 150.0, 525600.0, 32.00, 1.5, 'AED', 'Dubai Offshore Wind Farm', 'Dubai Coast, UAE', 'SS-JA-MAIN', true, 'I-REC', 'IREC-UAE-2022-002', 876000.0, 876, '2025-01-31'::DATE, 'active'),
    
    -- On-site Solar
    ('ONSITE-SOLAR-001', 'Substation Rooftop Solar', 'On-site solar generation at Al Aweer substation', 'on_site_generation', 'solar', NULL, NULL, '2023-03-15'::DATE, NULL, false, 5.0, 8760.0, 0.00, 0.0, 'AED', 'Al Aweer Substation Rooftop', 'Al Aweer, Dubai', 'SS-AW-MAIN', true, 'Green-e', 'GREENE-UAE-2023-001', 14600.0, 15, '2025-01-31'::DATE, 'active'),
    
    -- REC Purchase
    ('REC-001', 'Renewable Energy Credits 2024', 'Purchase of RECs to offset grid electricity', 'rec', 'solar', 'UAE REC Registry', 'UAE-REC-REG', '2024-01-01'::DATE, '2024-12-31'::DATE, true, NULL, 50000.0, 5.00, 0.0, 'AED', 'Various UAE Solar Projects', 'UAE', NULL, true, 'I-REC', 'IREC-UAE-2024-BULK', 50000.0, 50, '2024-12-31'::DATE, 'active'),
    
    -- Green Tariff
    ('GREEN-TARIFF-001', 'DEWA Green Tariff Program', 'Participation in DEWA green tariff for renewable energy', 'green_tariff', 'solar', 'DEWA', 'DEWA-GREEN-001', '2024-01-01'::DATE, '2026-12-31'::DATE, true, NULL, 100000.0, 8.50, 0.0, 'AED', 'DEWA Renewable Portfolio', 'Dubai, UAE', NULL, true, 'DEWA Green', 'DEWA-GREEN-2024', 100000.0, 100, '2025-01-31'::DATE, 'active')
  ) AS v(
    contract_code,
    contract_name,
    description,
    contract_type,
    renewable_type,
    supplier_name,
    supplier_id,
    contract_start_date,
    contract_end_date,
    auto_renew,
    contracted_capacity_mw,
    annual_generation_mwh,
    price_per_mwh,
    price_escalation_pct,
    currency,
    generation_site_name,
    generation_site_location,
    substation_code,
    rec_eligible,
    certification_standard,
    certification_id,
    total_generation_mwh,
    total_recs_issued,
    last_generation_date,
    status
  )
  LEFT JOIN substations_lookup sub ON sub.code = v.substation_code
  ON CONFLICT (org_id, contract_code)
  DO UPDATE SET
    contract_name = EXCLUDED.contract_name,
    description = EXCLUDED.description,
    contract_type = EXCLUDED.contract_type,
    renewable_type = EXCLUDED.renewable_type,
    supplier_name = EXCLUDED.supplier_name,
    supplier_id = EXCLUDED.supplier_id,
    contract_start_date = EXCLUDED.contract_start_date,
    contract_end_date = EXCLUDED.contract_end_date,
    auto_renew = EXCLUDED.auto_renew,
    contracted_capacity_mw = EXCLUDED.contracted_capacity_mw,
    annual_generation_mwh = EXCLUDED.annual_generation_mwh,
    price_per_mwh = EXCLUDED.price_per_mwh,
    price_escalation_pct = EXCLUDED.price_escalation_pct,
    currency = EXCLUDED.currency,
    generation_site_name = EXCLUDED.generation_site_name,
    generation_site_location = EXCLUDED.generation_site_location,
    substation_id = EXCLUDED.substation_id,
    rec_eligible = EXCLUDED.rec_eligible,
    certification_standard = EXCLUDED.certification_standard,
    certification_id = EXCLUDED.certification_id,
    total_generation_mwh = EXCLUDED.total_generation_mwh,
    total_recs_issued = EXCLUDED.total_recs_issued,
    last_generation_date = EXCLUDED.last_generation_date,
    status = EXCLUDED.status,
    updated_at = now()
  RETURNING id, contract_code
),

-- 7) Upsert tx_compliance_requirements
upsert_compliance_requirements AS (
  INSERT INTO tx_compliance_requirements (
    org_id,
    requirement_code,
    requirement_name,
    description,
    standard_reference,
    regulatory_body,
    jurisdiction,
    requirement_type,
    compliance_category,
    effective_date,
    expiry_date,
    review_frequency_days,
    next_review_date,
    evidence_required,
    evidence_types,
    evidence_retention_years,
    applies_to_scope,
    scope_filter,
    compliance_status,
    last_assessment_date,
    next_assessment_date,
    responsible_role,
    penalty_description,
    risk_level
  )
  SELECT 
    tenant.id,
    v.requirement_code,
    v.requirement_name,
    v.description,
    v.standard_reference,
    v.regulatory_body,
    v.jurisdiction,
    v.requirement_type,
    v.compliance_category,
    v.effective_date,
    v.expiry_date,
    v.review_frequency_days,
    v.next_review_date,
    v.evidence_required,
    v.evidence_types,
    v.evidence_retention_years,
    v.applies_to_scope,
    v.scope_filter,
    v.compliance_status,
    v.last_assessment_date,
    v.next_assessment_date,
    v.responsible_role,
    v.penalty_description,
    v.risk_level
  FROM tenant
  CROSS JOIN (VALUES
    -- ISO 50001 Energy Management
    ('ISO-50001-ENERGY-REVIEW', 'ISO 50001 Energy Review', 'Annual energy review and management system audit as required by ISO 50001', 'ISO 50001:2018', 'ISO', 'UAE', 'audit', 'energy_efficiency', '2020-01-01'::DATE, NULL, 365, '2025-12-31'::DATE, true, ARRAY['audit', 'report', 'certificate'], 7, 'all_transmission', '{}'::JSONB, 'compliant', '2024-12-15'::DATE, '2025-12-15'::DATE, 'Energy Manager', 'Loss of ISO 50001 certification', 'High'),
    
    -- EPA GHG Reporting
    ('EPA-GHG-REPORTING', 'EPA GHG Emissions Reporting', 'Annual greenhouse gas emissions reporting to EPA', 'EPA GHG Reporting Rule', 'EPA', 'Federal', 'reporting', 'emissions', '2010-01-01'::DATE, NULL, 365, '2025-03-31'::DATE, true, ARRAY['report', 'measurement', 'system_data'], 10, 'org', '{}'::JSONB, 'compliant', '2024-03-15'::DATE, '2025-03-31'::DATE, 'Sustainability Manager', 'Fines up to $37,500 per day for non-compliance', 'Critical'),
    
    -- NERC CIP Reliability
    ('NERC-CIP-007', 'NERC CIP-007 System Security Management', 'Cybersecurity controls for transmission system protection', 'NERC CIP-007-6', 'NERC', 'North America', 'operational', 'security', '2016-04-01'::DATE, NULL, 90, '2025-04-01'::DATE, true, ARRAY['audit', 'document', 'system_data'], 5, 'all_transmission', '{"voltage_level": ">=132kV"}'::JSONB, 'compliant', '2025-01-10'::DATE, '2025-04-01'::DATE, 'Security Officer', 'Penalties up to $1,000,000 per day per violation', 'Critical'),
    
    -- UAE Energy Efficiency Standards
    ('UAE-EE-STANDARD', 'UAE Energy Efficiency Standard', 'Compliance with UAE national energy efficiency standards for transmission', 'UAE Energy Efficiency Standard 2021', 'UAE Ministry of Energy', 'UAE', 'operational', 'energy_efficiency', '2021-01-01'::DATE, NULL, 180, '2025-07-01'::DATE, true, ARRAY['measurement', 'report'], 5, 'all_transmission', '{}'::JSONB, 'compliant', '2024-12-20'::DATE, '2025-06-30'::DATE, 'Operations Manager', 'Regulatory sanctions and potential license restrictions', 'High'),
    
    -- Renewable Energy Targets
    ('UAE-RENEWABLE-TARGET', 'UAE Renewable Energy Target', 'Meet UAE renewable energy targets (50% by 2050)', 'UAE Energy Strategy 2050', 'UAE Ministry of Energy', 'UAE', 'reporting', 'renewable_energy', '2017-01-01'::DATE, NULL, 365, '2025-12-31'::DATE, true, ARRAY['report', 'certificate', 'system_data'], 10, 'org', '{}'::JSONB, 'pending', '2024-12-31'::DATE, '2025-12-31'::DATE, 'Sustainability Manager', 'Reputational risk and potential regulatory pressure', 'Medium'),
    
    -- Grid Code Compliance
    ('DEWA-GRID-CODE', 'DEWA Grid Code Compliance', 'Compliance with DEWA transmission grid code requirements', 'DEWA Grid Code v3.0', 'DEWA', 'Dubai', 'operational', 'reliability', '2019-01-01'::DATE, NULL, 180, '2025-06-30'::DATE, true, ARRAY['measurement', 'audit', 'document'], 7, 'all_transmission', '{}'::JSONB, 'compliant', '2024-12-01'::DATE, '2025-06-30'::DATE, 'Grid Operations Manager', 'Grid connection restrictions or penalties', 'High'),
    
    -- Environmental Compliance
    ('UAE-ENV-PERMIT', 'UAE Environmental Operating Permit', 'Annual environmental operating permit renewal', 'UAE Federal Law No. 24 of 1999', 'UAE Ministry of Climate Change', 'UAE', 'certification', 'environmental', '2020-01-01'::DATE, '2025-12-31'::DATE, 365, '2025-11-30'::DATE, true, ARRAY['certificate', 'report', 'audit'], 10, 'all_transmission', '{}'::JSONB, 'compliant', '2024-11-15'::DATE, '2025-11-30'::DATE, 'Environmental Manager', 'Operating permit suspension or revocation', 'Critical'),
    
    -- Safety Standards
    ('OSHA-ELECTRICAL-SAFETY', 'OSHA Electrical Safety Standards', 'Compliance with electrical safety standards for transmission operations', 'OSHA 1910 Subpart S', 'OSHA', 'Federal', 'operational', 'safety', '1990-01-01'::DATE, NULL, 365, '2025-12-31'::DATE, true, ARRAY['training', 'audit', 'document'], 5, 'all_transmission', '{}'::JSONB, 'compliant', '2024-12-01'::DATE, '2025-12-01'::DATE, 'Safety Manager', 'Fines and potential shutdown orders', 'Critical')
  ) AS v(
    requirement_code,
    requirement_name,
    description,
    standard_reference,
    regulatory_body,
    jurisdiction,
    requirement_type,
    compliance_category,
    effective_date,
    expiry_date,
    review_frequency_days,
    next_review_date,
    evidence_required,
    evidence_types,
    evidence_retention_years,
    applies_to_scope,
    scope_filter,
    compliance_status,
    last_assessment_date,
    next_assessment_date,
    responsible_role,
    penalty_description,
    risk_level
  )
  ON CONFLICT (org_id, requirement_code)
  DO UPDATE SET
    requirement_name = EXCLUDED.requirement_name,
    description = EXCLUDED.description,
    standard_reference = EXCLUDED.standard_reference,
    regulatory_body = EXCLUDED.regulatory_body,
    jurisdiction = EXCLUDED.jurisdiction,
    requirement_type = EXCLUDED.requirement_type,
    compliance_category = EXCLUDED.compliance_category,
    effective_date = EXCLUDED.effective_date,
    expiry_date = EXCLUDED.expiry_date,
    review_frequency_days = EXCLUDED.review_frequency_days,
    next_review_date = EXCLUDED.next_review_date,
    evidence_required = EXCLUDED.evidence_required,
    evidence_types = EXCLUDED.evidence_types,
    evidence_retention_years = EXCLUDED.evidence_retention_years,
    applies_to_scope = EXCLUDED.applies_to_scope,
    scope_filter = EXCLUDED.scope_filter,
    compliance_status = EXCLUDED.compliance_status,
    last_assessment_date = EXCLUDED.last_assessment_date,
    next_assessment_date = EXCLUDED.next_assessment_date,
    responsible_role = EXCLUDED.responsible_role,
    penalty_description = EXCLUDED.penalty_description,
    risk_level = EXCLUDED.risk_level,
    updated_at = now()
  RETURNING id, requirement_code
)

-- Return counts for verification
SELECT 
  (SELECT COUNT(*) FROM upsert_emission_factors) as emission_factors_count,
  (SELECT COUNT(*) FROM upsert_delivery_context) as delivery_context_count,
  (SELECT COUNT(*) FROM upsert_emissions_snapshots) as emissions_snapshots_count,
  (SELECT COUNT(*) FROM upsert_renewables_contracts) as renewables_contracts_count,
  (SELECT COUNT(*) FROM upsert_compliance_requirements) as compliance_requirements_count;

-- ============================================================================
-- POST-SEED VALIDATION (POSTCHECKS)
-- Fail loudly if expected counts are not met or integrity is violated
-- ============================================================================
DO $$
DECLARE
  v_tenant_id UUID;
  v_emission_factors_count INTEGER;
  v_delivery_context_count INTEGER;
  v_emissions_snapshots_count INTEGER;
  v_renewables_contracts_count INTEGER;
  v_compliance_requirements_count INTEGER;
  v_orphan_emissions INTEGER;
  v_orphan_delivery_context INTEGER;
  v_duplicate_factors INTEGER;
  v_duplicate_contracts INTEGER;
  v_duplicate_requirements INTEGER;
  v_invalid_emissions INTEGER;
  v_missing_default_factors INTEGER;
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE name = 'DEWA - Transmission'
    AND sector = 'power'
    AND subsector = 'transmission'
    AND scenario_tag = 'power_transmission_demo_v1'
  LIMIT 1;
  
  -- Check row counts
  SELECT COUNT(*) INTO v_emission_factors_count
  FROM emission_factors WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_delivery_context_count
  FROM tx_delivery_context WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_emissions_snapshots_count
  FROM energy_emissions_snapshots WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_renewables_contracts_count
  FROM tx_renewables_contracts WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) INTO v_compliance_requirements_count
  FROM tx_compliance_requirements WHERE org_id = v_tenant_id;
  
  -- Validate expected counts
  IF v_emission_factors_count < 6 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 6 emission factors, found %', v_emission_factors_count;
  END IF;
  
  IF v_delivery_context_count < 7 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 7 delivery context records, found %', v_delivery_context_count;
  END IF;
  
  IF v_emissions_snapshots_count < 7 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 7 emissions snapshots, found %', v_emissions_snapshots_count;
  END IF;
  
  IF v_renewables_contracts_count < 5 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 5 renewable contracts, found %', v_renewables_contracts_count;
  END IF;
  
  IF v_compliance_requirements_count < 8 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Expected >= 8 compliance requirements, found %', v_compliance_requirements_count;
  END IF;
  
  -- Check FK integrity (orphaned records)
  SELECT COUNT(*) INTO v_orphan_emissions
  FROM energy_emissions_snapshots es
  WHERE es.org_id = v_tenant_id
    AND NOT EXISTS (SELECT 1 FROM emission_factors ef WHERE ef.id = es.factor_id);
  
  IF v_orphan_emissions > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % orphaned emissions snapshots (missing emission factor reference)', v_orphan_emissions;
  END IF;
  
  -- Check delivery context scope references
  SELECT COUNT(*) INTO v_orphan_delivery_context
  FROM tx_delivery_context dc
  WHERE dc.org_id = v_tenant_id
    AND dc.scope_type = 'substation'
    AND NOT EXISTS (SELECT 1 FROM tx_substations s WHERE s.id = dc.scope_id);
  
  IF v_orphan_delivery_context > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % orphaned delivery context records (missing substation reference)', v_orphan_delivery_context;
  END IF;
  
  -- Check uniqueness constraints
  SELECT COUNT(*) - COUNT(DISTINCT (org_id, factor_code)) INTO v_duplicate_factors
  FROM emission_factors WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) - COUNT(DISTINCT (org_id, contract_code)) INTO v_duplicate_contracts
  FROM tx_renewables_contracts WHERE org_id = v_tenant_id;
  
  SELECT COUNT(*) - COUNT(DISTINCT (org_id, requirement_code)) INTO v_duplicate_requirements
  FROM tx_compliance_requirements WHERE org_id = v_tenant_id;
  
  IF v_duplicate_factors > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % duplicate emission factors (org_id, factor_code) pairs', v_duplicate_factors;
  END IF;
  
  IF v_duplicate_contracts > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % duplicate renewable contracts (org_id, contract_code) pairs', v_duplicate_contracts;
  END IF;
  
  IF v_duplicate_requirements > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % duplicate compliance requirements (org_id, requirement_code) pairs', v_duplicate_requirements;
  END IF;
  
  -- Check business rules
  -- Verify emissions snapshots have valid energy_kwh and co2e_kg
  SELECT COUNT(*) INTO v_invalid_emissions
  FROM energy_emissions_snapshots
  WHERE org_id = v_tenant_id
    AND (energy_kwh < 0 OR co2e_kg < 0);
  
  IF v_invalid_emissions > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Found % emissions snapshots with negative values', v_invalid_emissions;
  END IF;
  
  -- Verify default emission factors exist for key energy types
  SELECT COUNT(*) INTO v_missing_default_factors
  FROM (VALUES ('electricity'), ('gas'), ('diesel'), ('steam')) AS energy_types(energy_type)
  WHERE NOT EXISTS (
    SELECT 1 FROM emission_factors ef
    WHERE ef.org_id = v_tenant_id
      AND ef.energy_type = energy_types.energy_type
      AND ef.default_factor = true
      AND ef.active = true
  );
  
  IF v_missing_default_factors > 0 THEN
    RAISE EXCEPTION 'POSTCHECK FAILED: Missing default emission factors for % energy types', v_missing_default_factors;
  END IF;
  
  RAISE NOTICE 'Seed 011_energy_sustainability_tx.sql OK: emission_factors=%, delivery_context=%, emissions_snapshots=%, renewables_contracts=%, compliance_requirements=%', 
    v_emission_factors_count, v_delivery_context_count, v_emissions_snapshots_count, v_renewables_contracts_count, v_compliance_requirements_count;
END $$;

COMMIT;
