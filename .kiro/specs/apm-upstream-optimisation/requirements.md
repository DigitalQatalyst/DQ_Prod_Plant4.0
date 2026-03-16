# Requirements Document

## Introduction

This document specifies the requirements for contextualizing the existing APM (Asset Performance Management) feature sets for the Oil & Gas Upstream subsector. The implementation will extend the Plant4.0 platform's existing APM capabilities by adding upstream-specific mock data, telemetry examples, and contextual UI metadata while preserving the generic, reusable APM architecture.

## Glossary

- **APM**: Asset Performance Management - systematic approach to monitoring and optimizing physical asset performance
- **Upstream**: Oil & Gas sector focusing on exploration, drilling, and production activities
- **nLVE Pattern**: Navigate-List-View-Edit interaction pattern used throughout the platform
- **Wellhead**: Surface equipment controlling oil/gas flow from a well
- **ESP**: Electric Submersible Pump - downhole pump system for artificial lift
- **Gas Compressor**: Equipment that increases gas pressure for transportation
- **KO Drum**: Knock-Out Drum - vessel that separates liquids from gas streams
- **RUL**: Remaining Useful Life - predicted time until asset failure or maintenance
- **Health Index**: Numerical score representing overall asset condition
- **Telemetry**: Real-time measurement data from sensors and instruments

## Requirements

### Requirement 1

**User Story:** As an upstream operations manager, I want to select an Oil & Gas Upstream tenant from the tenant selector, so that I can access upstream-specific asset data and APM features.

#### Acceptance Criteria

1. WHEN the tenant selector is opened THEN the system SHALL display "GulfUpstream Demo" as an available tenant option
2. WHEN "GulfUpstream Demo" tenant is selected THEN the system SHALL filter all asset data to show only upstream assets
3. WHEN the upstream tenant is active THEN the system SHALL display "Oil & Gas – Upstream" as the industry classification
4. WHEN the upstream tenant is selected THEN the system SHALL set this tenant as the default for APM development mode
5. WHEN upstream tenant context is active THEN the system SHALL apply sector metadata "Oil & Gas" and subsector metadata "Upstream" to the application context

### Requirement 2

**User Story:** As an upstream asset manager, I want to view realistic upstream assets in the asset lists, so that I can monitor wellheads, pumps, compressors, and other upstream equipment.

#### Acceptance Criteria

1. WHEN the upstream tenant is selected THEN the system SHALL display Wellhead WH-01 with location "Pad A" and criticality "High"
2. WHEN the upstream tenant is selected THEN the system SHALL display ESP Pump ESP-07 with location "Pad B" and criticality "High"
3. WHEN the upstream tenant is selected THEN the system SHALL display Gas Compressor GC-11 with location "Central Facility" and criticality "High"
4. WHEN the upstream tenant is selected THEN the system SHALL display Crude Transfer Pump P-21 with location "Pad A" and criticality "Medium"
5. WHEN the upstream tenant is selected THEN the system SHALL display Flare Knock-Out Drum KO-03 with location "Central Facility" and criticality "Medium"

### Requirement 3

**User Story:** As an upstream operations engineer, I want to access real-time condition monitoring for upstream assets, so that I can track pressure, temperature, flow rates, and other critical parameters.

#### Acceptance Criteria

1. WHEN navigating to condition monitoring THEN the system SHALL display all upstream assets with their current health index and anomaly state
2. WHEN selecting a wellhead asset THEN the system SHALL display pressure, temperature, and flow rate telemetry data
3. WHEN selecting an ESP pump asset THEN the system SHALL display motor current, intake pressure, discharge pressure, and vibration telemetry data
4. WHEN selecting a gas compressor asset THEN the system SHALL display suction pressure, discharge pressure, gas temperature, and vibration telemetry data
5. WHEN viewing asset telemetry THEN the system SHALL display sector/subsector badges showing "Oil & Gas" and "Upstream"

### Requirement 4

**User Story:** As a maintenance engineer, I want to access root cause diagnostics for upstream equipment failures, so that I can identify likely causes and corrective actions.

#### Acceptance Criteria

1. WHEN navigating to root cause diagnostics THEN the system SHALL display a list of recent upstream alerts with mock data
2. WHEN selecting an alert THEN the system SHALL display the fault title in the right panel
3. WHEN viewing fault details THEN the system SHALL display a list of likely causes based on upstream equipment knowledge
4. WHEN viewing fault details THEN the system SHALL display suggested corrective actions specific to upstream operations
5. WHEN accessing root cause features THEN the system SHALL maintain the nLVE pattern with upstream-specific content

### Requirement 5

**User Story:** As a reliability engineer, I want to view machine learning failure predictions for upstream assets, so that I can proactively plan maintenance activities.

#### Acceptance Criteria

1. WHEN navigating to ML failure prediction THEN the system SHALL display all upstream assets with failure probability percentages
2. WHEN viewing failure predictions THEN the system SHALL display RUL estimates for each asset
3. WHEN viewing failure predictions THEN the system SHALL display risk levels with color-coded indicators
4. WHEN accessing prediction features THEN the system SHALL use mock data without requiring actual ML implementation
5. WHEN viewing predictions THEN the system SHALL maintain upstream asset context and metadata

### Requirement 6

**User Story:** As a maintenance planner, I want to view remaining useful life estimates for upstream equipment, so that I can schedule maintenance before failures occur.

#### Acceptance Criteria

1. WHEN navigating to RUL estimation THEN the system SHALL display RUL trend cards for upstream pumps, compressors, and wellheads
2. WHEN viewing RUL data THEN the system SHALL display confidence interval placeholders for each estimate
3. WHEN viewing RUL trends THEN the system SHALL display asset-level degradation markers
4. WHEN accessing RUL features THEN the system SHALL use mock data for all calculations and predictions
5. WHEN viewing RUL information THEN the system SHALL maintain upstream-specific asset context

### Requirement 7

**User Story:** As a user navigating the APM features, I want the existing navigation structure to remain unchanged while supporting upstream context, so that the interface remains consistent and familiar.

#### Acceptance Criteria

1. WHEN accessing APM features THEN the system SHALL preserve all existing feature sets under the Monitor area
2. WHEN navigating APM features THEN the system SHALL maintain canonical routing patterns for all feature paths
3. WHEN using APM navigation THEN the system SHALL apply sector metadata "Oil & Gas" and subsector metadata "Upstream" to all features
4. WHEN viewing APM features THEN the system SHALL display appropriate icons (HeartPulse, Brain, TrendingUp, Database, FileBarChart) for each feature set
5. WHEN accessing any APM feature THEN the system SHALL include industry tags for future filtering capabilities

### Requirement 8

**User Story:** As a user viewing upstream asset data, I want to see upstream-specific KPI cards and visualizations, so that I can monitor the most relevant parameters for oil and gas operations.

#### Acceptance Criteria

1. WHEN viewing wellhead assets THEN the system SHALL display KPI cards for flow rate, pressure, and temperature
2. WHEN viewing ESP pump assets THEN the system SHALL display KPI cards for motor current, intake pressure, discharge pressure, and vibration
3. WHEN viewing compressor assets THEN the system SHALL display KPI cards for suction pressure, discharge pressure, gas temperature, and vibration
4. WHEN viewing any upstream asset THEN the system SHALL display mock time-series line charts for key process variables
5. WHEN viewing asset conditions THEN the system SHALL display condition summary with Normal/Warning/Critical states based on mock thresholds

### Requirement 9

**User Story:** As a developer maintaining the platform, I want the APM architecture to remain generic and reusable, so that other sectors can be easily added without architectural changes.

#### Acceptance Criteria

1. WHEN implementing upstream features THEN the system SHALL preserve the existing generic APM logic and architecture
2. WHEN adding upstream context THEN the system SHALL not create new Monitor areas but extend the existing one
3. WHEN implementing upstream features THEN the system SHALL maintain the nLVE pattern across all new pages
4. WHEN adding upstream data THEN the system SHALL use the existing mock data system without backend integration
5. WHEN extending APM features THEN the system SHALL ensure all pages load without errors under the upstream tenant context
