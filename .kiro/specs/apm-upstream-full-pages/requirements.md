# Requirements Document

## Introduction

This document specifies the requirements for implementing functional nLVE (Navigate-List-View-Edit) pages for all APM (Asset Performance Management) feature sets and features under the existing Monitor section, contextualized to Oil & Gas – Upstream operations. The implementation will replace placeholder pages with fully functional interfaces using mock-first data and reusable UI patterns, providing a comprehensive demonstration of APM capabilities for upstream oil and gas operations.

## Glossary

- **APM**: Asset Performance Management - systematic approach to monitoring and optimizing physical asset performance, reliability, and availability
- **nLVE Pattern**: Navigate-List-View-Edit layout pattern with MenuPane → ListPane → WorkPane → optional PopPane
- **Upstream**: Oil & Gas upstream operations including wellheads, pumps, compressors, and production facilities
- **Mock-First**: Development approach using realistic mock data without backend dependencies
- **Asset Health Index**: Composite score (0-100) representing overall asset condition based on multiple factors
- **RUL**: Remaining Useful Life - estimated time until asset failure or maintenance requirement
- **FMEA**: Failure Mode and Effects Analysis - systematic method for evaluating potential failure modes
- **MTBF**: Mean Time Between Failures - average time between asset failures
- **MTTR**: Mean Time To Repair - average time required to repair failed assets
- **Criticality Score**: Risk-based ranking considering safety, production, and environmental impacts
- **Telemetry**: Real-time sensor data from upstream assets including pressure, temperature, vibration, and flow measurements
- **WorkPane**: Main content area displaying detailed information for selected items
- **ListPane**: Left panel displaying filterable lists of assets, events, or work orders
- **PopPane**: Modal overlay for detailed forms or additional information

## Requirements

### Requirement 1

**User Story:** As a plant manager, I want to view upstream tenant data with realistic Oil & Gas assets, so that I can evaluate APM capabilities in a relevant operational context.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL provide access to tenant "GulfUpstream Demo" with industry "Oil & Gas – Upstream"
2. WHEN upstream tenant is selected THEN the system SHALL display five upstream assets: Wellhead WH-01, ESP Pump ESP-07, Gas Compressor GC-11, Crude Transfer Pump P-21, and Flare KO Drum KO-03
3. WHEN upstream assets are displayed THEN the system SHALL show asset type, location, and criticality level for each asset
4. WHEN upstream context is active THEN the system SHALL apply sector badge "Oil & Gas" and subsector badge "Upstream" throughout the interface
5. WHEN asset data is accessed THEN the system SHALL provide realistic telemetry parameters appropriate for each upstream asset type

### Requirement 2

**User Story:** As an operations engineer, I want to access realistic telemetry data for upstream assets, so that I can monitor current conditions and historical trends.

#### Acceptance Criteria

1. WHEN telemetry data is requested for any upstream asset THEN the system SHALL provide pressure, temperature, vibration, flow rate, motor current, suction pressure, discharge pressure, and choke position measurements
2. WHEN historical telemetry is displayed THEN the system SHALL provide at least 24 hours of data points with realistic value ranges for each asset type
3. WHEN current values are shown THEN the system SHALL provide last-value convenience fields for KPI card displays
4. WHEN asset-specific parameters are requested THEN the system SHALL return telemetry appropriate for asset type (wellhead parameters for wellheads, pump parameters for pumps, compressor parameters for compressors)
5. WHEN telemetry trends are displayed THEN the system SHALL show realistic variation patterns consistent with upstream operations

### Requirement 3

**User Story:** As a condition monitoring specialist, I want to view real-time asset conditions with health scoring, so that I can identify assets requiring attention.

#### Acceptance Criteria

1. WHEN condition monitoring page is accessed THEN the system SHALL display upstream assets with current health index scores and anomaly indicators
2. WHEN an asset is selected THEN the system SHALL show asset header with name, type, location, and sector/subsector badges
3. WHEN asset-specific KPIs are displayed THEN the system SHALL show parameters relevant to asset type (flow/pressure/temperature for wellheads, current/pressures/vibration for ESPs, pressures/temperature/vibration for compressors)
4. WHEN trend charts are shown THEN the system SHALL display mini time-series charts for key process variables with realistic data patterns
5. WHEN condition summary is displayed THEN the system SHALL show Normal/Warning/Critical status based on threshold-based evaluation of telemetry data

### Requirement 4

**User Story:** As a maintenance engineer, I want to access fault diagnostics with upstream-specific root cause analysis, so that I can quickly identify and address equipment issues.

#### Acceptance Criteria

1. WHEN root cause diagnostics page is accessed THEN the system SHALL display recent upstream alerts and faults with asset associations
2. WHEN an alert is selected THEN the system SHALL display fault title, description, and timestamp in the WorkPane
3. WHEN root cause analysis is shown THEN the system SHALL provide likely causes based on upstream equipment knowledge and operational patterns
4. WHEN corrective actions are displayed THEN the system SHALL suggest specific actions appropriate for upstream operations and equipment types
5. WHEN supporting evidence is shown THEN the system SHALL reference relevant telemetry signals and operational context

### Requirement 5

**User Story:** As a reliability engineer, I want to access ML-based failure predictions with RUL estimates, so that I can plan predictive maintenance activities.

#### Acceptance Criteria

1. WHEN failure prediction page is accessed THEN the system SHALL display all upstream assets with failure probability percentages for multiple time horizons (7, 30, 90 days)
2. WHEN RUL estimation is shown THEN the system SHALL provide remaining useful life estimates in days with confidence intervals for each upstream asset
3. WHEN risk assessment is displayed THEN the system SHALL show color-coded risk levels (Low/Medium/High) based on failure probability and asset criticality
4. WHEN prediction details are accessed THEN the system SHALL show top failure modes predicted based on FMEA library data for each asset type
5. WHEN confidence metrics are shown THEN the system SHALL display model confidence indicators and last update timestamps using mock data

### Requirement 6

**User Story:** As an asset manager, I want to track asset performance metrics and reliability KPIs, so that I can optimize maintenance strategies and operational efficiency.

#### Acceptance Criteria

1. WHEN performance tracking is accessed THEN the system SHALL display uptime percentage, downtime hours, and availability metrics for each upstream asset over the last 30 days
2. WHEN reliability metrics are shown THEN the system SHALL provide MTBF, MTTR, MTTF calculations with trend indicators for upstream assets
3. WHEN downtime analysis is displayed THEN the system SHALL show planned versus unplanned downtime events with duration and reason codes
4. WHEN utilization metrics are accessed THEN the system SHALL display asset utilization versus rated capacity with load profile information
5. WHEN benchmark comparisons are shown THEN the system SHALL compare selected asset performance against best observed and target values for similar upstream equipment

### Requirement 7

**User Story:** As a system user, I want consistent navigation and routing that preserves existing APM structure, so that I can efficiently access all monitoring features.

#### Acceptance Criteria

1. WHEN APM features are accessed THEN the system SHALL maintain existing Monitor area structure without creating new top-level sections
2. WHEN navigation occurs THEN the system SHALL preserve routing structure and paths as defined in navigation.ts configuration
3. WHEN feature metadata is applied THEN the system SHALL add sector "Oil & Gas" and subsector "Upstream" metadata to APM features for future filtering
4. WHEN canonical routing is used THEN the system SHALL maintain established URL patterns for all APM feature paths
5. WHEN navigation structure is modified THEN the system SHALL preserve all existing feature sets and features under Monitor area

### Requirement 8

**User Story:** As a user interacting with APM pages, I want consistent nLVE layout patterns with upstream-specific content, so that I can efficiently navigate and analyze asset information.

#### Acceptance Criteria

1. WHEN any APM page loads THEN the system SHALL display ListPane with upstream assets filtered by current tenant context
2. WHEN asset selection occurs THEN the system SHALL update WorkPane content to show feature-specific information for the selected upstream asset
3. WHEN asset information is displayed THEN the system SHALL show asset name, type, location, criticality badge, health score, and anomaly indicators
4. WHEN WorkPane content is shown THEN the system SHALL present feature-specific widgets and data relevant to the selected asset and current APM feature
5. WHEN empty states occur THEN the system SHALL provide appropriate messaging and guidance for users when no assets or data are available

### Requirement 9

**User Story:** As a developer maintaining the system, I want reusable UI components and shared mock data contracts, so that APM pages can be built consistently without duplication.

#### Acceptance Criteria

1. WHEN APM pages are implemented THEN the system SHALL use shared APMPageShell component that accepts title, feature information, and data hooks
2. WHEN asset lists are displayed THEN the system SHALL use reusable APMAssetList component showing upstream assets with consistent formatting
3. WHEN mock data is accessed THEN the system SHALL provide centralized upstream tenant data, asset definitions, and telemetry through shared data contracts
4. WHEN UI widgets are used THEN the system SHALL provide reusable components for health cards, KPI grids, trend charts, alert lists, and other common APM interface elements
5. WHEN design consistency is maintained THEN the system SHALL use existing Plant4.0 design system with Tailwind CSS, shadcn/ui components, and Lucide icons
