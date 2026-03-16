# Requirements Document: EMS Power Transmission

## Introduction

This specification defines the complete Energy Management System (EMS) implementation for the Power Transmission sector. The system provides comprehensive energy monitoring, analytics, control advisory, sustainability tracking, and reporting capabilities specifically tailored for transmission grid operations. The implementation follows a phased rollout approach across six feature sets, building upon a foundational transmission context layer that binds energy meters and telemetry to grid topology (substations, bays, feeders, transformers, line segments).

## Glossary

- **EMS**: Energy Management System - the complete software system for monitoring, analyzing, and optimizing energy usage
- **Transmission_Grid**: The high-voltage electrical network that transmits power from generation sources to distribution networks
- **Substation**: A facility where voltage is transformed and power is switched between transmission lines
- **Feeder**: A circuit that delivers power from a substation to the distribution network or another substation
- **Bay**: A physical section within a substation containing equipment for a specific function (line bay, transformer bay, bus coupler)
- **Meter**: A device that measures electrical parameters (energy consumption, power, voltage, current, power factor, harmonics)
- **Telemetry**: Time-series data collected from meters and sensors
- **Power_Quality**: Electrical characteristics including voltage stability, frequency, harmonics, and power factor
- **RLS**: Row Level Security - database-level access control that filters data based on user permissions
- **nLVE**: Navigate-List-View-Edit - the standard UI pattern for data management pages
- **Hypertable**: TimescaleDB optimized table structure for time-series data
- **Natural_Key**: Business-meaningful unique identifier (e.g., org_id + code) as opposed to random UUID
- **CTE**: Common Table Expression - SQL query structure used for preconditions, upserts, and postchecks
- **Baseline**: Historical reference values used to detect anomalies and measure efficiency
- **Anomaly**: Deviation from expected energy consumption patterns
- **DR_Event**: Demand Response Event - coordinated load reduction during peak demand periods
- **Controllable_Load**: Equipment that can be remotely controlled to adjust power consumption
- **Generation_Asset**: On-site power generation equipment (solar, wind, backup generators)
- **Emission_Factor**: Conversion factor for calculating carbon emissions from energy consumption
- **KPI**: Key Performance Indicator - calculated metric for measuring system performance
- **ESG**: Environmental, Social, and Governance - sustainability reporting framework

## Requirements

### Requirement 1: Transmission Grid Topology Foundation

**User Story:** As a transmission grid operator, I want to organize energy meters and telemetry data according to our grid topology (substations, feeders, transformers, lines), so that I can monitor and analyze energy flows in the context of our physical infrastructure.

#### Acceptance Criteria

1. WHEN a substation is created with org_id and code, THE System SHALL ensure uniqueness of the (org_id, code) combination
2. WHEN a feeder is created, THE System SHALL require a valid substation_id and ensure uniqueness of (substation_id, feeder_code)
3. WHEN a transformer is created, THE System SHALL require a valid substation_id and ensure uniqueness of (substation_id, transformer_code)
4. WHEN a transmission line is created, THE System SHALL require valid from_substation_id and to_substation_id references
5. WHEN an energy meter is assigned to grid topology, THE System SHALL validate that the meter_role matches the assigned topology entity (e.g., feeder_outgoing role requires feeder_id)
6. WHEN querying the meter registry, THE System SHALL provide a view that joins meters with their resolved topology names and latest telemetry timestamps
7. WHEN topology seed data is rerun, THE System SHALL not create duplicate entities (idempotent upserts)
8. WHEN topology data is inserted, THE System SHALL validate preconditions (referenced entities exist) and postchecks (row counts, FK integrity, uniqueness)

### Requirement 2: Energy Meter Registry and Telemetry

**User Story:** As an energy analyst, I want to maintain a comprehensive registry of all energy meters with their locations, roles, and current status, so that I can track which meters are active and monitor their data quality.

#### Acceptance Criteria

1. WHEN a meter is registered, THE System SHALL capture meter name, status, energy types, meter role, and topology bindings
2. WHEN a meter has a role of "grid_incomer", THE System SHALL require substation_id to be not null
3. WHEN a meter has a role of "feeder_outgoing", THE System SHALL require feeder_id to be not null
4. WHEN telemetry data is ingested, THE System SHALL store it in a TimescaleDB hypertable optimized for time-series queries
5. WHEN querying meter status, THE System SHALL include the timestamp of the last received telemetry
6. WHEN a meter has not sent telemetry within a configurable threshold, THE System SHALL mark it as having stale data
7. WHEN filtering meters, THE System SHALL support filters by substation, feeder, role, status, energy_type, and stale telemetry flag
8. WHEN exporting meter data, THE System SHALL support CSV export with pagination

### Requirement 3: Real-Time Energy Monitoring

**User Story:** As a grid operator, I want to view real-time energy consumption, power quality metrics, and operational status across all meters in my transmission network, so that I can quickly identify issues and respond to abnormal conditions.

#### Acceptance Criteria

1. WHEN viewing the real-time monitoring page, THE System SHALL display current kW, voltage, power factor, THD, and frequency for each meter
2. WHEN a meter's status is Critical or High, THE System SHALL visually highlight it in the list
3. WHEN filtering by substation or feeder, THE System SHALL return only meters associated with those topology entities
4. WHEN a meter has stale telemetry, THE System SHALL indicate this in the status column
5. WHEN viewing meter details, THE System SHALL display a 24-hour sparkline trend chart
6. WHEN telemetry data is unavailable, THE System SHALL display an appropriate empty state message
7. WHEN the user lacks permissions to view certain meters, THE System SHALL display an "insufficient access" message rather than a generic error

### Requirement 4: Energy Baselines and Trend Analysis

**User Story:** As an energy engineer, I want to establish baseline energy consumption patterns for meters and compare actual consumption against these baselines, so that I can identify efficiency opportunities and detect anomalies.

#### Acceptance Criteria

1. WHEN creating a baseline, THE System SHALL capture baseline period (start_date, end_date), baseline method (regression/seasonal/rolling), and baseline values
2. WHEN creating a baseline for transmission meters, THE System SHALL support baseline_kwh_per_mwh_delivered and baseline_kwh_per_mw_peak metrics
3. WHEN multiple baselines exist for a meter, THE System SHALL ensure baseline periods do not overlap
4. WHEN viewing baseline trends, THE System SHALL display aggregated telemetry by hour or day alongside the baseline
5. WHEN actual consumption deviates significantly from baseline, THE System SHALL flag this as a potential anomaly
6. WHEN editing baselines, THE System SHALL restrict access to users with energy_engineer or analyst roles
7. WHEN a baseline is updated, THE System SHALL maintain an audit trail of changes

### Requirement 5: Multi-Fluid Energy Monitoring

**User Story:** As an energy manager, I want to monitor consumption across multiple energy types (electricity, gas, diesel, steam) in a unified view, so that I can understand total energy usage and identify optimization opportunities across all energy sources.

#### Acceptance Criteria

1. WHEN viewing multi-fluid monitoring, THE System SHALL group meters by energy_type
2. WHEN aggregating consumption, THE System SHALL sum telemetry values by energy type and time period
3. WHEN displaying energy types, THE System SHALL support electricity, gas, diesel, and steam
4. WHEN a meter measures multiple energy types, THE System SHALL include it in all relevant groupings
5. WHEN comparing energy types, THE System SHALL provide normalized views (e.g., kWh equivalent)
6. WHEN filtering by date range, THE System SHALL aggregate telemetry within that range

### Requirement 6: Power Quality Monitoring and Events

**User Story:** As a grid reliability engineer, I want to monitor power quality metrics (voltage sags/swells, THD, frequency deviations) and track power quality events, so that I can maintain grid stability and investigate equipment issues.

#### Acceptance Criteria

1. WHEN power quality telemetry is received, THE System SHALL store voltage, frequency, power factor, and THD values
2. WHEN power quality exceeds defined thresholds, THE System SHALL create a power quality event
3. WHEN defining PQ thresholds, THE System SHALL support voltage-level-specific limits (e.g., different thresholds for 132kV vs 400kV)
4. WHEN viewing PQ events, THE System SHALL display event type, timestamp, duration, severity, and resolution status
5. WHEN filtering PQ events, THE System SHALL support filtering by resolved/unresolved status
6. WHEN resolving a PQ event, THE System SHALL capture resolution notes and timestamp
7. WHEN a PQ event is unresolved, THE System SHALL include it in the active alerts list
8. WHEN querying PQ events, THE System SHALL use a partial index on unresolved events for performance

### Requirement 7: Sub-Metering Hierarchy

**User Story:** As a facility manager, I want to organize meters in a hierarchical structure with parent meters and sub-meters, so that I can track energy consumption at different levels of granularity (e.g., substation total vs individual feeders).

#### Acceptance Criteria

1. WHEN creating a sub-meter, THE System SHALL require a valid parent meter_id
2. WHEN viewing a parent meter, THE System SHALL display all associated sub-meters
3. WHEN aggregating sub-meter consumption, THE System SHALL validate that the sum does not exceed parent meter consumption by more than a configurable tolerance
4. WHEN filtering sub-meters, THE System SHALL support filtering by parent meter, asset, or feeder
5. WHEN a sub-meter is assigned to an asset, THE System SHALL link it to the asset registry
6. WHEN editing sub-meter assignments, THE System SHALL validate that the sub-meter's location is within the parent meter's scope

### Requirement 8: Energy Alerts and Anomaly Detection

**User Story:** As an operations manager, I want to receive alerts when energy anomalies or power quality events occur, and track these alerts through acknowledgment and resolution, so that I can ensure timely response to operational issues.

#### Acceptance Criteria

1. WHEN an energy anomaly is detected, THE System SHALL create an alert with state "open"
2. WHEN a power quality event is created, THE System SHALL create an associated alert
3. WHEN viewing alerts, THE System SHALL display alert type (Anomaly/PQ), severity, substation/feeder, detected timestamp, state, and assignee
4. WHEN acknowledging an alert, THE System SHALL update the state to "acked" and record the timestamp and user
5. WHEN closing an alert, THE System SHALL update the state to "closed" and record the timestamp and user
6. WHEN an alert has an SLA due date, THE System SHALL display time remaining and highlight overdue alerts
7. WHEN assigning an alert, THE System SHALL validate that the assignee has appropriate permissions
8. WHEN adding notes to an alert, THE System SHALL create an audit trail entry
9. WHEN filtering alerts, THE System SHALL support filtering by state, severity, type, substation, feeder, and assignee
10. WHEN bulk operations are performed on alerts, THE System SHALL support assign, acknowledge, and export actions
11. WHEN closing an alert, THE System SHALL restrict this action to users with operations role

### Requirement 9: Energy Efficiency KPIs

**User Story:** As an energy analyst, I want to calculate and track key performance indicators for energy efficiency (consumption per unit delivered, losses, power factor, load factor), so that I can measure performance and identify improvement opportunities.

#### Acceptance Criteria

1. WHEN calculating KPIs, THE System SHALL support kWh per MWh delivered, losses percentage, average power factor, and load factor
2. WHEN storing KPI snapshots, THE System SHALL ensure uniqueness by (kpi_code, scope_type, scope_id, period_start, period_grain)
3. WHEN viewing KPIs, THE System SHALL display current value, trend direction, and comparison to baseline or target
4. WHEN KPI snapshots are missing for active substations/feeders, THE System SHALL flag this as a data quality issue
5. WHEN drilling down on a KPI, THE System SHALL display the top contributing meters or feeders
6. WHEN exporting KPIs, THE System SHALL support time-series export for trending analysis
7. WHEN KPIs are calculated, THE System SHALL use the calculate_energy_consumption function for consistency

### Requirement 10: Load Profiling and Peak Demand Analysis

**User Story:** As a demand management specialist, I want to analyze load profiles and identify peak demand periods across substations and feeders, so that I can optimize demand charges and plan load management strategies.

#### Acceptance Criteria

1. WHEN generating load profiles, THE System SHALL aggregate telemetry by configurable time intervals (15-min, hourly, daily)
2. WHEN identifying peak demand, THE System SHALL determine the maximum kW within defined demand windows
3. WHEN demand windows are configured, THE System SHALL support utility-specific window definitions and ratchet rules
4. WHEN calculating demand charges, THE System SHALL apply tariff rates to peak demand values
5. WHEN viewing load profiles, THE System SHALL display profiles by substation, feeder, or meter
6. WHEN comparing load profiles, THE System SHALL support period-over-period comparison (day-over-day, week-over-week)
7. WHEN clustering load profiles, THE System SHALL optionally apply clustering algorithms to identify similar consumption patterns

### Requirement 11: Waste Detection and Optimization Recommendations

**User Story:** As an energy optimization engineer, I want the system to identify energy waste opportunities (off-hours consumption, inefficient operation, anomalies) and provide actionable recommendations, so that I can prioritize improvement projects.

#### Acceptance Criteria

1. WHEN detecting waste, THE System SHALL identify consumption during off-hours that exceeds baseline
2. WHEN detecting inefficiency, THE System SHALL compare actual performance to efficiency curves or benchmarks
3. WHEN creating recommendations, THE System SHALL include recommendation type, scope, estimated savings, confidence level, and timeframe
4. WHEN viewing recommendations, THE System SHALL rank them by estimated impact
5. WHEN updating recommendation status, THE System SHALL support accepted, rejected, and implemented states
6. WHEN a recommendation is implemented, THE System SHALL track actual savings vs estimated savings
7. WHEN recommendations are created, THE System SHALL ensure uniqueness by (recommendation_type, scope_type, scope_id, created_at::date, title)

### Requirement 12: AI-Driven Optimization

**User Story:** As an energy manager, I want AI-driven insights and optimization recommendations based on historical patterns, weather data, and operational context, so that I can proactively improve energy efficiency.

#### Acceptance Criteria

1. WHEN AI analysis runs, THE System SHALL generate recommendations based on historical telemetry patterns
2. WHEN displaying AI recommendations, THE System SHALL include confidence scores and supporting data
3. WHEN AI detects patterns, THE System SHALL identify opportunities for load shifting, peak shaving, or efficiency improvements
4. WHEN recommendations are generated, THE System SHALL store them in the unified energy_recommendations table
5. WHEN users provide feedback on recommendations, THE System SHALL capture acceptance/rejection reasons for model improvement

### Requirement 13: Controllable Loads and Asset Modes

**User Story:** As a control engineer, I want to maintain a registry of controllable loads and their operational modes, so that I can plan and execute demand response and load management strategies.

#### Acceptance Criteria

1. WHEN registering a controllable load, THE System SHALL capture load capacity, current mode, and control constraints
2. WHEN defining asset modes, THE System SHALL specify mode name, power consumption, and operational constraints
3. WHEN recommending mode changes, THE System SHALL validate that the recommended mode is valid for the asset
4. WHEN viewing controllable loads, THE System SHALL display current mode, available modes, and last mode change timestamp
5. WHEN editing controllable loads, THE System SHALL restrict access to control engineers and administrators
6. WHEN a mode change is recommended, THE System SHALL calculate estimated energy and cost impact

### Requirement 14: Demand Response Event Management

**User Story:** As a demand response coordinator, I want to plan, execute, and track demand response events that reduce load during peak periods, so that I can minimize demand charges and support grid stability.

#### Acceptance Criteria

1. WHEN creating a DR event, THE System SHALL specify event window, target load reduction, participating loads, and event status
2. WHEN a DR event is active, THE System SHALL validate that participating loads exist and are controllable
3. WHEN executing a DR event, THE System SHALL not exceed maximum shed constraints defined in load shedding plans
4. WHEN viewing DR events, THE System SHALL display planned vs actual load reduction
5. WHEN a DR event completes, THE System SHALL calculate achieved savings and performance metrics
6. WHEN DR events conflict, THE System SHALL flag conflicting shed constraints
7. WHEN DR event participation is tracked, THE System SHALL record load response by asset

### Requirement 15: Load Balancing Advisory

**User Story:** As a grid operator, I want load balancing recommendations that optimize power distribution across feeders and transformers, so that I can prevent overloads and improve system efficiency.

#### Acceptance Criteria

1. WHEN generating load balancing recommendations, THE System SHALL analyze current load distribution across feeders
2. WHEN a feeder or transformer approaches capacity, THE System SHALL recommend load transfers
3. WHEN simulating load transfers, THE System SHALL validate that target feeders have sufficient capacity
4. WHEN viewing load balancing advisory, THE System SHALL display current utilization, recommended actions, and expected outcomes
5. WHEN load balancing plans are created, THE System SHALL store them with versioning for audit purposes
6. WHEN executing load balancing, THE System SHALL provide advisory only (no automatic control actions)

### Requirement 16: Control System Integration Registry

**User Story:** As an integration engineer, I want to maintain a registry of external control systems (SCADA, EMS, DERMS) with their connectivity status and protocols, so that I can monitor integration health and troubleshoot connectivity issues.

#### Acceptance Criteria

1. WHEN registering a control integration, THE System SHALL capture system type, system name, protocol (IEC 61850/DNP3/OPC UA), and endpoint details
2. WHEN monitoring integration status, THE System SHALL track connectivity status and last_sync_at timestamp
3. WHEN an integration fails to sync, THE System SHALL flag it as disconnected and create an alert
4. WHEN viewing integrations, THE System SHALL display connection status, last sync time, and error messages
5. WHEN editing integrations, THE System SHALL restrict access to integration engineers and administrators
6. WHEN testing connectivity, THE System SHALL provide a manual sync trigger and display results

### Requirement 17: Efficiency Curves and Performance Benchmarking

**User Story:** As a performance engineer, I want to define efficiency curves for equipment and benchmark actual performance against these curves, so that I can identify underperforming assets and optimize operations.

#### Acceptance Criteria

1. WHEN defining an efficiency curve, THE System SHALL capture load points and corresponding efficiency values
2. WHEN actual performance is measured, THE System SHALL compare it to the efficiency curve
3. WHEN performance deviates from the curve, THE System SHALL create an efficiency recommendation
4. WHEN viewing efficiency curves, THE System SHALL display the curve graphically with actual performance overlaid
5. WHEN benchmarking performance, THE System SHALL support comparison against industry standards or peer assets
6. WHEN efficiency recommendations are generated, THE System SHALL estimate potential savings from optimization

### Requirement 18: Carbon Emissions Calculation

**User Story:** As a sustainability manager, I want to calculate carbon emissions from energy consumption using appropriate emission factors, so that I can track our carbon footprint and report on emissions reduction efforts.

#### Acceptance Criteria

1. WHEN calculating emissions, THE System SHALL apply emission factors based on energy type and time period
2. WHEN emission factors change, THE System SHALL use the factor effective for the consumption period
3. WHEN storing emissions snapshots, THE System SHALL ensure uniqueness by (scope_type, scope_id, period_start, period_grain, factor_id)
4. WHEN viewing emissions, THE System SHALL display total CO2e by substation, feeder, and energy type
5. WHEN emission factors are missing for a period, THE System SHALL flag this as a data quality issue
6. WHEN exporting emissions data, THE System SHALL include factor metadata for audit purposes
7. WHEN emissions are calculated, THE System SHALL support Scope 1, 2, and 3 categorization

### Requirement 19: Energy Intensity and Delivery Context

**User Story:** As a transmission operator, I want to track energy intensity metrics (losses, efficiency) in the context of power delivery (MWh delivered, MW peak, interchange), so that I can measure transmission system performance.

#### Acceptance Criteria

1. WHEN recording delivery context, THE System SHALL capture MWh delivered, MW peak, losses MWh, and interchange MWh
2. WHEN calculating energy intensity, THE System SHALL compute kgCO2e per MWh delivered and losses percentage
3. WHEN viewing intensity metrics, THE System SHALL display trends over time and comparison to targets
4. WHEN delivery context is missing, THE System SHALL prevent intensity calculation and flag the gap
5. WHEN losses exceed thresholds, THE System SHALL create an alert for investigation

### Requirement 20: Renewable Energy Tracking

**User Story:** As a sustainability analyst, I want to track renewable energy generation and consumption, including PPAs and RECs, so that I can report on renewable energy usage and progress toward sustainability goals.

#### Acceptance Criteria

1. WHEN registering generation assets, THE System SHALL capture asset type (solar/wind/hydro), capacity, and location
2. WHEN tracking renewable contracts, THE System SHALL store contract details, effective dates, and renewable contribution
3. WHEN calculating renewable percentage, THE System SHALL divide renewable generation by total consumption
4. WHEN viewing renewable energy, THE System SHALL display generation by asset and by energy type
5. WHEN renewable contracts expire, THE System SHALL flag this for renewal action
6. WHEN exporting renewable data, THE System SHALL support ESG reporting formats

### Requirement 21: Compliance Requirements and Evidence

**User Story:** As a compliance officer, I want to define compliance requirements and link supporting evidence, so that I can demonstrate adherence to regulations and standards during audits.

#### Acceptance Criteria

1. WHEN defining a compliance requirement, THE System SHALL capture requirement text, standard reference, effective date, and review frequency
2. WHEN linking evidence, THE System SHALL support document uploads, data exports, and system-generated reports
3. WHEN a compliance requirement is due for review, THE System SHALL create a reminder
4. WHEN viewing compliance status, THE System SHALL display requirements, evidence status, and gaps
5. WHEN exporting compliance reports, THE System SHALL include all requirements and linked evidence
6. WHEN editing compliance data, THE System SHALL restrict access to compliance officers and administrators

### Requirement 22: ESG Reporting

**User Story:** As an ESG reporting manager, I want to generate ESG reports using predefined templates that pull data from emissions, renewable energy, and efficiency metrics, so that I can provide consistent reporting to stakeholders.

#### Acceptance Criteria

1. WHEN creating a report template, THE System SHALL define data sources, calculations, and output format
2. WHEN generating an ESG report, THE System SHALL execute the template and create an export job
3. WHEN a report is generated, THE System SHALL include metadata (generation timestamp, data period, template version)
4. WHEN viewing report history, THE System SHALL display all generated reports with status and download links
5. WHEN scheduling reports, THE System SHALL support recurring generation (monthly, quarterly, annually)
6. WHEN a report fails to generate, THE System SHALL log the error and notify the requester

### Requirement 23: Energy Dashboards

**User Story:** As an energy manager, I want customizable dashboards that display KPIs, trends, anomalies, and cost analysis in a unified view, so that I can monitor overall energy performance at a glance.

#### Acceptance Criteria

1. WHEN viewing the main energy dashboard, THE System SHALL display key KPI tiles (total consumption, peak demand, cost, emissions)
2. WHEN viewing trend charts, THE System SHALL display consumption trends by time period and by substation/feeder
3. WHEN viewing anomaly summaries, THE System SHALL display count of open anomalies by severity
4. WHEN viewing cost analysis, THE System SHALL display cost breakdown by tariff component (energy, demand, other)
5. WHEN dashboards are loaded, THE System SHALL meet agreed latency budgets on realistic data volumes
6. WHEN data is unavailable, THE System SHALL display appropriate empty states rather than errors

### Requirement 24: Custom Dashboard Builder

**User Story:** As a power user, I want to create custom dashboards by selecting and arranging widgets that query specific datasets, so that I can tailor views to my specific monitoring needs.

#### Acceptance Criteria

1. WHEN creating a custom dashboard, THE System SHALL provide a drag-and-drop interface for widget placement
2. WHEN adding a widget, THE System SHALL restrict queries to whitelisted datasets for security
3. WHEN configuring a widget, THE System SHALL validate that the query is syntactically correct
4. WHEN saving a dashboard, THE System SHALL store the definition with versioning
5. WHEN sharing a dashboard, THE System SHALL respect RLS policies for all viewers
6. WHEN cloning a dashboard, THE System SHALL create a copy with a new unique identifier
7. WHEN publishing a dashboard, THE System SHALL make it available to users with appropriate permissions

### Requirement 25: Period Comparison and Audit Reports

**User Story:** As an analyst, I want to compare energy metrics across different time periods (day-over-day, month-over-month, year-over-year) and generate audit reports, so that I can identify trends and provide documentation for audits.

#### Acceptance Criteria

1. WHEN comparing periods, THE System SHALL display metrics side-by-side with variance calculations
2. WHEN generating audit reports, THE System SHALL include all relevant data with timestamps and data lineage
3. WHEN exporting audit reports, THE System SHALL support PDF and CSV formats
4. WHEN audit reports are generated, THE System SHALL create an export job with status tracking
5. WHEN viewing period comparisons, THE System SHALL normalize for different period lengths (e.g., 28-day vs 31-day months)
6. WHEN audit reports are accessed, THE System SHALL maintain an access log for compliance

### Requirement 26: Data Export and Scheduling

**User Story:** As a data analyst, I want to export energy data in various formats and schedule recurring exports, so that I can integrate with external analytics tools and automate reporting workflows.

#### Acceptance Criteria

1. WHEN exporting data, THE System SHALL support CSV, JSON, and Excel formats
2. WHEN creating an export job, THE System SHALL validate that the user has permissions to access the requested data
3. WHEN an export job is created, THE System SHALL track job status (pending, running, completed, failed)
4. WHEN an export completes, THE System SHALL provide a download link with expiration
5. WHEN scheduling exports, THE System SHALL support daily, weekly, and monthly recurrence
6. WHEN a scheduled export fails, THE System SHALL retry according to configured retry policy and notify the owner
7. WHEN exporting large datasets, THE System SHALL implement pagination to prevent timeouts

### Requirement 27: Row Level Security and Multi-Tenancy

**User Story:** As a system administrator, I want row-level security policies that ensure users only access data for their organization and authorized sites, so that we maintain data isolation in a multi-tenant environment.

#### Acceptance Criteria

1. WHEN a user queries any energy table, THE System SHALL filter results to only include rows where org_id matches the user's organization
2. WHEN a user has site-specific permissions, THE System SHALL further filter results to authorized sites
3. WHEN a user attempts to insert or update data, THE System SHALL validate that the org_id matches their organization
4. WHEN RLS denies access, THE System SHALL return an "insufficient access" message rather than a generic error
5. WHEN audit tables are queried, THE System SHALL allow read access but prevent updates or deletes
6. WHEN administrators query data, THE System SHALL optionally allow cross-organization access based on role
7. WHEN RLS policies are updated, THE System SHALL not break existing application queries

### Requirement 28: Data Validation and Quality Checks

**User Story:** As a data quality engineer, I want automated validation checks that verify data completeness, consistency, and freshness, so that I can trust the data used for analysis and reporting.

#### Acceptance Criteria

1. WHEN telemetry is ingested, THE System SHALL validate that timestamps are within acceptable bounds (not future, not too old)
2. WHEN meters are registered, THE System SHALL validate that required topology bindings exist based on meter_role
3. WHEN baselines are created, THE System SHALL validate that periods do not overlap for the same meter
4. WHEN KPI snapshots are generated, THE System SHALL validate coverage for all active substations/feeders
5. WHEN emission factors are applied, THE System SHALL validate that factors exist for the consumption period
6. WHEN validation checks fail, THE System SHALL log the failure and create a data quality alert
7. WHEN running validation queries, THE System SHALL support execution in CI/CD pipelines
8. WHEN orphaned records are detected, THE System SHALL flag them for cleanup or correction

### Requirement 29: Performance and Scalability

**User Story:** As a system architect, I want the system to meet performance targets for query latency and data throughput, so that users have a responsive experience even with large data volumes.

#### Acceptance Criteria

1. WHEN querying meter lists, THE System SHALL return results within 2 seconds for up to 10,000 meters
2. WHEN querying telemetry time series, THE System SHALL return results within 3 seconds for up to 1 million data points
3. WHEN loading dashboards, THE System SHALL render all widgets within 5 seconds
4. WHEN ingesting telemetry, THE System SHALL support at least 10,000 data points per second
5. WHEN executing aggregation queries, THE System SHALL use TimescaleDB continuous aggregates where applicable
6. WHEN indexes are created, THE System SHALL include explain plan analysis to verify index usage
7. WHEN pagination is implemented, THE System SHALL use cursor-based pagination for large result sets

### Requirement 30: Idempotent Migrations and Seeds

**User Story:** As a DevOps engineer, I want database migrations and seed scripts to be idempotent and include validation checks, so that I can safely run them multiple times without causing data corruption or duplication.

#### Acceptance Criteria

1. WHEN a migration is executed, THE System SHALL use "CREATE TABLE IF NOT EXISTS" or equivalent idempotent syntax
2. WHEN seed data is inserted, THE System SHALL use upsert logic based on natural keys to prevent duplicates
3. WHEN seeds include preconditions, THE System SHALL validate that referenced entities exist before inserting dependent data
4. WHEN seeds include postchecks, THE System SHALL validate row counts, FK integrity, and uniqueness after insertion
5. WHEN a seed script is rerun, THE System SHALL not create duplicate rows
6. WHEN migrations fail, THE System SHALL roll back the transaction and provide clear error messages
7. WHEN seeds are executed, THE System SHALL log execution results for audit purposes
