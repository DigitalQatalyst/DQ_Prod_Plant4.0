# Implementation Plan: APM Power Transmission

## Overview

This implementation plan breaks down the APM Power Transmission feature area into sequential, testable tasks organized by feature set. Each feature set is completed end-to-end (Data → API → UI → Tests) before proceeding to the next.

The implementation follows this sequence:
1. **FS4: Asset Inventory & Criticality** (Foundation) - ✅ COMPLETED
2. **FS1: Asset Health & Diagnostics** (Monitoring)
3. **FS3: Asset Performance & Utilisation** (Performance)
4. **FS2: Predictive & Prescriptive Maintenance** (Predictive)
5. **FS5: Alerts, Reports & Visualisation** (Capstone)

## Tasks

### Feature Set 4: Asset Inventory & Criticality ✅ COMPLETED

- [x] 1. Create FS4 schema pack structure
- [x] 2. Implement FS4 migration script
- [x] 3. Implement FS4 seed script
- [x] 4. Implement FS4 validation script
- [ ] 5. Execute and verify FS4 schema pack
- [x] 6. Implement FS4 TypeScript interfaces
- [x] 7. Implement FS4 API query hooks
- [x] 8. Implement FS4 UI pages (nLVE pattern)
- [x] 9. Add FS4 navigation routes
- [x] 10. Fix FS4 navigation integration
  - Remove incorrect separate "APM Transmission" section from navigation
  - Ensure all FS4 features are integrated into existing Monitor section
  - Update paths to use `/monitor/inventory-criticality/*` pattern
  - Verify all transmission features extend existing Monitor feature sets
  - _Requirements: 29.1, 29.2_
- [x] 12. FS4 Checkpoint

**Status**: FS4 is functionally complete but has a navigation integration issue that needs fixing. The features were incorrectly placed in a separate "APM Transmission" section instead of extending the existing Monitor section.


### Feature Set 1: Asset Health & Diagnostics

- [x] 13. Create FS1 schema pack structure
  - Create directory `apm_tx_fs1_health_diagnostics/`
  - Create placeholder files: `001_migration.sql`, `002_seed.sql`, `003_validate.sql`
  - _Requirements: 6.1-6.10, 7.1-7.10, 8.1-8.8, 9.1-9.9, 10.1-10.6, 11.1-11.6_

- [x] 14. Implement FS1 migration script
  - [x] 14.1 Extend telemetry_parameters table
    - Add columns: parameter_role, warning_min, warning_max, critical_min, critical_max
    - Add check constraint for parameter_role values
    - Create index on (parameter_type, name)
    - _Requirements: 6.6, 6.7_
  
  - [x] 14.2 Create asset_parameter_map table
    - Columns: id, asset_type, parameter_id, is_required, sampling_interval_seconds, created_at
    - Unique constraint on (asset_type, parameter_id)
    - Foreign key to telemetry_parameters
    - Index on asset_type
    - _Requirements: 6.8, 6.9_
  
  - [x] 14.3 Ensure telemetry_data hypertable exists
    - Verify TimescaleDB extension
    - Verify hypertable partitioning on timestamp
    - Add index on (asset_id, parameter_id, timestamp DESC)
    - _Requirements: 7.1, 28.4_
  
  - [x] 14.4 Create health_models table
    - Columns: id, asset_type, model_version, parameter_weights (JSONB), computation_method, created_at
    - Unique constraint on (asset_type, model_version)
    - _Requirements: 8.2, 8.3_
  
  - [x] 14.5 Create health_scores table
    - Columns: id, asset_id, score, computed_at, model_version, component_breakdown (JSONB)
    - Check constraint: score >= 0 AND score <= 100
    - Primary key on (asset_id, computed_at)
    - Index on (asset_id, computed_at DESC)
    - _Requirements: 8.1, 8.4, 8.5_
  
  - [x] 14.6 Create diagnostic_events table
    - Columns: id, asset_id, event_type, title, description, confidence, detected_at, state, acknowledged_by, acknowledged_at, closed_by, closed_at, resolution_notes, telemetry_window_start, telemetry_window_end, created_at
    - Check constraints for event_type, state, confidence (0-100)
    - Indexes on (asset_id, detected_at DESC), (state, detected_at DESC)
    - _Requirements: 9.1-9.9_
  
  - [x] 14.7 Create rca_records table
    - Columns: id, event_id, root_cause, contributing_factors, corrective_actions, preventive_actions, created_by, created_at
    - Foreign key to diagnostic_events or downtime_events
    - _Requirements: 10.1-10.6_

- [x] 15. Implement FS1 seed script
  - [x] 15.1 Seed asset_parameter_map
    - Map transformer parameters to power_transformer asset_type (at least 10)
    - Map breaker parameters to circuit_breaker asset_type (at least 10)
    - Map line parameters to transmission_line asset_type (at least 10)
    - Map relay parameters to protection_relay asset_type (at least 10)
    - _Requirements: 6.9, 6.10_
  
  - [x] 15.2 Seed health models
    - Insert health model for power_transformer with parameter weights
    - Insert health model for circuit_breaker with parameter weights
    - Insert health model for transmission_line with parameter weights
    - _Requirements: 8.2_
  
  - [x] 15.3 Seed sample telemetry data
    - Insert telemetry for online assets (last 7 days)
    - Include variety of Normal, Warning, Critical statuses
    - _Requirements: 7.10, 30.3_
  
  - [x] 15.4 Seed diagnostic events
    - Insert sample thermal, electrical, mechanical events
    - Include variety of states (open, ack, closed)
    - Link to telemetry windows
    - _Requirements: 9.1-9.5_
  
  - [x] 15.5 Seed RCA records
    - Link RCA records to closed diagnostic events
    - _Requirements: 10.1, 10.2_

- [x] 16. Implement FS1 validation script
  - [x] 16.1 Validate parameter mappings complete
    - Check each transmission asset_type has >= 10 mapped parameters
    - Query should return 0 rows (missing types)
    - _Requirements: 6.10_
  
  - [x] 16.2 Validate telemetry exists for online assets
    - Check online assets have telemetry within expected intervals
    - _Requirements: 7.10_
  
  - [x] 16.3 Validate health score bounds
    - Check all health_scores have score between 0 and 100
    - Query should return 0 rows
    - _Requirements: 8.1_
  
  - [x] 16.4 Validate diagnostic event states
    - Check closed events have resolution_notes
    - Check state transitions are valid
    - _Requirements: 9.8_
  
  - [x] 16.5 Validate RCA linkages
    - Check all rca_records link to valid events
    - Query should return 0 rows
    - _Requirements: 10.3_

- [x] 17. Execute and verify FS1 schema pack
  - Run migration, seed, validate scripts
  - Verify idempotency and zero validation failures
  - _Requirements: 26.1-26.6, 27.10_

- [x] 18. Implement FS1 API query hooks
  - [x] 18.1 Implement useLatestTelemetry hook
    - Fetch latest readings for asset across all mapped parameters
    - Return with status classification
    - _Requirements: 7.6_
  
  - [x] 18.2 Implement useTelemetrySeries hook
    - Support time range, parameters, aggregation interval
    - Handle 30-day windows with acceptable performance
    - _Requirements: 7.7, 7.8, 28.2_
  
  - [x] 18.3 Implement useHealthScore hook
    - Fetch health score with breakdown
    - Support historical queries
    - _Requirements: 8.5, 8.6_
  
  - [x] 18.4 Implement useDiagnosticEvents hook
    - Support filters: asset_id, asset_type, event_type, state, time_range
    - _Requirements: 9.6_
  
  - [x] 18.5 Implement diagnostic event mutations
    - Acknowledge event mutation
    - Close event mutation with resolution_notes
    - Restrict to authorized roles
    - _Requirements: 9.7, 9.8, 9.9_

- [-] 19. Enhance FS1 UI pages with real functionality
  - [x] 19.1 Enhance Condition Monitoring page (/monitor/health-diagnostics/condition-monitoring)
    - Replace shell implementation with real telemetry data integration
    - Asset selector (left pane) with real asset data
    - KPI grid by asset type with live telemetry
    - Real-time telemetry display with status chips
    - _Requirements: 7.1-7.10_
  
  - [x] 19.2 Enhance Health Scoring page (/monitor/health-diagnostics/health-scoring)
    - Replace shell implementation with real health score computation
    - Overall health score gauge with real data
    - Component breakdown chart from health models
    - Contributing factors list from telemetry
    - Historical health trend with time series data
    - _Requirements: 8.1-8.8_
  
  - [x] 19.3 Enhance Anomaly Detection page (/monitor/health-diagnostics/anomaly-detection)
    - Replace shell implementation with real diagnostic events
    - Anomalies list with severity, confidence, parameter, asset, detected time
    - Filters: asset type, severity, time range, event type
    - Drill-down telemetry chart window
    - _Requirements: 9.1-9.6_
  
  - [x] 19.4 Enhance Root Cause Diagnostics page (/monitor/health-diagnostics/root-cause)
    - Replace shell implementation with real RCA functionality
    - Diagnostic events list with real data
    - RCA record view with linked downtime
    - Recommended checks from FMEA integration
    - Event state transitions (ack/close) with permission checks
    - _Requirements: 9.7-9.9, 10.1-10.6_
  
  - [x] 19.5 Enhance Degradation Trends page (/monitor/health-diagnostics/degradation-trends)
    - Replace shell implementation with real trend analysis
    - Parameter selector with real telemetry parameters
    - Degradation slope visualization from time series
    - Rolling statistics computation
    - Threshold crossing projections
    - _Requirements: 11.1-11.6_

- [ ]* 20. Write property tests for FS1
  - [ ]* 20.1 Property 9: Telemetry Status Classification
    - **Property 9: Telemetry Status Classification**
    - **Validates: Requirements 7.3, 7.4, 7.5**
  
  - [ ]* 20.2 Property 10: Health Score Bounds
    - **Property 10: Health Score Bounds**
    - **Validates: Requirements 8.1**
  
  - [ ]* 20.3 Property 11: Diagnostic Event State Transitions
    - **Property 11: Diagnostic Event State Transitions**
    - **Validates: Requirements 9.4, 9.7, 9.8**
  
  - [ ]* 20.4 Property 12: Diagnostic Event Resolution Notes Required
    - **Property 12: Diagnostic Event Resolution Notes Required**
    - **Validates: Requirements 9.8**
  
  - [ ]* 20.5 Property 13: RCA Event Linkage Validity
    - **Property 13: RCA Event Linkage Validity**
    - **Validates: Requirements 10.3**
  
  - [ ]* 20.6 Property 14: Parameter Mapping Completeness
    - **Property 14: Parameter Mapping Completeness**
    - **Validates: Requirements 6.10**

- [ ]* 21. Write unit tests for FS1
  - Test telemetry status classification logic
  - Test health score computation
  - Test diagnostic event state transitions
  - Test UI components for all 5 pages
  - _Requirements: 7.3-7.5, 8.1, 9.4_

- [x] 22. FS1 Checkpoint
  - Ensure all tests pass
  - Verify all 5 pages render correctly with seeded data
  - Confirm telemetry queries perform within targets
  - Ask user if questions arise

### Feature Set 3: Asset Performance & Utilisation

- [x] 23. Create FS3 schema pack structure
  - Create directory `apm_tx_fs3_performance_utilisation/`
  - Create placeholder files: `001_migration.sql`, `002_seed.sql`, `003_validate.sql`
  - _Requirements: 12.1-12.9, 13.1-13.7, 14.1-14.7, 15.1-15.7_

- [x] 24. Implement FS3 migration script
  - [x] 24.1 Extend downtime_events table
    - Add columns: grid_impact_mw, protection_trip_code, outage_scope
    - Add check constraint for outage_scope values
    - Add check constraint for duration consistency
    - Index on (asset_id, start_time DESC), (event_type, start_time DESC)
    - _Requirements: 12.3, 12.4, 12.5, 12.6_
  
  - [x] 24.2 Create reliability_metrics table
    - Columns: id, asset_id, period_start, period_end, mtbf_hours, mttr_hours, availability_percent, failure_count, total_downtime_minutes, computed_at
    - Unique constraint on (asset_id, period_start, period_end)
    - Index on (asset_id, period_start DESC)
    - _Requirements: 13.1-13.7_
  
  - [x] 24.3 Create utilisation_metrics table
    - Columns: id, asset_id, period_start, period_end, load_factor, peak_current, thermal_headroom, switching_cycles, computed_at
    - Index on (asset_id, period_start DESC)
    - _Requirements: 14.1-14.7_
  
  - [x] 24.4 Create performance_deviations table
    - Columns: id, asset_id, deviation_type, magnitude, detected_at, telemetry_window_start, telemetry_window_end, benchmark_reference, created_at
    - Index on (asset_id, detected_at DESC)
    - _Requirements: 15.4, 15.5_
  
  - [x] 24.5 Ensure performance_benchmarks table exists
    - Verify baseline table or create
    - Columns: id, asset_type, sector, availability_target, load_factor_target, mtbf_target, created_at
    - _Requirements: 15.1, 15.2_

- [x] 25. Implement FS3 seed script
  - [x] 25.1 Seed downtime events
    - Insert planned maintenance events
    - Insert unplanned failure events
    - Insert forced outage events
    - Include variety of outage_scope values
    - Ensure no overlapping periods per asset
    - _Requirements: 12.1-12.9, 30.4_
  
  - [x] 25.2 Seed reliability metrics
    - Compute and insert reliability metrics for seeded assets
    - Cover multiple time periods
    - Ensure non-overlapping periods
    - _Requirements: 13.1-13.7_
  
  - [x] 25.3 Seed performance benchmarks
    - Insert benchmarks for each transmission asset_type
    - Set realistic targets for availability, load_factor, MTBF
    - _Requirements: 15.1, 15.2, 30.7_
  
  - [x] 25.4 Seed utilisation metrics
    - Insert utilisation data for transformers (with thermal_headroom)
    - Insert utilisation data for breakers (with switching_cycles)
    - _Requirements: 14.1-14.7_
  
  - [x] 25.5 Seed performance deviations
    - Insert deviation records for assets below benchmarks
    - Link to telemetry windows and benchmark references
    - _Requirements: 15.4, 15.5_

- [x] 26. Implement FS3 validation script
  - [x] 26.1 Validate downtime duration consistency
    - Check duration_minutes equals (end_time - start_time) in minutes
    - Query should return 0 rows
    - _Requirements: 12.6, 27.7_
  
  - [x] 26.2 Validate downtime non-overlap
    - Check no overlapping downtime periods per asset
    - Query should return 0 rows
    - _Requirements: 12.9_
  
  - [x] 26.3 Validate reliability period non-overlap
    - Check no overlapping reliability_metrics periods per asset
    - Query should return 0 rows
    - _Requirements: 13.6, 27.8_
  
  - [x] 26.4 Validate MTBF/MTTR/Availability calculations
    - Spot-check computed metrics against source data
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 27. Execute and verify FS3 schema pack
  - Run migration, seed, validate scripts
  - Verify idempotency and zero validation failures
  - _Requirements: 26.1-26.6, 27.10_

- [x] 28. Implement FS3 API query hooks
  - [x] 28.1 Implement useDowntimeEvents hook
    - Support filters: asset_id, event_type, time_range, outage_scope
    - _Requirements: 12.7_
  
  - [x] 28.2 Implement useReliabilityMetrics hook
    - Support configurable time periods
    - _Requirements: 13.5, 13.7_
  
  - [x] 28.3 Implement useUtilisationMetrics hook
    - Support asset_id and time_range filters
    - _Requirements: 14.6_
  
  - [x] 28.4 Implement usePerformanceBenchmarks hook
    - Query by asset_type or sector
    - _Requirements: 15.2_
  
  - [x] 28.5 Implement usePerformanceDeviations hook
    - Support filters: asset_type, deviation_magnitude, time_range
    - _Requirements: 15.6_

- [x] 29. Enhance FS3 UI pages with real functionality
  - [x] 29.1 Enhance Uptime/Downtime page (/monitor/performance-utilisation/uptime-tracking)
    - Replace shell implementation with real downtime data
    - Outage events table with filters
    - Outage details view with production/grid impact
    - Linked diagnostics from RCA records
    - _Requirements: 12.1-12.9_
  
  - [x] 29.2 Enhance Reliability KPIs page (/monitor/performance-utilisation/arm-kpis)
    - Replace shell implementation with real reliability metrics
    - KPI tiles: MTBF, MTTR, Availability with trends
    - Time period selector
    - Asset comparison view
    - _Requirements: 13.1-13.7_
  
  - [x] 29.3 Enhance Utilisation page (/monitor/performance-utilisation/utilisation-monitoring)
    - Replace shell implementation with real utilisation data
    - Load curves vs rating limits
    - Thermal headroom indicators
    - Breaker operations count
    - _Requirements: 14.1-14.7_
  
  - [x] 29.4 Enhance Performance Deviations page (/monitor/performance-utilisation/deviation-detection)
    - Replace shell implementation with real deviation data
    - Deviations list with magnitude and asset
    - Filters: asset_type, deviation_magnitude, time_range
    - _Requirements: 15.4-15.6_
  
  - [x] 29.5 Enhance Benchmarking page (/monitor/performance-utilisation/benchmarking)
    - Replace shell implementation with real benchmark data
    - Actual vs target comparison charts
    - Benchmark definitions table
    - Edit benchmarks (admin only)
    - _Requirements: 15.1-15.7_

- [ ]* 30. Write property tests for FS3
  - [ ]* 30.1 Property 15: Downtime Duration Consistency
    - **Property 15: Downtime Duration Consistency**
    - **Validates: Requirements 12.6**
  
  - [ ]* 30.2 Property 16: Downtime Time Ordering
    - **Property 16: Downtime Time Ordering**
    - **Validates: Requirements 12.5**
  
  - [ ]* 30.3 Property 17: Downtime Non-Overlap
    - **Property 17: Downtime Non-Overlap**
    - **Validates: Requirements 12.9**
  
  - [ ]* 30.4 Property 18: MTBF Calculation
    - **Property 18: MTBF Calculation**
    - **Validates: Requirements 13.1**
  
  - [ ]* 30.5 Property 19: Availability Calculation
    - **Property 19: Availability Calculation**
    - **Validates: Requirements 13.3**
  
  - [ ]* 30.6 Property 20: Load Factor Calculation
    - **Property 20: Load Factor Calculation**
    - **Validates: Requirements 14.2**
  
  - [ ]* 30.7 Property 21: Thermal Headroom Calculation
    - **Property 21: Thermal Headroom Calculation**
    - **Validates: Requirements 14.3**
  
  - [ ]* 30.8 Property 22: Reliability Period Non-Overlap
    - **Property 22: Reliability Period Non-Overlap**
    - **Validates: Requirements 13.6**

- [ ]* 31. Write unit tests for FS3
  - Test downtime event creation and validation
  - Test reliability metrics computation
  - Test utilisation metrics computation
  - Test UI components for all 5 pages
  - _Requirements: 12.5, 12.6, 13.1-13.3, 14.2, 14.3_

- [x] 32. FS3 Checkpoint
  - Ensure all tests pass
  - Verify all 5 pages render correctly with seeded data
  - Confirm reliability calculations are accurate
  - Ask user if questions arise

### Feature Set 2: Predictive & Prescriptive Maintenance

- [x] 33. Create FS2 schema pack structure
  - Create directory `apm_tx_fs2_predictive_prescriptive/`
  - Create placeholder files: `001_migration.sql`, `002_seed.sql`, `003_validate.sql`
  - _Requirements: 16.1-16.7, 17.1-17.7, 18.1-18.8, 19.1-19.7_

- [x] 34. Implement FS2 migration script
  - [x] 34.1 Create failure_predictions table
    - Columns: id, asset_id, prediction_date, failure_probability, confidence, time_horizon_days, risk_level, rul_days, contributing_factors, created_at
    - Check constraints for failure_probability (0-100), confidence (0-100), time_horizon_days (7, 30, 90), risk_level values
    - Indexes on (asset_id, prediction_date DESC), (risk_level, prediction_date DESC)
    - _Requirements: 16.1-16.7_
  
  - [x] 34.2 Create cbm_triggers table
    - Columns: id, name, parameter_id, condition_operator, threshold_value, recommended_action, is_active, created_at, updated_at
    - Check constraint for condition_operator values
    - Index on parameter_id WHERE is_active = true
    - _Requirements: 17.1-17.7_
  
  - [x] 34.3 Create maintenance_recommendations table
    - Columns: id, asset_id, recommendation_type, description, priority_score, due_date, required_spares (UUID[]), source_trigger_id, status, completion_notes, created_at, updated_at
    - Check constraints for recommendation_type, status, priority_score (0-100)
    - Indexes on (asset_id, priority_score DESC), (status, due_date)
    - _Requirements: 18.1-18.8_
  
  - [x] 34.4 Create risk_scoring_model table
    - Columns: id, sector, criticality_weight, health_weight, failure_probability_weight, performance_deviation_weight, created_at
    - Unique constraint on sector
    - _Requirements: 19.1, 19.2_

- [x] 35. Implement FS2 seed script
  - [x] 35.1 Seed failure predictions
    - Insert predictions for transformers (insulation degradation)
    - Insert predictions for breakers (mechanism wear)
    - Include variety of risk levels and time horizons
    - Link to contributing health indicators
    - _Requirements: 16.1-16.7_
  
  - [x] 35.2 Seed CBM triggers
    - Insert trigger for SF6 density critical threshold
    - Insert trigger for transformer oil temp warning
    - Insert trigger for DGA gas rate of change
    - _Requirements: 17.1-17.7_
  
  - [x] 35.3 Seed maintenance recommendations
    - Insert recommendations from CBM triggers
    - Insert recommendations from failure predictions
    - Link to required spare parts
    - Include variety of priority scores and statuses
    - _Requirements: 18.1-18.8_
  
  - [x] 35.4 Seed risk scoring model
    - Insert risk model for power_transmission sector
    - Set reasonable weights for criticality, health, failure probability, performance deviations
    - _Requirements: 19.1, 19.2_

- [x] 36. Implement FS2 validation script
  - [x] 36.1 Validate failure prediction bounds
    - Check failure_probability and confidence are 0-100
    - Check time_horizon_days is 7, 30, or 90
    - Check risk_level is valid
    - Query should return 0 rows
    - _Requirements: 16.1, 16.2, 16.3_
  
  - [x] 36.2 Validate CBM trigger operators
    - Check condition_operator is valid
    - Query should return 0 rows
    - _Requirements: 17.2_
  
  - [x] 36.3 Validate recommendation references
    - Check asset_id references exist
    - Check required_spares reference valid spare parts
    - Query should return 0 rows
    - _Requirements: 18.5_
  
  - [x] 36.4 Validate recommendation closure notes
    - Check completed/cancelled recommendations have completion_notes
    - Query should return 0 rows
    - _Requirements: 18.8_

- [x] 37. Execute and verify FS2 schema pack
  - Run migration, seed, validate scripts
  - Verify idempotency and zero validation failures
  - _Requirements: 26.1-26.6, 27.10_

- [x] 38. Implement FS2 API query hooks
  - [x] 38.1 Implement useFailurePredictions hook
    - Support filters: asset_id, risk_level, time_horizon
    - _Requirements: 16.6_
  
  - [x] 38.2 Implement useCBMTriggers hook
    - Support filters: asset_type, parameter
    - _Requirements: 17.5_
  
  - [x] 38.3 Implement useMaintenanceRecommendations hook
    - Support filters: asset_id, priority_score, due_date, status
    - _Requirements: 18.6_
  
  - [x] 38.4 Implement recommendation mutations
    - Acknowledge recommendation
    - Schedule recommendation
    - Close recommendation with completion_notes
    - Restrict to authorized roles
    - _Requirements: 18.7, 18.8_

- [x] 39. Enhance FS2 UI pages with real functionality
  - [x] 39.1 Enhance Failure Predictions page (/monitor/predictive-maintenance/failure-prediction)
    - Replace shell implementation with real prediction data
    - Risk cards with horizon probabilities
    - Filters: asset, risk_level, time_horizon
    - Contributing factors drill-down
    - _Requirements: 16.1-16.7_
  
  - [x] 39.2 Enhance RUL Estimation page (/monitor/predictive-maintenance/rul-estimation)
    - Replace shell implementation with real RUL data
    - RUL trend chart with confidence bands
    - Critical components list
    - Flagged assets (RUL below threshold)
    - _Requirements: 16.4, 16.7_
  
  - [x] 39.3 Enhance CBM Triggers page (/monitor/predictive-maintenance/cbm-triggers)
    - Replace shell implementation with real trigger data
    - Trigger rules list
    - Edit trigger form (admin only)
    - Trigger history and firing events
    - _Requirements: 17.1-17.7_
  
  - [x] 39.4 Enhance Maintenance Recommendations page (/monitor/predictive-maintenance/recommendations)
    - Replace shell implementation with real recommendation data
    - Recommended actions list
    - Required spares display
    - Priority score sorting
    - Acknowledge/schedule/close actions
    - _Requirements: 18.1-18.8_
  
  - [x] 39.5 Enhance Priority Scoring page (/monitor/predictive-maintenance/priority-scoring)
    - Replace shell implementation with real risk scoring
    - Ranked maintenance backlog
    - Risk score breakdown
    - Edit risk scoring model (admin only)
    - _Requirements: 19.1-19.7_

- [ ]* 40. Write property tests for FS2
  - [ ]* 40.1 Property 23: Failure Probability Bounds
    - **Property 23: Failure Probability Bounds**
    - **Validates: Requirements 16.1**
  
  - [ ]* 40.2 Property 24: Prediction Confidence Bounds
    - **Property 24: Prediction Confidence Bounds**
    - **Validates: Requirements 16.1**
  
  - [ ]* 40.3 Property 25: Prediction Horizon Validity
    - **Property 25: Prediction Horizon Validity**
    - **Validates: Requirements 16.2**
  
  - [ ]* 40.4 Property 26: Risk Level Classification
    - **Property 26: Risk Level Classification**
    - **Validates: Requirements 16.3**
  
  - [ ]* 40.5 Property 27: CBM Trigger Condition Operator Validity
    - **Property 27: CBM Trigger Condition Operator Validity**
    - **Validates: Requirements 17.2**
  
  - [ ]* 40.6 Property 28: Recommendation Priority Score Bounds
    - **Property 28: Recommendation Priority Score Bounds**
    - **Validates: Requirements 18.3**
  
  - [ ]* 40.7 Property 29: Recommendation Asset Validity
    - **Property 29: Recommendation Asset Validity**
    - **Validates: Requirements 18.5**
  
  - [ ]* 40.8 Property 30: Recommendation Spare Parts Validity
    - **Property 30: Recommendation Spare Parts Validity**
    - **Validates: Requirements 18.5**
  
  - [ ]* 40.9 Property 31: Recommendation Closure Notes Required
    - **Property 31: Recommendation Closure Notes Required**
    - **Validates: Requirements 18.8**

- [ ]* 41. Write unit tests for FS2
  - Test failure prediction generation
  - Test CBM trigger evaluation
  - Test recommendation priority scoring
  - Test UI components for all 5 pages
  - _Requirements: 16.1-16.3, 17.2, 18.3, 18.5, 18.8_

- [x] 42. FS2 Checkpoint
  - Ensure all tests pass
  - Verify all 5 pages render correctly with seeded data
  - Confirm CBM triggers fire correctly
  - Ask user if questions arise

### Feature Set 5: Alerts, Reports & Visualisation

- [x] 43. Create FS5 schema pack structure
  - Create directory `apm_tx_fs5_alerts_reports/`
  - Create placeholder files: `001_migration.sql`, `002_seed.sql`, `003_validate.sql`
  - _Requirements: 20.1-20.9, 21.1-21.6, 22.1-22.7, 23.1-23.7, 24.1-24.8_

- [x] 44. Implement FS5 migration script
  - [x] 44.1 Create alerts table
    - Columns: id, asset_id, alert_type, severity, source, message, detected_at, state, acknowledged_by, acknowledged_at, closed_by, closed_at, resolution_notes, source_event_id, created_at
    - Check constraints for severity, source, state
    - Indexes on (asset_id, detected_at DESC), (severity, state, detected_at DESC)
    - _Requirements: 20.1-20.9_
  
  - [x] 44.2 Create alert_history table
    - Columns: id, alert_id, previous_state, new_state, changed_by, changed_at, notes
    - Foreign key to alerts with CASCADE delete
    - Index on (alert_id, changed_at DESC)
    - _Requirements: 21.4, 21.5, 21.6_
  
  - [x] 44.3 Create dashboards table
    - Columns: id, name, description, owner, layout_config (JSONB), created_at, updated_at
    - _Requirements: 22.1, 22.5_
  
  - [x] 44.4 Create dashboard_widgets table
    - Columns: id, dashboard_id, widget_type, query_template_ref, position, config (JSONB), created_at
    - Foreign key to dashboards with CASCADE delete
    - Check constraint for widget_type values
    - _Requirements: 22.2, 22.4_
  
  - [x] 44.5 Create report_runs table
    - Columns: id, report_type, execution_time, status, output_location, asset_scope (JSONB), created_by, created_at
    - Check constraint for report_type values
    - Index on (created_by, execution_time DESC)
    - _Requirements: 23.1, 23.3, 23.4_
  
  - [x] 44.6 Create export_jobs table
    - Columns: id, user_id, query_reference, format, status, output_location, created_at, completed_at
    - Check constraints for format, status
    - Index on (user_id, created_at DESC)
    - _Requirements: 24.2, 24.3, 24.4, 24.5_

- [x] 45. Implement FS5 seed script
  - [x] 45.1 Seed alerts
    - Insert alerts from telemetry threshold violations
    - Insert alerts from diagnostic events
    - Insert alerts from failure predictions
    - Include variety of severities and states
    - _Requirements: 20.1-20.9_
  
  - [x] 45.2 Seed alert history
    - Insert state transition records for alerts
    - _Requirements: 21.5_
  
  - [x] 45.3 Seed sample dashboards
    - Insert reliability manager dashboard
    - Insert operations engineer dashboard
    - Link widgets to query templates
    - _Requirements: 22.1-22.7_
  
  - [x] 45.4 Seed report runs
    - Insert sample report execution records
    - _Requirements: 23.3, 23.4_

- [-] 46. Implement FS5 validation script
  - [x] 46.1 Validate alert severity and source
    - Check severity and source are valid values
    - Query should return 0 rows
    - _Requirements: 20.2_
  
  - [x] 46.2 Validate alert closure notes
    - Check closed alerts have resolution_notes
    - Query should return 0 rows
    - _Requirements: 20.8_
  
  - [x] 46.3 Validate alert history transitions
    - Check alert state changes have corresponding history records
    - _Requirements: 21.5_
  
  - [x] 46.4 Validate dashboard widget references
    - Check all widget query_template_ref are valid
    - Query should return 0 rows
    - _Requirements: 22.7_
  
  - [x] 46.5 Validate export job states
    - Check status is valid value
    - Query should return 0 rows
    - _Requirements: 24.4_

- [x] 47. Execute and verify FS5 schema pack
  - Run migration, seed, validate scripts
  - Verify idempotency and zero validation failures
  - _Requirements: 26.1-26.6, 27.10_

- [x] 48. Implement FS5 API query hooks
  - [x] 48.1 Implement useAlerts hook
    - Support filters: asset_id, severity, state, time_range
    - _Requirements: 20.6_
  
  - [x] 48.2 Implement alert mutations
    - Acknowledge alert mutation
    - Close alert mutation with resolution_notes
    - Restrict to authorized roles
    - _Requirements: 20.7, 20.8_
  
  - [x] 48.3 Implement useAlertTimeline hook
    - Unified timeline combining alerts, diagnostic_events, downtime_events
    - Support filters: asset_id, event_type, time_range
    - Sort chronologically
    - _Requirements: 21.1, 21.2, 21.3_
  
  - [x] 48.4 Implement useDashboards hook
    - List user's dashboards
    - Load dashboard with widget queries
    - _Requirements: 22.3, 22.5_
  
  - [x] 48.5 Implement dashboard mutations
    - Create/update/delete dashboard
    - Validate widget query references
    - _Requirements: 22.5, 22.7_
  
  - [x] 48.6 Implement useReportRuns hook
    - List report execution history
    - _Requirements: 23.4_
  
  - [x] 48.7 Implement report generation mutation
    - Trigger report generation
    - Handle failures with error logging
    - _Requirements: 23.3, 23.7_
  
  - [x] 48.8 Implement useExportJobs hook
    - List user's export jobs with status
    - _Requirements: 24.5, 24.6_
  
  - [x] 48.9 Implement export mutation
    - Create export job
    - Enforce data access permissions
    - Process large exports asynchronously
    - _Requirements: 24.3, 24.7, 24.8_

- [x] 49. Enhance FS5 UI pages with real functionality
  - [x] 49.1 Enhance Alerts page (/monitor/alerts-reports/realtime-alerts)
    - Replace shell implementation with real alert data
    - Real-time alerts list with severity filtering
    - Acknowledge/close actions
    - Alert details with source event linkage
    - _Requirements: 20.1-20.9_
  
  - [x] 49.2 Enhance Alert Timeline page (/monitor/alerts-reports/alert-history)
    - Replace shell implementation with real timeline data
    - Unified timeline view
    - Filters: asset_id, event_type, time_range
    - Event details drill-down
    - _Requirements: 21.1-21.6_
  
  - [x] 49.3 Enhance Dashboards page (/monitor/alerts-reports/custom-dashboards)
    - Replace shell implementation with real dashboard functionality
    - Dashboard list
    - Dashboard builder UI
    - Widget configuration
    - Save/share dashboards
    - _Requirements: 22.1-22.7_
  
  - [x] 49.4 Enhance Reports page (/monitor/alerts-reports/reliability-reports)
    - Replace shell implementation with real report functionality
    - Report type selector
    - Asset scope configuration
    - Schedule configuration
    - Report run history
    - _Requirements: 23.1-23.7_
  
  - [x] 49.5 Enhance Export Center page (/monitor/alerts-reports/data-export)
    - Replace shell implementation with real export functionality
    - Export data selector
    - Format selector (CSV, JSON, Excel)
    - Export job status tracking
    - Download completed exports
    - _Requirements: 24.1-24.8_

- [ ]* 50. Write property tests for FS5
  - [ ]* 50.1 Property 32: Alert Severity Validity
    - **Property 32: Alert Severity Validity**
    - **Validates: Requirements 20.2**
  
  - [ ]* 50.2 Property 33: Alert Source Validity
    - **Property 33: Alert Source Validity**
    - **Validates: Requirements 20.1**
  
  - [ ]* 50.3 Property 34: Alert State Transitions
    - **Property 34: Alert State Transitions**
    - **Validates: Requirements 20.4, 20.7, 20.8**
  
  - [ ]* 50.4 Property 35: Alert Closure Notes Required
    - **Property 35: Alert Closure Notes Required**
    - **Validates: Requirements 20.8**
  
  - [ ]* 50.5 Property 36: Alert History State Transition Recording
    - **Property 36: Alert History State Transition Recording**
    - **Validates: Requirements 21.5**
  
  - [ ]* 50.6 Property 37: Export Job State Validity
    - **Property 37: Export Job State Validity**
    - **Validates: Requirements 24.4**
  
  - [ ]* 50.7 Property 38: Dashboard Widget Query Validity
    - **Property 38: Dashboard Widget Query Validity**
    - **Validates: Requirements 22.7**

- [ ]* 51. Write unit tests for FS5
  - Test alert generation and state transitions
  - Test timeline query and sorting
  - Test dashboard widget rendering
  - Test report generation
  - Test export job creation
  - Test UI components for all 5 pages
  - _Requirements: 20.2, 20.4, 20.8, 21.3, 21.5, 22.7, 24.4_

- [x] 52. FS5 Checkpoint
  - Ensure all tests pass
  - Verify all 5 pages render correctly with seeded data
  - Confirm alerts generate in real-time
  - Ask user if questions arise

### Cross-Cutting Tasks

- [x] 53. Ensure adherence to existing sector/subsector filtering
  - [x] 53.1 Validate existing tenant context usage
    - Ensure all APM queries use existing tenant context
    - Verify RLS policies are respected
    - Test with DEWA transmission tenant data
    - _Requirements: 31.1, 31.2, 31.3_
  
  - [x] 53.2 Map to existing asset types
    - Use existing asset type codes (TRANSFORMER, BREAKER, BAY, METER)
    - Filter queries by transmission-relevant asset types
    - Respect existing asset type structure
    - _Requirements: 31.4_
  
  - [x] 53.3 Integrate with existing grid topology
    - Use existing grid_nodes and grid_lines tables
    - Respect existing tenant_id filtering
    - Leverage existing site relationships
    - _Requirements: 31.5_
  
  - [x] 53.4 Use existing telemetry structure
    - Work with existing telemetry_points and tags tables
    - Respect existing tenant isolation through asset relationships
    - Use existing protocol and address mappings
    - _Requirements: 31.6_
  
  - [x] 53.5 Handle empty states for tenants without transmission data
    - Display appropriate messages when no assets exist
    - Provide guidance for contacting administrators
    - Maintain consistent UX across all feature sets
    - _Requirements: 31.8_
  
  - [x] 53.6 Validate tenant data consistency
    - Ensure working with power/transmission sector tenants
    - Validate existing DEWA tenant structure
    - Handle cases where tenant doesn't have transmission data
    - _Requirements: 31.9, 31.10_

- [x] 54. Fix navigation integration across all feature sets
  - Remove incorrect "APM Transmission" section from navigation
  - Ensure all transmission features properly extend existing Monitor feature sets
  - Update all paths to follow `/monitor/{feature-set}/{feature}` pattern
  - Verify sector/subsector filtering works correctly
  - _Requirements: 29.1, 29.2_

- [ ]* 55. Write cross-cutting property tests
  - [ ]* 55.1 Property 39: Sector Enforcement for Transmission Assets
    - **Property 39: Sector Enforcement for Transmission Assets**
    - **Validates: Requirements 1.2, 25.7**
  
  - [ ]* 55.2 Property 40: Natural Key Uniqueness - Assets
    - **Property 40: Natural Key Uniqueness - Assets**
    - **Validates: Requirements 27.2**
  
  - [ ]* 55.3 Property 41: Natural Key Uniqueness - FMEA
    - **Property 41: Natural Key Uniqueness - FMEA**
    - **Validates: Requirements 3.2**
  
  - [ ]* 55.4 Property 42: Foreign Key Referential Integrity
    - **Property 42: Foreign Key Referential Integrity**
    - **Validates: Requirements 27.3**
  
  - [ ]* 55.5 Property 43: Timestamp Ordering in Time Series
    - **Property 43: Timestamp Ordering in Time Series**
    - **Validates: Requirements 4.6, 7.7, 21.3**
  
  - [ ]* 55.6 Property 44: Pagination Consistency
    - **Property 44: Pagination Consistency**
    - **Validates: Requirements 1.10, 28.6**
  
  - [ ]* 55.7 Property 45: RLS Sector Filtering
    - **Property 45: RLS Sector Filtering**
    - **Validates: Requirements 25.2, 25.5**
  
  - [ ]* 55.8 Property 46: Existing Tenant Context Adherence
    - **Property 46: Existing Tenant Context Adherence**
    - **Validates: Requirements 31.1, 31.3**

- [x] 56. Implement RLS policies
  - [ ] 55. Implement RLS policies
  - [x] 55.1 Enable RLS on all APM tables
    - Assets, telemetry_data, diagnostic_events, alerts, etc.
    - _Requirements: 25.1_
  
  - [x] 55.2 Create read policies
    - Authenticated users can read transmission assets
    - Filter by sector and role permissions
    - _Requirements: 25.2, 25.3_
  
  - [x] 55.3 Create write policies
    - Restrict to authorized roles (apm_admin, reliability_engineer, maintenance_planner, operations_engineer)
    - Prevent cross-sector tampering
    - _Requirements: 25.4, 25.5, 25.6_
  
  - [x] 55.4 Add audit logging
    - Log all write operations
    - _Requirements: 25.8_

- [x] 56. Performance optimization
  - [x] 56.1 Verify asset list query performance
    - Test with filters and pagination
    - Confirm < 300ms target
    - _Requirements: 1.10, 28.1_
  
  - [x] 56.2 Verify telemetry query performance
    - Test 30-day window queries
    - Confirm acceptable performance
    - _Requirements: 7.8, 28.2_
  
  - [x] 56.3 Add health score caching
    - Implement caching with configurable TTL
    - _Requirements: 28.5_
  
  - [x] 56.4 Verify all indexes are in place
    - Review query plans for slow queries
    - Add missing indexes
    - _Requirements: 28.3_

- [x] 57. Final integration testing
  - Test end-to-end workflows across all feature sets
  - Test RLS enforcement across all tables
  - Test error handling and recovery
  - Test UI navigation and consistency
  - _Requirements: 25.1-25.8, 29.1-29.8_

- [x] 58. Documentation and handoff
  - Document API query contracts
  - Document schema pack execution order
  - Document RLS policies and roles
  - Document testing procedures
  - Create user guide for nLVE navigation

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All schema packs must be idempotent and include validation scripts
- RLS policies must be tested for both read and write operations
- Performance targets must be verified with realistic data volumes
- **FS4 is functionally complete** but has navigation integration issues that need fixing
- **CRITICAL**: Navigation currently has incorrect "APM Transmission" section - must integrate into existing Monitor section
- UI pages for FS1-FS5 exist as shell implementations and need to be enhanced with real functionality

