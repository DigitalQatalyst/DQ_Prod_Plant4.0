# Requirements Document: APM Power Transmission

## Introduction

This specification defines the Asset Performance Management (APM) feature area for the Power Transmission sector within the Plant4.0 platform. The system will provide comprehensive asset health monitoring, predictive maintenance, performance tracking, and criticality management for transmission infrastructure including transformers, circuit breakers, transmission lines, substations, and protection equipment.

The implementation follows a feature-set-based rollout across five major capability areas, building incrementally from asset inventory through health diagnostics, performance monitoring, predictive maintenance, and culminating in alerts and reporting capabilities.

## Glossary

- **APM_System**: The Asset Performance Management system for Power Transmission
- **Asset_Registry**: The centralized database of transmission assets with hierarchy and relationships
- **Telemetry_Engine**: The system component that collects, stores, and processes time-series sensor data
- **Health_Index**: A computed score (0-100) representing overall asset condition based on multiple parameters
- **RUL**: Remaining Useful Life - estimated time until asset failure or end of service
- **FMEA**: Failure Mode and Effects Analysis - systematic method for identifying potential failures
- **RPN**: Risk Priority Number - calculated as Severity × Occurrence × Detection (1-1000 scale)
- **CBM**: Condition-Based Maintenance - maintenance triggered by asset condition thresholds
- **RCA**: Root Cause Analysis - investigation process to identify underlying failure causes
- **nLVE**: Navigate → List → View → Edit - the standard UI interaction pattern
- **RLS**: Row Level Security - Supabase security mechanism for data access control
- **DGA**: Dissolved Gas Analysis - diagnostic technique for transformer oil condition
- **SF6**: Sulfur Hexafluoride - insulating gas used in circuit breakers
- **OLTC**: On-Load Tap Changer - voltage regulation mechanism in transformers
- **CT**: Current Transformer - instrument transformer for current measurement
- **VT**: Voltage Transformer - instrument transformer for voltage measurement
- **IED**: Intelligent Electronic Device - microprocessor-based protection/control device
- **RTU**: Remote Terminal Unit - device for remote monitoring and control
- **SCADA**: Supervisory Control and Data Acquisition system
- **Criticality_Tier**: Asset importance classification (Critical/Important/Standard)
- **Lifecycle_Stage**: Current phase in asset lifecycle (design/procure/install/commission/operate/maintain/refurbish/retire)
- **Downtime_Event**: Period when an asset is unavailable for service
- **MTBF**: Mean Time Between Failures - average operational time between failures
- **MTTR**: Mean Time To Repair - average time to restore asset to service
- **Availability**: Percentage of time asset is operational (uptime / total time)

## Requirements

### Requirement 1: Asset Registry and Hierarchy Management

**User Story:** As a reliability engineer, I want to maintain a comprehensive registry of transmission assets with hierarchical relationships, so that I can understand asset dependencies and manage the complete transmission infrastructure.

#### Acceptance Criteria

1. THE APM_System SHALL support transmission asset types including power_transformer, circuit_breaker, disconnect_switch, busbar, transmission_line, line_terminal, substation_bay, protection_relay, ct, vt, surge_arrester, reactor, capacitor_bank, station_battery, charger, scada_rtu, plc_ied, and meter
2. WHEN an asset is created, THE APM_System SHALL enforce sector='power_transmission' for all transmission assets
3. THE APM_System SHALL support parent-child hierarchical relationships between assets
4. WHEN an asset references a parent asset, THE APM_System SHALL validate that the parent asset exists
5. THE APM_System SHALL store asset metadata including asset_tag, location, voltage_kv, commissioning_date, operational_status, and lifecycle_stage
6. THE APM_System SHALL support asset relationships including connected_to, feeds_to, protects, and in_bay relationship types
7. WHEN an asset relationship is created, THE APM_System SHALL enforce uniqueness on (from_asset_id, to_asset_id, relation_type)
8. THE APM_System SHALL prevent orphan relationships where referenced assets do not exist
9. WHEN querying assets, THE APM_System SHALL support filtering by sector, asset_type, operational_status, location, and text search
10. THE APM_System SHALL return asset lists with pagination, sorting, and performance under 300ms for seeded datasets

### Requirement 2: Asset Criticality and Risk Scoring

**User Story:** As a maintenance planner, I want to classify assets by criticality and risk level, so that I can prioritize maintenance activities and resource allocation effectively.

#### Acceptance Criteria

1. THE APM_System SHALL support criticality tiers: Critical, Important, and Standard
2. THE APM_System SHALL store criticality scoring models with configurable weights for safety, production impact, environmental impact, and detectability factors
3. WHEN computing asset criticality, THE APM_System SHALL apply sector-specific scoring models
4. THE APM_System SHALL assign a criticality tier to every transmission asset
5. WHEN an asset is classified as Critical or Important, THE APM_System SHALL ensure a criticality score has been computed
6. THE APM_System SHALL allow authorized users to update criticality models
7. WHEN criticality models are updated, THE APM_System SHALL recalculate affected asset criticality scores

### Requirement 3: FMEA Library Management

**User Story:** As a reliability engineer, I want to maintain a library of failure modes for each transmission asset type, so that I can systematically assess and mitigate potential failures.

#### Acceptance Criteria

1. THE APM_System SHALL store FMEA entries with asset_type, failure_mode, failure_cause, failure_effect, severity, occurrence, detection, and recommended_actions
2. THE APM_System SHALL enforce uniqueness on (asset_type, failure_mode) for FMEA entries
3. THE APM_System SHALL validate severity, occurrence, and detection values are integers between 1 and 10
4. THE APM_System SHALL compute RPN as severity × occurrence × detection
5. WHEN querying FMEA entries, THE APM_System SHALL support filtering by asset_type, minimum RPN threshold, and text search
6. THE APM_System SHALL provide FMEA coverage for all transmission asset types
7. WHEN an asset is viewed, THE APM_System SHALL display applicable FMEA entries ranked by RPN

### Requirement 4: Asset Lifecycle Tracking

**User Story:** As an asset manager, I want to track lifecycle stages and transitions for each asset, so that I can manage asset aging and plan for replacements.

#### Acceptance Criteria

1. THE APM_System SHALL support lifecycle stages: design, procure, install, commission, operate, maintain, refurbish, and retire
2. THE APM_System SHALL store the current lifecycle_stage for each asset
3. THE APM_System SHALL record lifecycle transition events with timestamp, stage, and notes
4. WHEN a lifecycle event is recorded, THE APM_System SHALL validate the new stage is a valid lifecycle stage
5. THE APM_System SHALL maintain an audit trail of all lifecycle transitions
6. WHEN querying lifecycle events, THE APM_System SHALL return events in chronological order

### Requirement 5: Spare Parts Linkage

**User Story:** As a maintenance planner, I want to link critical spare parts to asset types and specific assets, so that I can ensure parts availability for maintenance activities.

#### Acceptance Criteria

1. THE APM_System SHALL store spare parts with part_number, description, applicable_asset_types, lead_time_days, on_hand_quantity, reorder_point, and unit_cost
2. THE APM_System SHALL support linking spare parts to asset types or specific assets
3. WHEN linking a spare part, THE APM_System SHALL store quantity_required and is_critical flag
4. THE APM_System SHALL enforce uniqueness on spare part linkages per asset or asset_type
5. WHEN an asset is viewed, THE APM_System SHALL display linked spare parts with critical spares highlighted
6. THE APM_System SHALL support querying spare parts by asset_type or specific asset_id
7. WHEN spare part quantity_required is specified, THE APM_System SHALL validate it is non-negative

### Requirement 6: Transmission Telemetry Parameter Library

**User Story:** As a condition monitoring engineer, I want a comprehensive library of transmission-specific telemetry parameters with thresholds, so that I can monitor asset health effectively.

#### Acceptance Criteria

1. THE APM_System SHALL support transformer parameters including top_oil_temp, winding_hot_spot, load_current, dga_h2, dga_ch4, dga_c2h2, moisture_ppm, bushing_power_factor, oltc_operations_count, vibration, and cooling_fan_status
2. THE APM_System SHALL support breaker parameters including sf6_pressure, sf6_density, contact_wear_percent, operation_count, trip_coil_current, mechanism_time, and partial_discharge
3. THE APM_System SHALL support line parameters including conductor_temp, sag_estimate, wind_speed, current, fault_indicator_status, and lightning_counter
4. THE APM_System SHALL support relay parameters including trip_events, self_test_status, comms_latency, goose_status, and time_sync_offset
5. THE APM_System SHALL support substation environment parameters including ambient_temp, humidity, intrusion_door_status, smoke_fire_alarm, and dc_bus_voltage
6. THE APM_System SHALL store parameter thresholds with warning_min, warning_max, critical_min, and critical_max values
7. THE APM_System SHALL classify each parameter with a parameter_role: health_driver, diagnostic, or context
8. THE APM_System SHALL map parameters to applicable asset_types through an asset_parameter_map
9. WHEN an asset_type is queried, THE APM_System SHALL return all mapped telemetry parameters
10. THE APM_System SHALL ensure each transmission asset_type has at least 10 mapped parameters

### Requirement 7: Real-Time Condition Monitoring

**User Story:** As an operations engineer, I want to monitor real-time telemetry data for transmission assets, so that I can detect abnormal conditions and respond quickly.

#### Acceptance Criteria

1. WHEN telemetry data is received, THE APM_System SHALL store timestamp, asset_id, parameter_id, value, unit, and quality_score
2. THE APM_System SHALL evaluate telemetry values against parameter thresholds
3. WHEN a telemetry value exceeds warning thresholds, THE APM_System SHALL classify status as Warning
4. WHEN a telemetry value exceeds critical thresholds, THE APM_System SHALL classify status as Critical
5. WHEN a telemetry value is within thresholds, THE APM_System SHALL classify status as Normal
6. THE APM_System SHALL retrieve latest telemetry for an asset across all mapped parameters
7. THE APM_System SHALL retrieve telemetry time series with specified time range, parameters, and aggregation interval
8. WHEN querying telemetry for 30-day windows, THE APM_System SHALL return results with acceptable performance
9. THE APM_System SHALL support telemetry queries for multiple parameters simultaneously
10. WHEN an asset is online, THE APM_System SHALL ensure latest telemetry exists within expected intervals

### Requirement 8: Asset Health Scoring

**User Story:** As a reliability engineer, I want computed health scores for each asset based on multiple condition indicators, so that I can prioritize assets requiring attention.

#### Acceptance Criteria

1. THE APM_System SHALL compute a health_index score (0-100) for each asset
2. THE APM_System SHALL store health scoring models per asset_type with parameter weights
3. WHEN computing health scores, THE APM_System SHALL apply asset_type-specific weighting models
4. THE APM_System SHALL provide health score breakdown by component or parameter contribution
5. WHEN a health score is requested, THE APM_System SHALL return the score with timestamp and contributing factors
6. THE APM_System SHALL support historical health score queries with time range
7. WHEN health model weights are updated, THE APM_System SHALL allow recalculation of affected health scores
8. THE APM_System SHALL restrict health model updates to authorized roles

### Requirement 9: Anomaly and Fault Detection

**User Story:** As a condition monitoring engineer, I want automated detection of anomalies and faults in telemetry data, so that I can investigate potential issues proactively.

#### Acceptance Criteria

1. THE APM_System SHALL create diagnostic events when anomalies or faults are detected
2. THE APM_System SHALL classify diagnostic events by event_type: thermal, electrical, mechanical, insulation, or comms
3. THE APM_System SHALL store diagnostic events with asset_id, title, confidence (0-100), detected_at, and state
4. THE APM_System SHALL support diagnostic event states: open, ack (acknowledged), and closed
5. WHEN a diagnostic event is created, THE APM_System SHALL link the telemetry window that triggered detection
6. THE APM_System SHALL support querying diagnostic events with filters for asset_type, severity, time_range, and event_type
7. WHEN a diagnostic event is acknowledged, THE APM_System SHALL record the acknowledging user and timestamp
8. WHEN a diagnostic event is closed, THE APM_System SHALL require resolution_notes
9. THE APM_System SHALL restrict event state transitions to authorized operations roles

### Requirement 10: Root Cause Analysis Records

**User Story:** As a reliability engineer, I want to document root cause analysis findings for diagnostic events and failures, so that I can prevent recurrence and improve reliability.

#### Acceptance Criteria

1. THE APM_System SHALL store RCA records linked to diagnostic events or downtime events
2. THE APM_System SHALL store RCA fields including root_cause, contributing_factors, corrective_actions, and preventive_actions
3. WHEN an RCA record is created, THE APM_System SHALL validate it links to a valid event
4. THE APM_System SHALL support querying RCA records by asset, event_type, or time_range
5. WHEN a diagnostic event is viewed, THE APM_System SHALL display linked RCA records
6. THE APM_System SHALL allow authorized engineers to create and update RCA records

### Requirement 11: Degradation Trend Analysis

**User Story:** As a predictive maintenance engineer, I want to analyze degradation trends in asset parameters over time, so that I can forecast when intervention is needed.

#### Acceptance Criteria

1. THE APM_System SHALL compute degradation trends for specified parameters over configurable time horizons
2. THE APM_System SHALL calculate trend metrics including slope, rate_of_change, and projected_threshold_crossing
3. WHEN computing degradation trends, THE APM_System SHALL use statistical methods appropriate for the parameter type
4. THE APM_System SHALL support trend queries with asset_id, parameter_id, and time_horizon
5. THE APM_System SHALL visualize trends with historical data, trend line, and threshold markers
6. WHEN a parameter trend indicates approaching thresholds, THE APM_System SHALL flag for attention

### Requirement 12: Downtime Event Management

**User Story:** As an operations manager, I want to record and track downtime events for transmission assets, so that I can measure reliability and identify improvement opportunities.

#### Acceptance Criteria

1. THE APM_System SHALL store downtime events with asset_id, event_type, start_time, end_time, and duration_minutes
2. THE APM_System SHALL support downtime event_types: planned_maintenance, unplanned_failure, forced_outage, and testing
3. THE APM_System SHALL store transmission-specific fields: grid_impact_mw, protection_trip_code, and outage_scope
4. THE APM_System SHALL support outage_scope values: bay, line, transformer, and substation
5. WHEN a downtime event is created, THE APM_System SHALL validate start_time is before end_time
6. WHEN end_time is provided, THE APM_System SHALL compute duration_minutes automatically
7. THE APM_System SHALL support querying downtime events with filters for asset_id, time_range, event_type, and outage_scope
8. THE APM_System SHALL link downtime events to RCA records when available
9. THE APM_System SHALL prevent overlapping downtime periods for the same asset

### Requirement 13: Reliability Metrics Calculation

**User Story:** As a reliability engineer, I want computed reliability metrics (MTBF, MTTR, Availability) for each asset, so that I can track performance against targets.

#### Acceptance Criteria

1. THE APM_System SHALL compute MTBF (Mean Time Between Failures) from downtime event history
2. THE APM_System SHALL compute MTTR (Mean Time To Repair) from unplanned downtime events
3. THE APM_System SHALL compute Availability as (uptime / total_time) × 100
4. THE APM_System SHALL store reliability metrics with asset_id, period_start, period_end, mtbf_hours, mttr_hours, and availability_percent
5. WHEN reliability metrics are requested, THE APM_System SHALL support configurable time periods
6. THE APM_System SHALL ensure reliability periods do not overlap for the same asset
7. THE APM_System SHALL support querying reliability metrics with asset_id and time_range

### Requirement 14: Asset Utilisation Monitoring

**User Story:** As a performance engineer, I want to monitor asset utilisation and loading, so that I can optimize asset usage and identify underutilized or overloaded equipment.

#### Acceptance Criteria

1. THE APM_System SHALL compute utilisation metrics including load_factor, peak_current, thermal_headroom, and switching_cycles
2. THE APM_System SHALL calculate load_factor as (average_load / rated_capacity) × 100
3. THE APM_System SHALL calculate thermal_headroom as (rated_capacity - current_load) / rated_capacity × 100
4. WHEN computing utilisation for transformers and lines, THE APM_System SHALL include thermal_headroom
5. WHEN computing utilisation for breakers, THE APM_System SHALL include switching_cycles count
6. THE APM_System SHALL support utilisation queries with asset_id and time_range
7. THE APM_System SHALL visualize utilisation with load curves, rating limits, and headroom indicators

### Requirement 15: Performance Benchmarking

**User Story:** As a performance engineer, I want to compare asset performance against benchmarks and peer assets, so that I can identify underperforming equipment.

#### Acceptance Criteria

1. THE APM_System SHALL store performance benchmarks per asset_type with target values for availability, load_factor, and reliability metrics
2. THE APM_System SHALL support querying benchmarks by asset_type or sector
3. WHEN comparing asset performance to benchmarks, THE APM_System SHALL compute deviation percentages
4. THE APM_System SHALL create performance_deviation records when assets deviate significantly from benchmarks
5. WHEN a performance deviation is detected, THE APM_System SHALL link to the telemetry window and benchmark reference
6. THE APM_System SHALL support querying performance deviations with filters for asset_type, deviation_magnitude, and time_range
7. THE APM_System SHALL visualize benchmark comparisons with actual vs target indicators

### Requirement 16: Failure Prediction and RUL Estimation

**User Story:** As a predictive maintenance engineer, I want AI-driven failure predictions and remaining useful life estimates, so that I can schedule maintenance before failures occur.

#### Acceptance Criteria

1. THE APM_System SHALL store failure predictions with asset_id, prediction_date, failure_probability, confidence, and time_horizon
2. THE APM_System SHALL support prediction time horizons: 7 days, 30 days, and 90 days
3. THE APM_System SHALL classify failure risk levels: low, medium, high, and critical
4. THE APM_System SHALL estimate RUL (Remaining Useful Life) in days for critical components
5. WHEN a failure prediction is generated, THE APM_System SHALL link to contributing health indicators and telemetry patterns
6. THE APM_System SHALL support querying predictions with filters for asset_id, risk_level, and time_horizon
7. WHEN RUL falls below critical thresholds, THE APM_System SHALL flag for immediate attention

### Requirement 17: Condition-Based Maintenance Triggers

**User Story:** As a maintenance planner, I want automated triggers based on asset condition thresholds, so that maintenance is scheduled based on actual need rather than fixed intervals.

#### Acceptance Criteria

1. THE APM_System SHALL store CBM trigger rules with parameter_id, condition_operator, threshold_value, and recommended_action
2. THE APM_System SHALL support condition operators: greater_than, less_than, equals, rate_of_change_exceeds
3. WHEN telemetry data satisfies a CBM trigger condition, THE APM_System SHALL create a maintenance recommendation
4. THE APM_System SHALL evaluate CBM triggers in real-time as telemetry is received
5. THE APM_System SHALL support querying CBM triggers with filters for asset_type and parameter
6. THE APM_System SHALL allow authorized users to create, update, and disable CBM triggers
7. WHEN a CBM trigger fires, THE APM_System SHALL record the triggering telemetry value and timestamp

### Requirement 18: Maintenance Recommendations

**User Story:** As a maintenance planner, I want prescriptive maintenance recommendations with required spares and priority, so that I can efficiently plan and execute maintenance activities.

#### Acceptance Criteria

1. THE APM_System SHALL create maintenance recommendations from CBM triggers, failure predictions, or manual engineer input
2. THE APM_System SHALL store recommendations with asset_id, recommendation_type, description, priority_score, due_date, and required_spares
3. THE APM_System SHALL compute priority_score based on asset criticality, health score, failure risk, and operational impact
4. THE APM_System SHALL link recommendations to required spare parts with quantities
5. WHEN a recommendation is created, THE APM_System SHALL validate the asset exists and required_spares reference valid parts
6. THE APM_System SHALL support querying recommendations with filters for asset_id, priority_score, due_date, and status
7. THE APM_System SHALL allow authorized users to acknowledge, schedule, or close recommendations
8. WHEN a recommendation is closed, THE APM_System SHALL require completion_notes

### Requirement 19: Risk Scoring and Prioritization

**User Story:** As a maintenance manager, I want integrated risk scores combining criticality, health, and failure probability, so that I can prioritize the maintenance backlog effectively.

#### Acceptance Criteria

1. THE APM_System SHALL compute integrated risk scores combining asset criticality, health_index, failure_probability, and performance_deviations
2. THE APM_System SHALL store risk scoring models with configurable weights per factor
3. WHEN computing risk scores, THE APM_System SHALL normalize all input factors to a common scale
4. THE APM_System SHALL rank maintenance recommendations by computed risk score
5. THE APM_System SHALL support querying the prioritized maintenance backlog
6. THE APM_System SHALL allow authorized users to update risk scoring model weights
7. WHEN risk scoring models are updated, THE APM_System SHALL recalculate affected risk scores

### Requirement 20: Real-Time Alert Generation

**User Story:** As an operations engineer, I want real-time alerts for critical conditions, failures, and threshold violations, so that I can respond immediately to urgent situations.

#### Acceptance Criteria

1. THE APM_System SHALL generate alerts from telemetry threshold violations, diagnostic events, and failure predictions
2. THE APM_System SHALL classify alerts by severity: info, warning, critical, and emergency
3. THE APM_System SHALL store alerts with asset_id, alert_type, severity, source, message, detected_at, and state
4. THE APM_System SHALL support alert states: open, ack (acknowledged), and closed
5. WHEN an alert is generated, THE APM_System SHALL link to the source event or telemetry data
6. THE APM_System SHALL support querying alerts with filters for severity, asset_type, time_range, and state
7. WHEN an alert is acknowledged, THE APM_System SHALL record the acknowledging user and timestamp
8. WHEN an alert is closed, THE APM_System SHALL require resolution_notes
9. THE APM_System SHALL prevent duplicate alerts for the same condition within configurable time windows

### Requirement 21: Alert Timeline and History

**User Story:** As an operations manager, I want a unified timeline of alerts, diagnostic events, and downtime, so that I can understand the sequence of events during incidents.

#### Acceptance Criteria

1. THE APM_System SHALL provide a unified timeline view combining alerts, diagnostic_events, and downtime_events
2. WHEN querying the timeline, THE APM_System SHALL support filtering by asset_id, event_type, and time_range
3. THE APM_System SHALL sort timeline events chronologically
4. THE APM_System SHALL store alert history with state transitions and user actions
5. WHEN an alert state changes, THE APM_System SHALL record the transition in alert_history
6. THE APM_System SHALL support querying alert history for audit and analysis purposes

### Requirement 22: Custom Dashboard Builder

**User Story:** As a reliability manager, I want to create custom dashboards with saved widget layouts, so that I can monitor key metrics relevant to my role.

#### Acceptance Criteria

1. THE APM_System SHALL store dashboard definitions with name, description, owner, and layout configuration
2. THE APM_System SHALL support dashboard widgets referencing saved query templates
3. WHEN a dashboard is loaded, THE APM_System SHALL execute all widget queries and render results
4. THE APM_System SHALL support widget types: KPI_card, time_series_chart, table, status_grid, and alert_list
5. THE APM_System SHALL allow users to create, update, and delete their own dashboards
6. THE APM_System SHALL support sharing dashboards with other users or roles
7. WHEN a dashboard is saved, THE APM_System SHALL validate all widget query references are valid

### Requirement 23: Automated Report Generation

**User Story:** As a reliability manager, I want scheduled automated reports for reliability, performance, and maintenance metrics, so that I can track trends and communicate status to stakeholders.

#### Acceptance Criteria

1. THE APM_System SHALL support report types: reliability_summary, maintenance_backlog, asset_health_status, and performance_benchmarking
2. THE APM_System SHALL store report schedules with report_type, frequency, asset_scope, and recipient_list
3. WHEN a scheduled report is due, THE APM_System SHALL execute the report query and generate output
4. THE APM_System SHALL store report run metadata with execution_time, status, and output_location
5. THE APM_System SHALL support report output formats: PDF and CSV
6. THE APM_System SHALL allow authorized users to create, update, and delete report schedules
7. WHEN a report fails to generate, THE APM_System SHALL log the error and notify administrators

### Requirement 24: Data Export Center

**User Story:** As a data analyst, I want to export APM data in standard formats, so that I can perform advanced analysis in external tools.

#### Acceptance Criteria

1. THE APM_System SHALL support exporting telemetry data, downtime events, reliability metrics, and asset lists
2. THE APM_System SHALL support export formats: CSV, JSON, and Excel
3. WHEN an export is requested, THE APM_System SHALL create an export job with status tracking
4. THE APM_System SHALL support export job states: queued, processing, completed, and failed
5. THE APM_System SHALL store export jobs with user_id, query_reference, format, status, and output_location
6. WHEN an export job completes, THE APM_System SHALL notify the requesting user
7. THE APM_System SHALL enforce data access permissions during export operations
8. WHEN large exports are requested, THE APM_System SHALL process them asynchronously

### Requirement 25: Row-Level Security and Access Control

**User Story:** As a security administrator, I want role-based access control with row-level security, so that users can only access data appropriate to their role and sector.

#### Acceptance Criteria

1. THE APM_System SHALL enforce RLS policies on all APM tables
2. WHEN a user queries assets, THE APM_System SHALL filter results based on user sector and role permissions
3. THE APM_System SHALL allow authenticated users to read APM baseline tables
4. THE APM_System SHALL restrict write operations to authorized roles: apm_admin, reliability_engineer, maintenance_planner
5. THE APM_System SHALL prevent cross-sector data access unless explicitly authorized
6. WHEN a user attempts unauthorized write operations, THE APM_System SHALL reject the request with appropriate error
7. THE APM_System SHALL enforce sector='power_transmission' constraints through RLS policies or check constraints
8. THE APM_System SHALL log all write operations for audit purposes

### Requirement 26: Schema Migration Idempotency

**User Story:** As a database administrator, I want idempotent schema migrations, so that I can safely apply migrations multiple times without errors or data corruption.

#### Acceptance Criteria

1. THE APM_System SHALL provide migration scripts that can be executed multiple times safely
2. WHEN a migration is executed, THE APM_System SHALL check for existing objects before creating them
3. THE APM_System SHALL use CREATE IF NOT EXISTS or equivalent patterns for all DDL operations
4. WHEN extending enums, THE APM_System SHALL check if values already exist before adding them
5. THE APM_System SHALL use CTE-based patterns for complex migrations
6. WHEN a migration fails, THE APM_System SHALL provide clear error messages indicating the failure point

### Requirement 27: Data Validation and Health Checks

**User Story:** As a data quality engineer, I want automated validation checks after data seeding, so that I can ensure data integrity and completeness.

#### Acceptance Criteria

1. THE APM_System SHALL provide validation scripts that check data integrity constraints
2. WHEN validation is executed, THE APM_System SHALL check for duplicate natural keys
3. THE APM_System SHALL validate all foreign key references point to existing records
4. THE APM_System SHALL validate all transmission assets have sector='power_transmission'
5. THE APM_System SHALL validate FMEA entries exist for each transmission asset_type
6. THE APM_System SHALL validate spare part mappings reference valid assets and parts
7. THE APM_System SHALL validate downtime event durations are consistent with start and end times
8. THE APM_System SHALL validate reliability periods do not overlap for the same asset
9. WHEN validation checks fail, THE APM_System SHALL raise exceptions or return failing rows
10. THE APM_System SHALL ensure validation scripts return zero failures on correctly seeded data

### Requirement 28: Performance Requirements

**User Story:** As a system administrator, I want the APM system to meet performance targets for key operations, so that users have a responsive experience.

#### Acceptance Criteria

1. WHEN querying asset lists with filters, THE APM_System SHALL return results within 300ms for seeded datasets
2. WHEN querying telemetry for 30-day windows, THE APM_System SHALL return results with acceptable performance
3. THE APM_System SHALL use appropriate indexes on frequently queried columns
4. THE APM_System SHALL use hypertable partitioning for telemetry_data time-series storage
5. WHEN computing health scores, THE APM_System SHALL cache results with configurable TTL
6. THE APM_System SHALL support pagination for all list queries to limit result set sizes

### Requirement 29: UI Navigation and Layout

**User Story:** As an APM user, I want consistent navigation and layout across all APM pages following the nLVE pattern, so that I can efficiently navigate and interact with the system.

#### Acceptance Criteria

1. THE APM_System SHALL integrate transmission features into the existing Monitor navigation section
2. THE APM_System SHALL extend existing Monitor feature sets: Asset Inventory & Criticality, Asset Health & Diagnostics, Asset Performance & Utilisation, Predictive & Prescriptive Maintenance, Alerts Reports & Visualisation
3. WHEN a user navigates to a page, THE APM_System SHALL follow the nLVE pattern: Navigate → List → View → Edit
4. THE APM_System SHALL provide consistent page shells with header, filters, and content areas
5. THE APM_System SHALL display loading states during data fetching
6. THE APM_System SHALL display empty states when no data is available
7. THE APM_System SHALL display error states with actionable messages when operations fail
8. THE APM_System SHALL use typed TypeScript interfaces for all data contracts

### Requirement 30: Seed Data Completeness

**User Story:** As a developer, I want comprehensive seed data covering all transmission asset types and scenarios, so that I can develop and test features without requiring production data.

#### Acceptance Criteria

1. THE APM_System SHALL provide seed data for at least 1 substation with multiple bays
2. THE APM_System SHALL provide seed data for at least 2 transformers, 4 breakers, 2 lines, and 2 relays
3. THE APM_System SHALL provide telemetry parameter mappings for each transmission asset_type
4. THE APM_System SHALL provide sample downtime events for planned and unplanned scenarios
5. THE APM_System SHALL provide FMEA library entries for all transmission asset types
6. THE APM_System SHALL provide spare parts library with linkages to asset types
7. THE APM_System SHALL provide performance benchmarks for each asset_type
8. THE APM_System SHALL ensure seed data demonstrates asset hierarchies and relationships
9. THE APM_System SHALL ensure seed data includes assets in various lifecycle stages and operational statuses
10. THE APM_System SHALL ensure all seed data uses natural key upserts for idempotency

### Requirement 31: Adherence to Existing Sector and Subsector Filtering

**User Story:** As a transmission operator, I want the APM features to respect the existing sector/subsector filtering system, so that when I select power sector and transmission subsector with my organization, I only see relevant transmission data.

#### Acceptance Criteria

1. THE APM_System SHALL adhere to the existing tenant-based data isolation that filters by sector='power' and subsector='transmission'
2. THE APM_System SHALL use the existing DEWA transmission tenant structure (sector='power', subsector='transmission', scenario_tag='power_transmission_demo_v1')
3. WHEN implementing APM queries, THE APM_System SHALL respect the existing RLS policies and tenant_id filtering
4. THE APM_System SHALL work with the existing asset types (TRANSFORMER, BREAKER, BAY, METER) and their associated transmission assets
5. THE APM_System SHALL integrate with the existing grid topology (grid_nodes, grid_lines) that is already filtered by tenant_id
6. THE APM_System SHALL use the existing telemetry structure (telemetry_points, tags) that is already tenant-isolated
7. WHEN displaying APM data, THE APM_System SHALL only show data belonging to the user's transmission tenant
8. THE APM_System SHALL handle empty states gracefully when no transmission data exists for a tenant
9. THE APM_System SHALL maintain consistency with the existing tenant-based security model
10. THE APM_System SHALL not duplicate or override the existing sector/subsector filtering logic
