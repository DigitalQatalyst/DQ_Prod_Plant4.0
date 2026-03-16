# Implementation Plan: EMS Power Transmission

## Overview

This implementation plan extends the existing 26 energy management pages with transmission-specific features using sector context switching. Rather than creating new pages, we integrate transmission capabilities into existing pages, allowing users to seamlessly switch between Oil & Gas Upstream and Power Transmission contexts.

The implementation is organized into cycles, with each cycle completing data layer extensions, API contract updates, UI page enhancements, and verification before proceeding to the next.

The implementation uses TypeScript/React for the frontend and Supabase (PostgreSQL + TimescaleDB) for the backend, extending the existing nLVE (Navigate-List-View-Edit) pattern used across all energy management pages.

## Integration Approach

**Key Principles:**
1. **Extend, don't duplicate**: Enhance existing 26 pages rather than creating 26 new pages
2. **Sector context switching**: Use `useApp()` context to determine sector/subsector
3. **Conditional rendering**: Show transmission features when `sector === 'Power' && subsector === 'Transmission'`
4. **Shared components**: Reuse existing EMS components where functionality overlaps
5. **Data provider extension**: Extend existing providers with transmission-specific queries

## Tasks

### Cycle 0: Foundation - Transmission Context and Schema Scaffolding

- [x] 1. Create transmission topology tables and constraints
  - Create migration `20250114000001_energy_tx_foundation.sql`
  - Add tables: tx_substations, tx_bays, tx_feeders, tx_transformers, tx_lines
  - Add unique constraints on natural keys: (org_id, code), (substation_id, feeder_code), etc.
  - Add indexes on foreign keys and frequently filtered columns
  - Add check constraints: from_substation_id ≠ to_substation_id for tx_lines
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ]* 1.1 Write property test for topology uniqueness constraints
  - **Property 1: Substation uniqueness**
  - **Property 2: Feeder uniqueness within substation**
  - **Property 3: Transformer uniqueness within substation**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [ ]* 1.2 Write property test for transmission line endpoint validity
  - **Property 4: Transmission line endpoint validity**
  - **Validates: Requirements 1.4**

- [x] 2. Extend energy_meters table with transmission topology bindings
  - Add nullable foreign keys: substation_id, feeder_id, bay_id, transformer_id
  - Add meter_role column with enum values
  - Add indexes on topology foreign keys and meter_role
  - Add check constraints for role-based topology requirements
  - _Requirements: 1.5, 2.1, 2.2, 2.3_

- [ ]* 2.1 Write property test for meter role topology consistency
  - **Property 5: Meter role topology consistency**
  - **Validates: Requirements 1.5, 2.2, 2.3**

- [x] 3. Create database views and helper functions
  - Create view `v_tx_energy_meter_registry` joining meters with topology and latest telemetry
  - Create function `fn_tx_latest_meter_snapshot(meter_id UUID)` returning latest telemetry + PQ summary
  - Create function `fn_calculate_energy_consumption(meter_id, start_ts, end_ts)` for consumption calculations
  - _Requirements: 1.6, 2.5_

- [x] 4. Create foundation seed data with CTE pattern
  - Create seed `007_energy_tx_foundation.sql`
  - Implement preconditions CTE: validate org exists
  - Implement upserts CTE: idempotent upserts using natural keys
  - Implement postchecks CTE: validate row counts, FK integrity, uniqueness
  - Seed sample substations, feeders, transformers, lines for transmission tenant
  - _Requirements: 1.7, 1.8, 30.2, 30.3, 30.4_

- [ ]* 4.1 Write property test for seed idempotency
  - **Property 6: Seed idempotency**
  - **Property 42: Upsert natural key consistency**
  - **Validates: Requirements 1.7, 30.2, 30.5**

- [ ]* 4.2 Write property test for CTE validation completeness
  - **Property 7: CTE validation completeness**
  - **Validates: Requirements 1.8, 30.4**

- [x] 5. Create TypeScript interfaces for transmission types
  - Define interfaces: TxSubstation, TxFeeder, TxTransformer, TxLine, TxBay
  - Define extended EnergyMeter interface with topology fields
  - Update types file: `src/types/transmission.ts`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1_

- [x] 6. Review and extend data providers with transmission queries
  - Review existing `src/lib/data/providers/TransmissionProvider.ts`
  - Ensure it can be called from existing energy pages
  - Verify: listTxSubstations, getTxSubstation, upsertTxSubstation
  - Verify: listTxFeeders, getTxFeeder, upsertTxFeeder
  - Verify: listTxTransformers, getTxTransformer, upsertTxTransformer
  - Verify: listTxLines, getTxLine, upsertTxLine
  - Verify: listEnergyMetersTxScoped with topology filters
  - Add RLS policy enforcement and error handling if missing
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.7, 27.1_

- [x] 7. Create transmission topology management page (Admin/Config page)
  - Create `src/pages/energy/config/TransmissionTopology.tsx` (single admin page)
  - Implement tabs for: Substations, Feeders, Transformers, Lines
  - Implement nLVE pattern within tabs (List/View/Edit)
  - Implement filters, sorting, pagination for list views
  - Implement relationship displays in view sections
  - Implement forms with validation in edit sections
  - Only visible when sector === 'Power' && subsector === 'Transmission'
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Checkpoint - Foundation verification
  - Verify all topology tables exist with correct constraints
  - Verify meter registry view returns expected columns
  - Verify seed idempotency (run seeds twice, check no duplicates)
  - Verify RLS policies filter by org_id
  - Verify topology management page renders without errors
  - Ensure all tests pass, ask the user if questions arise.


### FS1: Energy Monitoring & Metering (Extend Existing Pages)

- [x] 9. Create monitoring schema extensions
  - Create migration `20250115000001_energy_monitoring_tx.sql`
  - Extend energy_baselines: add baseline_kwh_per_mwh_delivered, baseline_kwh_per_mw_peak, baseline_method
  - Create tx_meter_channels table for multi-channel meters
  - Create tx_power_quality_limits table for voltage-level-specific thresholds
  - Add partial index on power_quality_events(resolved=false)
  - Add exclusion constraint on energy_baselines to prevent overlaps (optional)
  - _Requirements: 4.1, 4.2, 4.3, 6.3, 6.8_

- [ ]* 9.1 Write property test for baseline non-overlap
  - **Property 11: Baseline non-overlap**
  - **Validates: Requirements 4.3**

- [x] 10. Create monitoring seed data
  - Create seed `008_energy_monitoring_tx.sql`
  - Seed energy meters with topology bindings and roles
  - Seed energy_telemetry data for last 30 days
  - Seed energy_baselines for key meters
  - Seed power_quality_limits for voltage levels (132kV, 220kV, 400kV)
  - Seed power_quality_events (some resolved, some unresolved)
  - Seed submeters with parent-child relationships
  - Include preconditions and postchecks
  - _Requirements: 2.1, 4.1, 6.3, 7.1_

- [x] 11. Review and verify monitoring API functions
  - Review existing TransmissionProvider monitoring queries
  - Verify: getRealtimeTelemetry(filters) with latest telemetry batch
  - Verify: getBaselineWithTrends(meter_id, period) with aggregated telemetry
  - Verify: getMultiFluidSummary(filters) grouped by energy_type
  - Verify: getPowerQualityEvents(filters) with resolved filter
  - Verify: getSubmeters(parent_meter_id | feeder_id | asset_id)
  - Verify: upsertBaseline, resolvePQEvent, upsertSubmeter
  - _Requirements: 2.5, 4.4, 5.1, 6.4, 7.2_

- [ ]* 11.1 Write property test for latest telemetry accuracy
  - **Property 10: Latest telemetry accuracy**
  - **Validates: Requirements 2.5**

- [ ]* 11.2 Write property test for meter staleness detection
  - **Property 8: Meter staleness detection**
  - **Validates: Requirements 2.6**

- [x] 12. EXTEND EnergyMonitoringRealTime.tsx with transmission features
  - Open existing `src/pages/energy/EnergyMonitoringRealTime.tsx`
  - Add sector context check: `const isTransmission = sector === 'Power' && subsector === 'Transmission'`
  - When isTransmission: Add columns for Substation, Feeder, Bay, Meter Role
  - When isTransmission: Add filters for substation, feeder, meter_role
  - When isTransmission: Load transmission topology data using TransmissionProvider
  - When !isTransmission: Keep existing upstream behavior
  - Reuse existing: Status highlighting, CSV export, loading/empty/error states
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 3.7_

- [x] 13. EXTEND EnergyMonitoringBaselineTrends.tsx with transmission baselines
  - Open existing `src/pages/energy/EnergyMonitoringBaselineTrends.tsx`
  - When isTransmission: Add transmission-specific baseline metrics (kWh/MWh delivered, kWh/MW peak)
  - When isTransmission: Show substation/feeder context in meter selector
  - When isTransmission: Display transmission baseline method options
  - When !isTransmission: Keep existing upstream baseline metrics
  - Reuse existing: Trend charts, deviation calculations, edit forms
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

- [ ]* 13.1 Write property test for anomaly detection threshold consistency
  - **Property 12: Anomaly detection threshold consistency**
  - **Validates: Requirements 4.5**

- [x] 14. EXTEND EnergyMonitoringMultiFluid.tsx with transmission context
  - Open existing `src/pages/energy/EnergyMonitoringMultiFluid.tsx`
  - When isTransmission: Group by substation/feeder in addition to energy_type
  - When isTransmission: Show grid topology in aggregation views
  - When !isTransmission: Keep existing upstream grouping
  - Reuse existing: Energy type tabs, aggregation logic, normalized views
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 15. EXTEND EnergyMonitoringPowerQuality.tsx with voltage-level thresholds
  - Open existing `src/pages/energy/EnergyMonitoringPowerQuality.tsx`
  - When isTransmission: Add voltage-level-specific threshold display (132kV, 220kV, 400kV)
  - When isTransmission: Show substation/feeder context in PQ events
  - When isTransmission: Load tx_power_quality_limits
  - When !isTransmission: Use default PQ thresholds
  - Reuse existing: PQ time series charts, event list, resolve action
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 6.7_

- [ ]* 15.1 Write property test for PQ event threshold enforcement
  - **Property 13: PQ event threshold enforcement**
  - **Validates: Requirements 6.2, 6.3**

- [ ]* 15.2 Write property test for PQ event resolution tracking
  - **Property 14: PQ event resolution tracking**
  - **Validates: Requirements 6.6**

- [x] 16. EXTEND EnergyMonitoringSubMetering.tsx with feeder-level hierarchy
  - Open existing `src/pages/energy/EnergyMonitoringSubMetering.tsx`
  - When isTransmission: Show feeder-level sub-metering hierarchy
  - When isTransmission: Display substation → feeder → meter hierarchy
  - When !isTransmission: Keep existing asset-based hierarchy
  - Reuse existing: Tree view, consumption comparison, discrepancy flagging
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ]* 16.1 Write property test for sub-meter sum validation
  - **Property 15: Sub-meter sum validation**
  - **Validates: Requirements 7.3**

- [ ]* 16.2 Write property test for sub-meter hierarchy validity
  - **Property 16: Sub-meter hierarchy validity**
  - **Validates: Requirements 7.1, 7.6**

- [x] 17. Checkpoint - Monitoring verification
  - Verify all 5 monitoring pages render correctly for both sectors
  - Verify sector switching works without errors
  - Verify transmission filters work correctly
  - Verify baseline non-overlap constraint
  - Verify PQ event creation and resolution
  - Verify sub-meter validation logicgi
  - Ensure all tests pass, ask the user if questions arise.


### FS6: Energy Alerts (Extend Existing Page)

- [x] 18. Create alerts schema
  - Create migration `2702_energy_alerts_tx.sql`
  - Create energy_alerts table with natural key (source_type, source_id)
  - Add columns: alert_state, severity, assigned_to, ack_at, close_at, sla_due_at, tags, notes
  - Create energy_alert_activity table for audit trail
  - Add check constraint: ack_at >= created_at, close_at >= ack_at
  - Add index on alert_state for filtering open alerts
  - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 19. Create alerts seed data
  - Create seed `2702_seed_energy_alerts_tx.sql`
  - Create alerts for existing unresolved anomalies
  - Create alerts for existing unresolved PQ events
  - Seed some alerts in different states (open, acked, closed)
  - Seed alert activity records
  - Include validation: every unresolved anomaly/event has an alert
  - _Requirements: 8.1, 8.2_

- [x] 20. Create alert summary view
  - Create view `v_energy_alert_summary` joining alerts with anomalies/events and topology
  - Include fields: alert details, detected_at, meter_name, substation_name, feeder_name
  - Optimize for alert list page queries
  - _Requirements: 8.3, 8.9_

- [x] 21. Implement alerts API functions
  - Create AlertsProvider in `src/lib/data/providers/AlertsProvider.ts`
  - Implement: listAlerts(filters) with joins to context
  - Implement: getAlert(id) with full details and activity timeline
  - Implement: acknowledgeAlert(id, user_id)
  - Implement: assignAlert(id, assignee_id)
  - Implement: closeAlert(id, user_id, notes) - restricted to ops role
  - Implement: addAlertNote(id, note, user_id)
  - Implement: bulkAssignAlerts(ids, assignee_id)
  - _Requirements: 8.4, 8.5, 8.7, 8.8, 8.10, 8.11_

- [ ]* 21.1 Write property test for alert state machine validity
  - **Property 17: Alert state machine validity**
  - **Validates: Requirements 8.4, 8.5**

- [ ]* 21.2 Write property test for alert source linkage
  - **Property 18: Alert source linkage**
  - **Validates: Requirements 8.1, 8.2**

- [x] 22. EXTEND EnergyAlerts.tsx with transmission topology context
  - Open existing `src/pages/energy/EnergyAlerts.tsx`
  - When isTransmission: Add columns for Substation, Feeder in alert list
  - When isTransmission: Add filters for substation, feeder
  - When isTransmission: Show transmission topology context in alert details
  - When !isTransmission: Keep existing upstream context (facility, well)
  - Reuse existing: State transitions, bulk actions, SLA highlighting, assignment
  - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11_

- [ ]* 22.1 Write property test for alert filtering correctness
  - **Property 19: Alert filtering correctness**
  - **Validates: Requirements 8.9**

- [x] 23. Checkpoint - Alerts verification
  - Verify alert creation from anomalies and PQ events
  - Verify state transitions work correctly
  - Verify SLA due date calculations
  - Verify RLS enforcement (users only see their org's alerts)
  - Verify permission checks (only ops can close)
  - Ensure all tests pass, ask the user if questions arise.


### FS2: Energy Analytics & KPIs (Extend Remaining Pages)

- [x] 24. Create analytics schema extensions
  - Create migration for energy_kpi_snapshots, energy_benchmarks, energy_recommendations tables
  - Add tx_demand_windows table for utility-specific demand charge windows
  - Add energy_anomalies table for detected anomalies with classification
  - Add indexes and constraints for performance and data integrity
  - _Requirements: 9.1, 9.2, 10.2, 10.3, 11.1, 11.7_

- [x] 25. Create analytics seed data
  - Seed energy_kpi_snapshots for transmission substations and feeders
  - Seed energy_benchmarks for transmission performance comparison
  - Seed tx_demand_windows for transmission tariff structures
  - Seed energy_recommendations for transmission optimization opportunities
  - Seed energy_anomalies for transmission-specific anomaly patterns
  - _Requirements: 9.1, 9.4, 10.2, 11.1_

- [x] 26. EXTEND EnergyAnalyticsEfficiencyKPIs.tsx with transmission KPIs
- [ ] 26. EXTEND EnergyAnalyticsEfficiencyKPIs.tsx with transmission KPIs
  - Open existing `src/pages/energy/EnergyAnalyticsEfficiencyKPIs.tsx`
  - When isTransmission: Add transmission-specific KPIs (losses %, load factor, kWh/MWh delivered)
  - When isTransmission: Show substation/feeder context in KPI calculations
  - When isTransmission: Display grid efficiency metrics and benchmarks
  - When !isTransmission: Keep existing upstream KPIs
  - Reuse existing: KPI cards, trend charts, drill-down functionality
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x]* 26.1 Write property test for KPI snapshot uniqueness
  - **Property 20: KPI snapshot uniqueness**
  - **Validates: Requirements 9.2**

- [x]* 26.2 Write property test for KPI coverage completeness
  - **Property 21: KPI coverage completeness**
  - **Validates: Requirements 9.4**

- [x] 27. EXTEND EnergyAnalyticsLoadProfiling.tsx with substation/feeder profiling
- [ ] 27. EXTEND EnergyAnalyticsLoadProfiling.tsx with substation/feeder profiling
  - Open existing `src/pages/energy/EnergyAnalyticsLoadProfiling.tsx`
  - When isTransmission: Support substation and feeder load profiling
  - When isTransmission: Add demand window configurations for transmission tariffs
  - When isTransmission: Show grid topology context in load profiles
  - When !isTransmission: Keep existing asset-based profiling
  - Reuse existing: Load profile charts, peak identification, clustering
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ]* 27.1 Write property test for load profile aggregation correctness
  - **Property 22: Load profile aggregation correctness**
  - **Validates: Requirements 10.1**

- [ ]* 27.2 Write property test for peak demand identification
  - **Property 23: Peak demand identification**
  - **Validates: Requirements 10.2**

- [x] 28. EXTEND EnergyAnalyticsPeakDemand.tsx with transmission demand management
- [ ] 28. EXTEND EnergyAnalyticsPeakDemand.tsx with transmission demand management
  - Open existing `src/pages/energy/EnergyAnalyticsPeakDemand.tsx`
  - When isTransmission: Add transmission-specific demand charge calculations
  - When isTransmission: Support utility-specific demand windows and ratchet rules
  - When isTransmission: Show substation/feeder demand patterns
  - When !isTransmission: Keep existing upstream demand analysis
  - Reuse existing: Demand charts, cost calculations, optimization recommendations
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 29. EXTEND EnergyAnalyticsWasteDetection.tsx with transmission waste patterns
  - Open existing `src/pages/energy/EnergyAnalyticsWasteDetection.tsx`
  - When isTransmission: Add transmission-specific waste detection (grid losses, off-hours consumption)
  - When isTransmission: Show substation/feeder context in waste analysis
  - When isTransmission: Generate transmission-specific optimization recommendations
  - When !isTransmission: Keep existing upstream waste detection
  - Reuse existing: Waste identification algorithms, recommendation engine, savings calculations
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ]* 29.1 Write property test for recommendation uniqueness
  - **Property 24: Recommendation uniqueness**
  - **Validates: Requirements 11.7**

- [x] 30. EXTEND EnergyAnalyticsAIOptimisation.tsx with transmission AI insights
  - Open existing `src/pages/energy/EnergyAnalyticsAIOptimisation.tsx`
  - When isTransmission: Add AI-driven transmission optimization recommendations
  - When isTransmission: Include grid topology context in AI analysis
  - When isTransmission: Support transmission-specific optimization patterns
  - When !isTransmission: Keep existing upstream AI optimization
  - Reuse existing: AI recommendation engine, confidence scoring, feedback collection
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 31. Checkpoint - Analytics verification
- [ ] 31. Checkpoint - Analytics verification
  - Verify all 5 analytics pages render correctly for both sectors
  - Verify transmission KPI calculations are accurate
  - Verify load profiling works with transmission topology
  - Verify waste detection identifies transmission-specific issues
  - Verify AI recommendations include transmission context
  - Ensure all tests pass, ask the user if questions arise.


### FS4: Energy Control Advisory (Extend Remaining Pages)

- [x] 32. Create control schema extensions
  - Create migration for controllable_loads, generation_assets, demand_response_events tables
  - Add asset_modes, mode_recommendations, efficiency_curves tables
  - Add tx_control_integrations, tx_load_shedding_plans tables
  - Add indexes and constraints for performance and data integrity
  - _Requirements: 13.1, 14.1, 15.1, 16.1, 17.1_

- [x] 33. Create control seed data
  - Seed controllable_loads for transmission equipment (transformers, capacitor banks)
  - Seed demand_response_events for transmission DR scenarios
  - Seed asset_modes for transmission equipment operational modes
  - Seed tx_control_integrations for SCADA/EMS/DERMS systems
  - Seed efficiency_curves for transmission equipment
  - _Requirements: 13.1, 14.1, 16.1, 17.1_

- [x] 34. EXTEND EnergyControlAssetModes.tsx with transmission equipment modes
- [ ] 34. EXTEND EnergyControlAssetModes.tsx with transmission equipment modes
  - Open existing `src/pages/energy/EnergyControlAssetModes.tsx`
  - When isTransmission: Add controllable transmission equipment (transformer tap changers, capacitor banks)
  - When isTransmission: Show substation/feeder context for controllable loads
  - When isTransmission: Support transmission-specific operational modes
  - When !isTransmission: Keep existing upstream asset modes
  - Reuse existing: Mode management, control constraints, mode recommendations
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [ ]* 34.1 Write property test for asset mode validity
  - **Property 27: Asset mode validity**
  - **Validates: Requirements 13.3**

- [x] 35. EXTEND EnergyControlDemandResponse.tsx with transmission DR events
  - Open existing `src/pages/energy/EnergyControlDemandResponse.tsx`
  - When isTransmission: Support transmission-specific demand response events
  - When isTransmission: Show substation/feeder context in DR planning
  - When isTransmission: Validate transmission load shedding constraints
  - When !isTransmission: Keep existing upstream DR management
  - Reuse existing: DR event planning, load validation, performance tracking
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

- [ ]* 35.1 Write property test for DR event load validation
  - **Property 25: DR event load validation**
  - **Validates: Requirements 14.2**

- [ ]* 35.2 Write property test for DR event constraint enforcement
  - **Property 26: DR event constraint enforcement**
  - **Validates: Requirements 14.3**

- [x] 36. EXTEND EnergyControlLoadBalancing.tsx with feeder load balancing
  - Open existing `src/pages/energy/EnergyControlLoadBalancing.tsx`
  - When isTransmission: Add feeder and transformer load balancing recommendations
  - When isTransmission: Show grid topology context in load balancing analysis
  - When isTransmission: Validate feeder capacity constraints
  - When !isTransmission: Keep existing upstream load balancing
  - Reuse existing: Load balancing algorithms, capacity validation, advisory recommendations
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [ ]* 36.1 Write property test for load balancing capacity validation
  - **Property 28: Load balancing capacity validation**
  - **Validates: Requirements 15.3**

- [x] 37. EXTEND EnergyControlIntegration.tsx with SCADA/EMS/DERMS integrations
  - Open existing `src/pages/energy/EnergyControlIntegration.tsx`
  - When isTransmission: Add transmission control system integrations (SCADA, EMS, DERMS)
  - When isTransmission: Show integration status for transmission protocols (IEC 61850, DNP3, OPC UA)
  - When isTransmission: Support transmission-specific integration monitoring
  - When !isTransmission: Keep existing upstream integrations
  - Reuse existing: Integration status monitoring, connectivity testing, error handling
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 38. EXTEND EnergyControlEfficiencyCurves.tsx with transformer efficiency curves
  - Open existing `src/pages/energy/EnergyControlEfficiencyCurves.tsx`
  - When isTransmission: Add transformer efficiency curves and performance benchmarking
  - When isTransmission: Show substation/transformer context in efficiency analysis
  - When isTransmission: Generate transmission-specific efficiency recommendations
  - When !isTransmission: Keep existing upstream efficiency curves
  - Reuse existing: Efficiency curve management, performance comparison, optimization recommendations
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [x] 39. Checkpoint - Control verification
- [ ] 39. Checkpoint - Control verification
  - Verify all 5 control pages render correctly for both sectors
  - Verify transmission equipment modes work correctly
  - Verify DR events validate transmission constraints
  - Verify load balancing considers feeder capacities
  - Verify control system integrations show transmission protocols
  - Ensure all tests pass, ask the user if questions arise.


### FS3: Sustainability & Emissions (Extend Remaining Pages)

- [x] 40. Create sustainability schema extensions
  - Create migration for emission_factors, tx_delivery_context, energy_emissions_snapshots tables
  - Add tx_renewables_contracts, tx_compliance_requirements, tx_compliance_evidence tables
  - Add report_templates, export_jobs tables for ESG reporting
  - Add indexes and constraints for performance and data integrity
  - _Requirements: 18.1, 19.1, 20.1, 21.1, 22.1_

- [x] 41. Create sustainability seed data
  - Seed emission_factors for transmission energy types with effective dates
  - Seed tx_delivery_context for transmission grid delivery metrics
  - Seed energy_emissions_snapshots for transmission substations/feeders
  - Seed tx_renewables_contracts for grid-connected renewable assets
  - Seed tx_compliance_requirements for transmission regulations
  - _Requirements: 18.1, 19.1, 20.1, 21.1_

- [x] 42. EXTEND EnergySustainabilityCarbonCalculation.tsx with transmission delivery context
- [ ] 42. EXTEND EnergySustainabilityCarbonCalculation.tsx with transmission delivery context
  - Open existing `src/pages/energy/EnergySustainabilityCarbonCalculation.tsx`
  - When isTransmission: Add transmission delivery context (MWh delivered, losses, interchange)
  - When isTransmission: Calculate emissions per MWh delivered for transmission efficiency
  - When isTransmission: Show substation/feeder context in emissions calculations
  - When !isTransmission: Keep existing upstream emissions calculations
  - Reuse existing: Emission factor management, calculation engine, reporting
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

- [ ]* 42.1 Write property test for emission factor temporal validity
  - **Property 29: Emission factor temporal validity**
  - **Validates: Requirements 18.2**

- [ ]* 42.2 Write property test for emissions snapshot uniqueness
  - **Property 30: Emissions snapshot uniqueness**
  - **Validates: Requirements 18.3**

- [x] 43. EXTEND EnergySustainabilityEnergyIntensity.tsx with transmission intensity metrics
  - Open existing `src/pages/energy/EnergySustainabilityEnergyIntensity.tsx`
  - When isTransmission: Add transmission-specific intensity metrics (kgCO2e per MWh delivered, losses %)
  - When isTransmission: Show grid topology context in intensity analysis
  - When isTransmission: Track transmission system performance over time
  - When !isTransmission: Keep existing upstream intensity metrics
  - Reuse existing: Intensity calculations, trend analysis, target tracking
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ]* 43.1 Write property test for energy intensity calculation correctness
  - **Property 31: Energy intensity calculation correctness**
  - **Validates: Requirements 19.2**

- [x] 44. EXTEND EnergySustainabilityRenewables.tsx with grid-connected renewables
  - Open existing `src/pages/energy/EnergySustainabilityRenewables.tsx`
  - When isTransmission: Add grid-connected renewable energy tracking
  - When isTransmission: Support PPA and REC management for transmission operations
  - When isTransmission: Show substation/feeder context for renewable integration
  - When !isTransmission: Keep existing upstream renewables tracking
  - Reuse existing: Renewable asset management, contract tracking, percentage calculations
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

- [ ]* 44.1 Write property test for renewable percentage calculation
  - **Property 32: Renewable percentage calculation**
  - **Validates: Requirements 20.3**

- [x] 45. EXTEND EnergySustainabilityCompliance.tsx with transmission regulations
  - Open existing `src/pages/energy/EnergySustainabilityCompliance.tsx`
  - When isTransmission: Add transmission-specific compliance requirements and regulations
  - When isTransmission: Support transmission compliance evidence management
  - When isTransmission: Show grid topology context in compliance tracking
  - When !isTransmission: Keep existing upstream compliance management
  - Reuse existing: Compliance requirement management, evidence linking, audit reporting
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6_

- [x] 46. EXTEND EnergySustainabilityESGReporting.tsx with transmission ESG metrics
  - Open existing `src/pages/energy/EnergySustainabilityESGReporting.tsx`
  - When isTransmission: Include transmission-specific ESG metrics in reports
  - When isTransmission: Support transmission ESG report templates
  - When isTransmission: Show grid performance in ESG context
  - When !isTransmission: Keep existing upstream ESG reporting
  - Reuse existing: Report template management, data aggregation, export functionality
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_

- [x] 47. Checkpoint - Sustainability verification
  - Verify all 5 sustainability pages render correctly for both sectors
  - Verify transmission emissions calculations include delivery context
  - Verify energy intensity metrics are transmission-specific
  - Verify renewable tracking works with grid-connected assets
  - Verify compliance management includes transmission regulations
  - Ensure all tests pass, ask the user if questions arise.


### FS5: Energy Dashboards & Reporting (Extend Remaining Pages)

- [x] 48. Create dashboards schema extensions
  - Create migration for dashboard_definitions, dashboard_favorites tables
  - Extend export_jobs table for transmission-specific exports
  - Add energy_tariffs table for transmission tariff structures
  - Add indexes and constraints for performance and data integrity
  - _Requirements: 23.1, 24.1, 25.1, 26.1_

- [x] 49. Create dashboards seed data
  - Seed dashboard_definitions for transmission-specific dashboard templates
  - Seed energy_tariffs for transmission demand charges and rate structures
  - Seed export_jobs examples for transmission reporting
  - _Requirements: 23.1, 24.1, 25.1_

- [x] 50. EXTEND EnergyDashboard.tsx with transmission grid KPIs
- [ ] 50. EXTEND EnergyDashboard.tsx with transmission grid KPIs
  - Open existing `src/pages/energy/EnergyDashboard.tsx`
  - When isTransmission: Add transmission-specific KPI tiles (grid losses, load factor, system efficiency)
  - When isTransmission: Show substation/feeder performance summaries
  - When isTransmission: Display transmission grid topology overview
  - When !isTransmission: Keep existing upstream dashboard KPIs
  - Reuse existing: KPI tile components, trend charts, drill-down navigation
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_

- [x] 51. EXTEND EnergyDashboardsAnomalies.tsx with transmission anomaly types
  - Open existing `src/pages/energy/EnergyDashboardsAnomalies.tsx`
  - When isTransmission: Add transmission-specific anomaly types (grid losses, voltage deviations, load imbalances)
  - When isTransmission: Show substation/feeder context in anomaly summaries
  - When isTransmission: Support transmission anomaly investigation workflows
  - When !isTransmission: Keep existing upstream anomaly dashboards
  - Reuse existing: Anomaly detection algorithms, visualization components, investigation tools
  - _Requirements: 23.2, 23.3_

- [x] 52. EXTEND EnergyDashboardsCostAnalysis.tsx with transmission tariff structures
  - Open existing `src/pages/energy/EnergyDashboardsCostAnalysis.tsx`
  - When isTransmission: Add transmission-specific tariff structures and demand charges
  - When isTransmission: Show substation/feeder cost breakdowns
  - When isTransmission: Support transmission cost optimization analysis
  - When !isTransmission: Keep existing upstream cost analysis
  - Reuse existing: Cost calculation engine, tariff management, optimization recommendations
  - _Requirements: 23.4_

- [x] 53. EXTEND EnergyDashboardsCustom.tsx with transmission topology widgets
  - Open existing `src/pages/energy/EnergyDashboardsCustom.tsx`
  - When isTransmission: Enable transmission topology widgets (substation status, feeder loads, grid overview)
  - When isTransmission: Support transmission-specific widget configurations
  - When isTransmission: Validate transmission data access in custom widgets
  - When !isTransmission: Keep existing upstream custom widgets
  - Reuse existing: Widget builder, dashboard designer, data source validation
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7_

- [ ]* 53.1 Write property test for dashboard widget query whitelist enforcement
  - **Property 33: Dashboard widget query whitelist enforcement**
  - **Validates: Requirements 24.2**

- [ ]* 53.2 Write property test for dashboard definition versioning
  - **Property 34: Dashboard definition versioning**
  - **Validates: Requirements 24.4**

- [x] 54. EXTEND EnergyDashboardsPeriodComparison.tsx with transmission metrics
  - Open existing `src/pages/energy/EnergyDashboardsPeriodComparison.tsx`
  - When isTransmission: Support transmission metrics in period comparisons
  - When isTransmission: Show substation/feeder performance over time
  - When isTransmission: Normalize transmission metrics for different period lengths
  - When !isTransmission: Keep existing upstream period comparisons
  - Reuse existing: Period comparison logic, normalization algorithms, variance calculations
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6_

- [ ]* 54.1 Write property test for period comparison normalization
  - **Property 36: Period comparison normalization**
  - **Validates: Requirements 25.5**

- [x] 55. EXTEND EnergyDashboardsAuditReports.tsx with transmission compliance reports
  - Open existing `src/pages/energy/EnergyDashboardsAuditReports.tsx`
  - When isTransmission: Include transmission compliance reports and audit documentation
  - When isTransmission: Support transmission-specific audit report templates
  - When isTransmission: Show grid topology context in audit reports
  - When !isTransmission: Keep existing upstream audit reports
  - Reuse existing: Report generation engine, template management, export functionality
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6_

- [ ]* 55.1 Write property test for export job status tracking
  - **Property 35: Export job status tracking**
  - **Validates: Requirements 26.3**

- [x] 56. Checkpoint - Dashboards verification
  - Verify all 6 dashboard pages render correctly for both sectors
  - Verify transmission KPIs display correctly on main dashboard
  - Verify custom dashboard builder supports transmission widgets
  - Verify period comparisons work with transmission metrics
  - Verify audit reports include transmission compliance data
  - Ensure all tests pass, ask the user if questions arise.


### Final Integration and Testing

- [x] 57. Create comprehensive integration tests
  - Test end-to-end workflows: telemetry → anomaly → alert → resolution
  - Test sector switching across all 26 pages
  - Test data consistency between transmission and upstream contexts
  - Test RLS enforcement across all transmission tables
  - Test performance with realistic data volumes
  - _Requirements: 27.1, 27.2, 28.1, 28.2, 29.1, 29.2, 29.3, 29.4_

- [ ]* 57.1 Write property test for RLS org isolation
  - **Property 37: RLS org isolation**
  - **Validates: Requirements 27.1**

- [ ]* 57.2 Write property test for RLS site filtering
  - **Property 38: RLS site filtering**
  - **Validates: Requirements 27.2**

- [ ]* 57.3 Write property test for telemetry timestamp validity
  - **Property 39: Telemetry timestamp validity**
  - **Validates: Requirements 28.1**

- [ ]* 57.4 Write property test for orphan detection
  - **Property 40: Orphan detection**
  - **Validates: Requirements 28.2, 28.8**

- [x] 58. Performance optimization and validation
  - Optimize database queries for transmission topology joins
  - Validate query performance meets latency targets
  - Implement caching for frequently accessed transmission data
  - Test concurrent user load with transmission features
  - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7_

- [x] 59. Final checkpoint - Complete system verification
  - Verify all 26 energy pages work correctly for both sectors
  - Verify all transmission features integrate seamlessly
  - Verify performance meets requirements under load
  - Verify all property tests pass
  - Verify comprehensive test coverage
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each feature set
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation extends existing 26 pages rather than creating new ones
- **COMPLETED:** Foundation (Cycle 0), Monitoring (FS1), and Alerts (FS6) with full database schemas and UI extensions
- **REMAINING:** Analytics (FS2), Control (FS4), Sustainability (FS3), and Dashboards (FS5) need both database schemas AND UI extensions
- **KEY INSIGHT:** Each remaining feature set needs 2 schema tasks + 5-6 UI extension tasks + 1 checkpoint
- **CRITICAL:** Schema and seed tasks must be completed BEFORE UI extension tasks to provide the transmission data
- Focus on completing one feature set at a time: schema → seed → UI extensions → checkpoint